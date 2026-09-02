'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useState, type FormEvent } from 'react';
import { TaskCard } from './TaskCard';
import type { Column as ColumnType, Task } from '@/types/api';

interface ColumnProps {
  column: ColumnType;
  canEdit: boolean;
  onTaskClick: (task: Task) => void;
  onAddTask: (columnId: string, title: string) => Promise<void>;
  onRenameColumn: (columnId: string, name: string) => Promise<void>;
  onDeleteColumn: (columnId: string) => Promise<void>;
}

export function Column({
  column,
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
    <div className="flex w-72 shrink-0 flex-col rounded-xl bg-slate-100/80 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        {isRenaming ? (
          <form onSubmit={submitRename} className="flex-1">
            <input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={submitRename}
              className="w-full rounded-md border border-indigo-300 px-1.5 py-0.5 text-sm font-semibold text-slate-800 focus:outline-none"
            />
          </form>
        ) : (
          <h3
            className={`text-sm font-semibold text-slate-700 ${canEdit ? 'cursor-text' : ''}`}
            onClick={() => canEdit && setIsRenaming(true)}
          >
            {column.name}
          </h3>
        )}
        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[11px] text-slate-500">
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
              className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-rose-600"
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
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-slate-300 py-6 text-xs text-slate-400">
            Drop tasks here
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
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
              />
              <div className="flex gap-1.5">
                <button
                  type="submit"
                  className="rounded-md bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-500"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingTask(false)}
                  className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingTask(true)}
              className="w-full rounded-md px-2 py-1.5 text-left text-xs font-medium text-slate-500 hover:bg-slate-200"
            >
              + Add task
            </button>
          )}
        </div>
      )}
    </div>
  );
}
