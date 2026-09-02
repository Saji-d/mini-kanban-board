'use client';

import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Column } from './Column';
import { TaskCardContent } from './TaskCard';
import { TaskModal } from './TaskModal';
import { useCreateColumn, useDeleteColumn, useUpdateColumn } from '@/hooks/useColumns';
import { useCreateTask, useDeleteTask, useMoveTask, useUpdateTask } from '@/hooks/useTasks';
import { ApiError } from '@/lib/api-client';
import { useToast } from '@/lib/toast-context';
import type { BoardDetail, Column as ColumnType, Task } from '@/types/api';

interface KanbanBoardProps {
  boardId: string;
  board: BoardDetail;
  canEdit: boolean;
}

interface DragOrigin {
  taskId: string;
  columnId: string;
  index: number;
}

export function KanbanBoard({ boardId, board, canEdit }: KanbanBoardProps) {
  const [columns, setColumns] = useState<ColumnType[]>(board.columns);
  const isDraggingRef = useRef(false);
  const dragOriginRef = useRef<DragOrigin | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');

  const { showError } = useToast();
  const moveTask = useMoveTask(boardId);
  const createColumn = useCreateColumn(boardId);
  const updateColumn = useUpdateColumn(boardId);
  const deleteColumn = useDeleteColumn(boardId);
  const createTask = useCreateTask(boardId);
  const updateTask = useUpdateTask(boardId);
  const deleteTask = useDeleteTask(boardId);

  useEffect(() => {
    if (!isDraggingRef.current) {
      setColumns(board.columns);
    }
  }, [board.columns]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function findColumnByTaskId(cols: ColumnType[], taskId: string) {
    return cols.find((c) => c.tasks.some((t) => t.id === taskId));
  }
  function findColumn(cols: ColumnType[], id: string) {
    return cols.find((c) => c.id === id) ?? findColumnByTaskId(cols, id);
  }

  function onDragStart(event: DragStartEvent) {
    isDraggingRef.current = true;
    const activeId = String(event.active.id);
    const task = columns.flatMap((c) => c.tasks).find((t) => t.id === activeId);
    setActiveTask(task ?? null);

    const originColumn = findColumnByTaskId(columns, activeId);
    dragOriginRef.current = originColumn
      ? {
          taskId: activeId,
          columnId: originColumn.id,
          index: originColumn.tasks.findIndex((t) => t.id === activeId),
        }
      : null;
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    setColumns((prev) => {
      const sourceColumn = findColumnByTaskId(prev, activeId);
      const destColumn = findColumn(prev, overId);
      if (!sourceColumn || !destColumn || sourceColumn.id === destColumn.id) return prev;

      const activeTaskItem = sourceColumn.tasks.find((t) => t.id === activeId);
      if (!activeTaskItem) return prev;
      const overIndex = destColumn.tasks.findIndex((t) => t.id === overId);
      const insertIndex = overIndex >= 0 ? overIndex : destColumn.tasks.length;

      return prev.map((col) => {
        if (col.id === sourceColumn.id) {
          return { ...col, tasks: col.tasks.filter((t) => t.id !== activeId) };
        }
        if (col.id === destColumn.id) {
          const nextTasks = [...col.tasks];
          nextTasks.splice(insertIndex, 0, { ...activeTaskItem, columnId: col.id });
          return { ...col, tasks: nextTasks };
        }
        return col;
      });
    });
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    isDraggingRef.current = false;
    setActiveTask(null);

    const origin = dragOriginRef.current;
    dragOriginRef.current = null;
    if (!over || !origin) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // `columns` already reflects any cross-column transfer performed live by
    // onDragOver, so the task's CURRENT column is the real destination -
    // this only needs to resolve the final index within it, using `origin`
    // (captured at drag start) purely to detect a genuine no-op drop.
    const currentColumn = findColumnByTaskId(columns, activeId);
    if (!currentColumn) return;

    const currentIndex = currentColumn.tasks.findIndex((t) => t.id === activeId);
    const overIndex = currentColumn.tasks.findIndex((t) => t.id === overId);
    const finalIndex =
      overIndex >= 0 ? overIndex : Math.max(0, currentColumn.tasks.length - 1);

    if (currentIndex !== finalIndex) {
      setColumns((prev) =>
        prev.map((col) =>
          col.id === currentColumn.id
            ? { ...col, tasks: arrayMove(col.tasks, currentIndex, finalIndex) }
            : col,
        ),
      );
    }

    const isNoOp = origin.columnId === currentColumn.id && origin.index === finalIndex;
    if (isNoOp) return;

    moveTask.mutate(
      { taskId: activeId, destinationColumnId: currentColumn.id, targetIndex: finalIndex },
      {
        onError: (err) => {
          showError(err instanceof ApiError ? err.message : 'Could not move the task.');
        },
      },
    );
  }

  async function handleAddColumn(e: FormEvent) {
    e.preventDefault();
    if (!newColumnName.trim()) return;
    try {
      await createColumn.mutateAsync(newColumnName.trim());
      setNewColumnName('');
      setIsAddingColumn(false);
    } catch (err) {
      showError(err instanceof ApiError ? err.message : 'Could not create the column.');
    }
  }

  return (
    <div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((column, index) => (
            <Column
              key={column.id}
              column={column}
              railIndex={index}
              canEdit={canEdit}
              onTaskClick={setSelectedTask}
              onAddTask={async (columnId, title) => {
                try {
                  await createTask.mutateAsync({ columnId, title });
                } catch (err) {
                  showError(err instanceof ApiError ? err.message : 'Could not create the task.');
                }
              }}
              onRenameColumn={async (columnId, name) => {
                try {
                  await updateColumn.mutateAsync({ columnId, name });
                } catch (err) {
                  showError(err instanceof ApiError ? err.message : 'Could not rename the column.');
                }
              }}
              onDeleteColumn={async (columnId) => {
                try {
                  await deleteColumn.mutateAsync(columnId);
                } catch (err) {
                  showError(err instanceof ApiError ? err.message : 'Could not delete the column.');
                }
              }}
            />
          ))}

          {canEdit && (
            <div className="w-72 shrink-0">
              {isAddingColumn ? (
                <form
                  onSubmit={handleAddColumn}
                  className="rounded-lg border border-border-strong bg-surface p-3"
                >
                  <input
                    autoFocus
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setIsAddingColumn(false);
                    }}
                    placeholder="Column name"
                    className="w-full rounded border border-border-strong bg-surface-2 px-2 py-1.5 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
                  />
                  <div className="mt-2 flex gap-1.5">
                    <button
                      type="submit"
                      className="rounded bg-accent px-2 py-1 text-xs font-medium text-accent-ink hover:bg-accent-hover"
                    >
                      Add column
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingColumn(false)}
                      className="rounded px-2 py-1 text-xs text-ink-muted hover:bg-surface-2"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingColumn(true)}
                  className="w-full rounded-lg border border-dashed border-border-strong py-3 text-sm text-ink-faint transition-colors hover:border-ink-faint hover:text-ink-muted"
                >
                  + Add column
                </button>
              )}
            </div>
          )}

          {columns.length === 0 && !canEdit && (
            <p className="py-10 font-mono text-sm text-ink-faint">This board has no columns yet.</p>
          )}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="w-72 rotate-1 rounded-md border border-accent/50 bg-surface-3 py-2.5 pl-3.5 pr-3 shadow-2xl shadow-black/50">
              <TaskCardContent task={activeTask} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <TaskModal
        task={selectedTask}
        canEdit={canEdit}
        onClose={() => setSelectedTask(null)}
        onSave={async (input) => {
          if (!selectedTask) return;
          await updateTask.mutateAsync({ taskId: selectedTask.id, ...input });
        }}
        onDelete={async () => {
          if (!selectedTask) return;
          await deleteTask.mutateAsync(selectedTask.id);
        }}
      />
    </div>
  );
}
