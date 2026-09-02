import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { boardQueryKey } from './useBoard';
import type { BoardDetail, Task } from '@/types/api';

export function useCreateTask(boardId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { columnId: string; title: string; description?: string }) =>
      apiClient.post<Task>(`/boards/${boardId}/tasks`, input, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardQueryKey(boardId) });
    },
  });
}

export function useUpdateTask(boardId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      ...input
    }: {
      taskId: string;
      title?: string;
      description?: string;
    }) => apiClient.patch<Task>(`/boards/${boardId}/tasks/${taskId}`, input, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardQueryKey(boardId) });
    },
  });
}

export function useDeleteTask(boardId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) =>
      apiClient.delete<void>(`/boards/${boardId}/tasks/${taskId}`, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardQueryKey(boardId) });
    },
  });
}

interface MoveVars {
  taskId: string;
  destinationColumnId: string;
  targetIndex: number;
}

function applyOptimisticMove(board: BoardDetail, vars: MoveVars): BoardDetail {
  let movedTask: Task | undefined;
  const columnsWithoutTask = board.columns.map((column) => {
    const task = column.tasks.find((t) => t.id === vars.taskId);
    if (!task) return column;
    movedTask = task;
    return { ...column, tasks: column.tasks.filter((t) => t.id !== vars.taskId) };
  });

  if (!movedTask) return board;

  const columns = columnsWithoutTask.map((column) => {
    if (column.id !== vars.destinationColumnId) return column;
    const tasks = [...column.tasks];
    const index = Math.max(0, Math.min(vars.targetIndex, tasks.length));
    tasks.splice(index, 0, { ...movedTask!, columnId: column.id });
    return { ...column, tasks };
  });

  return { ...board, columns };
}

export function useMoveTask(boardId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = boardQueryKey(boardId);

  return useMutation({
    mutationFn: (vars: MoveVars) =>
      apiClient.patch<Task>(
        `/boards/${boardId}/tasks/${vars.taskId}/move`,
        { destinationColumnId: vars.destinationColumnId, targetIndex: vars.targetIndex },
        token,
      ),
    onMutate: async (vars: MoveVars) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<BoardDetail>(queryKey);
      if (previous) {
        queryClient.setQueryData<BoardDetail>(queryKey, applyOptimisticMove(previous, vars));
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
