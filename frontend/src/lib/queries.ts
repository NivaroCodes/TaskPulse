import { useAuth, useOrganization } from "@clerk/tanstack-react-start";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { tasksApi } from "./api";
import type { Task, TaskCreate, TaskUpdate } from "./tasks";

export function useOrgId(): string | null {
  const { organization } = useOrganization();
  return organization?.id ?? null;
}

export function useTasks() {
  const { getToken } = useAuth();
  const orgId = useOrgId();
  return useQuery<Task[]>({
    queryKey: ["tasks", orgId],
    enabled: !!orgId,
    queryFn: () => tasksApi.list(getToken, orgId!),
  });
}

export function useCreateTask() {
  const { getToken } = useAuth();
  const orgId = useOrgId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TaskCreate) => tasksApi.create(getToken, orgId!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks", orgId] });
      toast.success("Task created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateTask() {
  const { getToken } = useAuth();
  const orgId = useOrgId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TaskUpdate }) =>
      tasksApi.update(getToken, orgId!, id, data),
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: ["tasks", orgId] });
      const prev = qc.getQueryData<Task[]>(["tasks", orgId]);
      if (prev) {
        qc.setQueryData<Task[]>(
          ["tasks", orgId],
          prev.map((t) => (t.id === id ? { ...t, ...data } : t)),
        );
      }
      return { prev };
    },
    onError: (e: Error, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["tasks", orgId], ctx.prev);
      toast.error(e.message);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["tasks", orgId] }),
  });
}

export function useDeleteTask() {
  const { getToken } = useAuth();
  const orgId = useOrgId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksApi.remove(getToken, orgId!, id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["tasks", orgId] });
      const prev = qc.getQueryData<Task[]>(["tasks", orgId]);
      if (prev) {
        qc.setQueryData<Task[]>(
          ["tasks", orgId],
          prev.filter((t) => t.id !== id),
        );
      }
      return { prev };
    },
    onError: (e: Error, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["tasks", orgId], ctx.prev);
      toast.error(e.message);
    },
    onSuccess: () => toast.success("Task deleted"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["tasks", orgId] }),
  });
}