'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { Spinner } from '@/components/ui/Spinner';
import { KanbanBoard } from '@/features/board-detail/KanbanBoard';
import { ShareBoardModal } from '@/features/board-detail/ShareBoardModal';
import { useBoard, useDeleteBoard } from '@/hooks/useBoard';
import { useMembers } from '@/hooks/useMembers';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { ApiError } from '@/lib/api-client';

export default function BoardDetailPage({ params }: { params: { boardId: string } }) {
  const { boardId } = params;
  const { user } = useAuth();
  const router = useRouter();
  const { showError } = useToast();
  const { data: board, isLoading, isError } = useBoard(boardId);
  const { data: members } = useMembers(boardId);
  const deleteBoard = useDeleteBoard(boardId);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const currentMembership = members?.find((m) => m.userId === user?.id);
  const role = currentMembership?.role ?? 'VIEWER';
  const canEdit = role === 'OWNER' || role === 'EDITOR';
  const isOwner = role === 'OWNER';

  async function handleDeleteBoard() {
    if (!confirm('Delete this board and everything on it? This cannot be undone.')) return;
    try {
      await deleteBoard.mutateAsync();
      router.push('/boards');
    } catch (err) {
      showError(err instanceof ApiError ? err.message : 'Could not delete the board.');
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (isError || !board) {
    return (
      <p className="rounded-md border border-danger/30 bg-surface p-4 text-sm text-danger">
        This board doesn&apos;t exist, or you don&apos;t have access to it.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-xl font-semibold tracking-tight text-ink">{board.title}</h1>
            <RoleBadge role={role} />
          </div>
          {board.description && <p className="mt-1 text-sm text-ink-muted">{board.description}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setIsShareOpen(true)}>
            Share
          </Button>
          {isOwner && (
            <Button variant="danger" size="sm" onClick={handleDeleteBoard} isLoading={deleteBoard.isPending}>
              Delete board
            </Button>
          )}
        </div>
      </div>

      <KanbanBoard boardId={boardId} board={board} canEdit={canEdit} />

      <ShareBoardModal
        boardId={boardId}
        isOwner={isOwner}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />
    </div>
  );
}
