'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import clsx from 'clsx';
import type { Task } from '@/types/api';

export function TaskCardContent({ task }: { task: Task }) {
  return (
    <>
      <p className="text-sm font-medium text-slate-800">{task.title}</p>
      {task.description && (
        <p className="mt-1 line-clamp-2 text-xs text-slate-500">{task.description}</p>
      )}
    </>
  );
}

interface TaskCardProps {
  task: Task;
  canEdit: boolean;
  onClick: () => void;
}

export function TaskCard({ task, canEdit, onClick }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: !canEdit,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(canEdit ? attributes : {})}
      {...(canEdit ? listeners : {})}
      onClick={onClick}
      role="button"
      tabIndex={0}
      className={clsx(
        'rounded-lg border border-slate-200 bg-white p-3 shadow-sm outline-none transition-shadow hover:border-indigo-300 hover:shadow focus-visible:ring-2 focus-visible:ring-indigo-400',
        canEdit ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
      )}
    >
      <TaskCardContent task={task} />
    </div>
  );
}
