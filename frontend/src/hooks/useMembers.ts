import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import type { BoardMember, BoardRole } from '@/types/api';

function membersQueryKey(boardId: string) {
  return ['board', boardId, 'members'] as const;
}

export function useMembers(boardId: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: membersQueryKey(boardId),
    queryFn: () => apiClient.get<BoardMember[]>(`/boards/${boardId}/members`, token),
    enabled: !!token && !!boardId,
  });
}

export function useAddMember(boardId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; role: BoardRole }) =>
      apiClient.post<BoardMember>(`/boards/${boardId}/members`, input, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membersQueryKey(boardId) });
    },
  });
}

export function useUpdateMemberRole(boardId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: BoardRole }) =>
      apiClient.patch<BoardMember>(`/boards/${boardId}/members/${memberId}`, { role }, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membersQueryKey(boardId) });
    },
  });
}

export function useRemoveMember(boardId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) =>
      apiClient.delete<void>(`/boards/${boardId}/members/${memberId}`, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membersQueryKey(boardId) });
    },
  });
}
