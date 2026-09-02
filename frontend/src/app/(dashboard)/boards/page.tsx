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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Your boards</h1>
        <Button onClick={() => setIsCreateOpen(true)}>+ New board</Button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {isError && (
        <p className="rounded-lg bg-rose-50 p-4 text-sm text-rose-700">
          Could not load your boards. Please refresh the page.
        </p>
      )}

      {boards && boards.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <p className="text-sm text-slate-500">You don&apos;t have any boards yet.</p>
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
