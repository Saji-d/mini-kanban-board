'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { FieldError, Input, Label, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ApiError } from '@/lib/api-client';
import type { Task } from '@/types/api';

interface TaskModalProps {
  task: Task | null;
  canEdit: boolean;
  onClose: () => void;
  onSave: (input: { title: string; description?: string }) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function TaskModal({ task, canEdit, onClose, onSave, onDelete }: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? '');
      setError(null);
    }
  }, [task]);

  if (!task) return null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      await onSave({ title, description: description || undefined });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save the task.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this task?')) return;
    setIsDeleting(true);
    try {
      await onDelete();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete the task.');
      setIsDeleting(false);
    }
  }

  return (
    <Modal isOpen={!!task} onClose={onClose} title={canEdit ? 'Edit task' : 'Task details'}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="task-title">Title</Label>
          <Input
            id="task-title"
            required
            disabled={!canEdit}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="task-description">Description</Label>
          <Textarea
            id="task-description"
            disabled={!canEdit}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <FieldError>{error}</FieldError>
        {canEdit && (
          <div className="flex justify-between gap-2">
            <Button type="button" variant="danger" isLoading={isDeleting} onClick={handleDelete}>
              Delete
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSaving}>
                Save
              </Button>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
