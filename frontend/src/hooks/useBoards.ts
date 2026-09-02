import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import type { BoardSummary } from '@/types/api';

export function useBoards() {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['boards'],
    queryFn: () => apiClient.get<BoardSummary[]>('/boards', token),
    enabled: !!token,
  });
}

export function useCreateBoard() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { title: string; description?: string }) =>
      apiClient.post<BoardSummary>('/boards', input, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
  });
}
