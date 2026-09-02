'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { FieldError, Input, Label, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useCreateBoard } from '@/hooks/useBoards';
import { ApiError } from '@/lib/api-client';
import { useToast } from '@/lib/toast-context';

export function CreateBoardModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const createBoard = useCreateBoard();
  const { showSuccess } = useToast();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createBoard.mutateAsync({ title, description: description || undefined });
      showSuccess('Board created');
      setTitle('');
      setDescription('');
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create the board.');
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New board">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="board-title">Title</Label>
          <Input id="board-title" required value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="board-description">Description (optional)</Label>
          <Textarea
            id="board-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <FieldError>{error}</FieldError>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={createBoard.isPending}>
            Create board
          </Button>
        </div>
      </form>
    </Modal>
  );
}
