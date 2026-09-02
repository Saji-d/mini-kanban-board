'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { BoardCard } from '@/features/boards/BoardCard';
import { CreateBoardModal } from '@/features/boards/CreateBoardModal';
import { useBoards } from '@/hooks/useBoards';

export default function BoardsPage() {
  const { data: boards, isLoading, isError } = useBoards();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint">Overview</p>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Your boards</h1>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>+ New board</Button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {isError && (
        <p className="rounded-md border border-danger/30 bg-surface p-4 text-sm text-danger">
          Could not load your boards. Please refresh the page.
        </p>
      )}

      {boards && boards.length === 0 && (
        <div className="rounded-lg border border-dashed border-border-strong bg-surface py-16 text-center">
          <p className="font-mono text-xs uppercase tracking-wider text-ink-faint">Nothing in transit</p>
          <p className="mt-1 text-sm text-ink-muted">You don&apos;t have any boards yet.</p>
          <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
            Create your first board
          </Button>
        </div>
      )}

      {boards && boards.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => (
            <BoardCard key={board.id} board={board} />
          ))}
        </div>
      )}

      <CreateBoardModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
}
