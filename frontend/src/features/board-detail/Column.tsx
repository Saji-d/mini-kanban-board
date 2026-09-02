'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useState, type FormEvent } from 'react';
import { TaskCard } from './TaskCard';
import type { Column as ColumnType, Task } from '@/types/api';

const RAIL_COLORS = ['bg-rail-1', 'bg-rail-2', 'bg-rail-3', 'bg-rail-4'];

interface ColumnProps {
  column: ColumnType;
  railIndex: number;
  canEdit: boolean;
  onTaskClick: (task: Task) => void;
  onAddTask: (columnId: string, title: string) => Promise<void>;
  onRenameColumn: (columnId: string, name: string) => Promise<void>;
  onDeleteColumn: (columnId: string) => Promise<void>;
}

export function Column({
  column,
  railIndex,
  canEdit,
  onTaskClick,
  onAddTask,
  onRenameColumn,
  onDeleteColumn,
}: ColumnProps) {
  const { setNodeRef } = useDroppable({ id: column.id });
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(column.name);

  const railColor = RAIL_COLORS[railIndex % RAIL_COLORS.length];

  async function submitNewTask(e: FormEvent) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    await onAddTask(column.id, newTaskTitle.trim());
    setNewTaskTitle('');
    setIsAddingTask(false);
  }

  async function submitRename(e: FormEvent) {
    e.preventDefault();
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== column.name) {
      await onRenameColumn(column.id, trimmed);
    }
    setIsRenaming(false);
  }

  return (
    <div className="flex w-72 shrink-0 flex-col overflow-hidden rounded-lg border border-border bg-surface">
      <span className={`block h-[3px] w-full ${railColor}`} />
      <div className="flex flex-1 flex-col p-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          {isRenaming ? (
            <form onSubmit={submitRename} className="flex-1">
              <input
                autoFocus
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={submitRename}
                className="w-full rounded border border-accent bg-surface-2 px-1.5 py-0.5 font-display text-sm font-semibold text-ink focus:outline-none"
              />
            </form>
          ) : (
            <h3
              className={`font-display text-sm font-semibold tracking-tight text-ink ${canEdit ? 'cursor-text' : ''}`}
              onClick={() => canEdit && setIsRenaming(true)}
            >
              {column.name}
            </h3>
          )}
          <div className="flex items-center gap-1.5">
            <span className="rounded border border-border-strong bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-ink-muted">
              {column.tasks.length}
            </span>
            {canEdit && (
              <button
                type="button"
                aria-label={`Delete ${column.name} column`}
                onClick={() => {
                  if (confirm(`Delete column "${column.name}" and all its tasks?`)) {
                    onDeleteColumn(column.id);
                  }
                }}
                className="rounded p-0.5 text-ink-faint hover:bg-surface-2 hover:text-danger"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div ref={setNodeRef} className="flex min-h-[40px] flex-1 flex-col gap-2">
          <SortableContext
            items={column.tasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {column.tasks.map((task) => (
              <TaskCard key={task.id} task={task} canEdit={canEdit} onClick={() => onTaskClick(task)} />
            ))}
          </SortableContext>
          {column.tasks.length === 0 && (
            <div className="flex flex-1 items-center justify-center rounded-md border border-dashed border-border-strong py-6 font-mono text-[11px] uppercase tracking-wider text-ink-faint">
              Drop here
            </div>
          )}
        </div>

        {canEdit && (
          <div className="mt-2">
            {isAddingTask ? (
              <form onSubmit={submitNewTask} className="space-y-1.5">
                <input
                  autoFocus
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setIsAddingTask(false);
                  }}
                  placeholder="Task title"
                  className="w-full rounded border border-border-strong bg-surface-2 px-2 py-1.5 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
                />
                <div className="flex gap-1.5">
                  <button
                    type="submit"
                    className="rounded bg-accent px-2 py-1 text-xs font-medium text-accent-ink hover:bg-accent-hover"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingTask(false)}
                    className="rounded px-2 py-1 text-xs text-ink-muted hover:bg-surface-2"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingTask(true)}
                className="w-full rounded px-2 py-1.5 text-left text-xs font-medium text-ink-faint hover:bg-surface-2 hover:text-ink-muted"
              >
                + Add task
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
