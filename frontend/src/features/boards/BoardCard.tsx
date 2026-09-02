import Link from 'next/link';
import { RoleBadge } from '@/components/ui/RoleBadge';
import type { BoardSummary } from '@/types/api';

export function BoardCard({ board }: { board: BoardSummary }) {
  return (
    <Link
      href={`/boards/${board.id}`}
      className="group relative flex flex-col justify-between overflow-hidden rounded-lg border border-border bg-surface p-4 transition-colors hover:border-border-strong hover:bg-surface-2"
    >
      <span className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-accent transition-transform duration-200 group-hover:scale-x-100" />
      <div>
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="font-display font-medium tracking-tight text-ink group-hover:text-accent">
            {board.title}
          </h3>
          <RoleBadge role={board.role} />
        </div>
        {board.description && (
          <p className="line-clamp-2 text-sm text-ink-muted">{board.description}</p>
        )}
      </div>
      <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-ink-faint">
        Updated {new Date(board.updatedAt).toLocaleDateString()}
      </p>
    </Link>
  );
}
