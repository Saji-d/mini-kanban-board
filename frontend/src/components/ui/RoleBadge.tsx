import clsx from 'clsx';
import type { BoardRole } from '@/types/api';

const styles: Record<BoardRole, string> = {
  OWNER: 'bg-amber-100 text-amber-800',
  EDITOR: 'bg-indigo-100 text-indigo-800',
  VIEWER: 'bg-slate-100 text-slate-600',
};

export function RoleBadge({ role }: { role: BoardRole }) {
  return (
    <span className={clsx('rounded-full px-2 py-0.5 text-[11px] font-medium', styles[role])}>
      {role.charAt(0) + role.slice(1).toLowerCase()}
    </span>
  );
}
