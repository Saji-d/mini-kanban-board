import Link from 'next/link';
import { RoleBadge } from '@/components/ui/RoleBadge';
import type { BoardSummary } from '@/types/api';

export function BoardCard({ board }: { board: BoardSummary }) {
  return (
    <Link
      href={`/boards/${board.id}`}
      className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div>
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="font-medium text-slate-900 group-hover:text-indigo-600">{board.title}</h3>
          <RoleBadge role={board.role} />
        </div>
        {board.description && (
          <p className="line-clamp-2 text-sm text-slate-500">{board.description}</p>
        )}
      </div>
      <p className="mt-4 text-xs text-slate-400">
        Updated {new Date(board.updatedAt).toLocaleDateString()}
      </p>
    </Link>
  );
}
