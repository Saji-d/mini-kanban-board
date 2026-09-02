'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import clsx from 'clsx';
import { relativeTime } from '@/lib/format-time';
import type { Task } from '@/types/api';

export function TaskCardContent({ task }: { task: Task }) {
  return (
    <>
      <p className="text-sm font-medium leading-snug text-ink">{task.title}</p>
      {task.description && (
        <p className="mt-1 line-clamp-2 text-xs text-ink-muted">{task.description}</p>
      )}
      <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-ink-faint">
        {task.id.slice(-6)} · {relativeTime(task.createdAt)}
      </p>
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
        'group relative overflow-hidden rounded-md border border-border bg-surface-2 py-2.5 pl-3.5 pr-3 outline-none transition-all hover:border-border-strong hover:bg-surface-3',
        'focus-visible:ring-2 focus-visible:ring-accent',
        canEdit ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
      )}
    >
      <span className="absolute inset-y-0 left-0 w-[3px] bg-border-strong transition-colors group-hover:bg-accent" />
      <TaskCardContent task={task} />
    </div>
  );
}
