import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import type { BoardDetail } from '@/types/api';

export function boardQueryKey(boardId: string) {
  return ['board', boardId] as const;
}

export function useBoard(boardId: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: boardQueryKey(boardId),
    queryFn: () => apiClient.get<BoardDetail>(`/boards/${boardId}`, token),
    enabled: !!token && !!boardId,
  });
}

export function useUpdateBoard(boardId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { title?: string; description?: string }) =>
      apiClient.patch<BoardDetail>(`/boards/${boardId}`, input, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardQueryKey(boardId) });
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
  });
}

export function useDeleteBoard(boardId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.delete<void>(`/boards/${boardId}`, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
  });
}
