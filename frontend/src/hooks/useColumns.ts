import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { boardQueryKey } from './useBoard';
import type { Column } from '@/types/api';

export function useCreateColumn(boardId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      apiClient.post<Column>(`/boards/${boardId}/columns`, { name }, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardQueryKey(boardId) });
    },
  });
}

export function useUpdateColumn(boardId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ columnId, name }: { columnId: string; name: string }) =>
      apiClient.patch<Column>(`/boards/${boardId}/columns/${columnId}`, { name }, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardQueryKey(boardId) });
    },
  });
}

export function useDeleteColumn(boardId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (columnId: string) =>
      apiClient.delete<void>(`/boards/${boardId}/columns/${columnId}`, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardQueryKey(boardId) });
    },
  });
}
