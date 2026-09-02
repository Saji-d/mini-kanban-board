'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { FieldError, Input, Label } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { Spinner } from '@/components/ui/Spinner';
import { useAddMember, useMembers, useRemoveMember, useUpdateMemberRole } from '@/hooks/useMembers';
import { ApiError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import type { BoardRole } from '@/types/api';

export function ShareBoardModal({
  boardId,
  isOwner,
  isOpen,
  onClose,
}: {
  boardId: string;
  isOwner: boolean;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const { data: members, isLoading } = useMembers(boardId);
  const addMember = useAddMember(boardId);
  const updateRole = useUpdateMemberRole(boardId);
  const removeMember = useRemoveMember(boardId);
  const { showError, showSuccess } = useToast();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<BoardRole>('EDITOR');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await addMember.mutateAsync({ email, role });
      showSuccess(`${email} added to the board`);
      setEmail('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not add that member.');
    }
  }

  async function handleRoleChange(memberId: string, newRole: BoardRole) {
    try {
      await updateRole.mutateAsync({ memberId, role: newRole });
    } catch (err) {
      showError(err instanceof ApiError ? err.message : 'Could not update the role.');
    }
  }

  async function handleRemove(memberId: string) {
    if (!confirm('Remove this member from the board?')) return;
    try {
      await removeMember.mutateAsync(memberId);
    } catch (err) {
      showError(err instanceof ApiError ? err.message : 'Could not remove that member.');
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share board">
      {isOwner && (
        <form onSubmit={onSubmit} className="mb-4 space-y-2 border-b border-slate-100 pb-4">
          <Label htmlFor="member-email">Invite by email</Label>
          <div className="flex gap-2">
            <Input
              id="member-email"
              type="email"
              required
              placeholder="teammate@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as BoardRole)}
              className="rounded-lg border border-slate-300 px-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="EDITOR">Editor</option>
              <option value="VIEWER">Viewer</option>
            </select>
            <Button type="submit" size="sm" isLoading={addMember.isPending}>
              Add
            </Button>
          </div>
          <FieldError>{error}</FieldError>
        </form>
      )}

      {isLoading && (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      )}

      <ul className="space-y-2">
        {members?.map((member) => (
          <li key={member.id} className="flex items-center justify-between gap-2 text-sm">
            <div>
              <p className="font-medium text-slate-800">
                {member.user.name}
                {member.userId === user?.id && <span className="text-slate-400"> (you)</span>}
              </p>
              <p className="text-xs text-slate-500">{member.user.email}</p>
            </div>
            <div className="flex items-center gap-2">
              {isOwner ? (
                <select
                  value={member.role}
                  onChange={(e) => handleRoleChange(member.id, e.target.value as BoardRole)}
                  className="rounded-md border border-slate-300 px-1.5 py-0.5 text-xs focus:border-indigo-500 focus:outline-none"
                >
                  <option value="OWNER">Owner</option>
                  <option value="EDITOR">Editor</option>
                  <option value="VIEWER">Viewer</option>
                </select>
              ) : (
                <RoleBadge role={member.role} />
              )}
              {isOwner && (
                <button
                  onClick={() => handleRemove(member.id)}
                  aria-label={`Remove ${member.user.name}`}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                >
                  ✕
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
