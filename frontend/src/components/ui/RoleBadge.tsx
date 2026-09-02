import clsx from 'clsx';
import type { BoardRole } from '@/types/api';

const styles: Record<BoardRole, { text: string; dot: string }> = {
  OWNER: { text: 'text-accent', dot: 'bg-accent' },
  EDITOR: { text: 'text-teal', dot: 'bg-teal' },
  VIEWER: { text: 'text-ink-muted', dot: 'bg-ink-faint' },
};

export function RoleBadge({ role }: { role: BoardRole }) {
  const s = styles[role];
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded border border-border-strong bg-surface-2 px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider',
        s.text,
      )}
    >
      <span className={clsx('h-1.5 w-1.5 rounded-full', s.dot)} />
      {role}
    </span>
  );
}
