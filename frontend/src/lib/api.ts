import type { Task, TaskCreate, TaskUpdate, Subtask, Comment, ActivityLog } from "./tasks";
import type { Invitation, InvitationCreate } from "./invitations";

const API_URL = (import.meta.env.VITE_API_URL as string) ?? "http://127.0.0.1:8000";

type GetToken = () => Promise<string | null>;

async function request<T>(
  path: string,
  init: RequestInit,
  getToken: GetToken,
  orgId?: string | null,
): Promise<T> {
  const token = await getToken();
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (orgId) headers.set("X-Organization-Id", orgId);

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    let msg = `Request failed: ${res.status}`;
    try {
      const body = await res.json();
      msg = body?.detail ?? body?.message ?? msg;
    } catch {}
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const tasksApi = {
  list: (getToken: GetToken, orgId: string) =>
    request<Task[]>("/api/tasks", { method: "GET" }, getToken, orgId),
  get: (getToken: GetToken, orgId: string, id: string) =>
    request<Task>(`/api/tasks/${id}`, { method: "GET" }, getToken, orgId),
  create: (getToken: GetToken, orgId: string, data: TaskCreate) =>
    request<Task>(
      "/api/tasks",
      { method: "POST", body: JSON.stringify(data) },
      getToken,
      orgId,
    ),
  update: (getToken: GetToken, orgId: string, id: string, data: TaskUpdate) =>
    request<Task>(
      `/api/tasks/${id}`,
      { method: "PUT", body: JSON.stringify(data) },
      getToken,
      orgId,
    ),
  remove: (getToken: GetToken, orgId: string, id: string) =>
    request<void>(`/api/tasks/${id}`, { method: "DELETE" }, getToken, orgId),
  createSubtask: (getToken: GetToken, orgId: string, taskId: string, data: { title: string; is_completed?: boolean }) =>
    request<Subtask>(
      `/api/tasks/${taskId}/subtasks`,
      { method: "POST", body: JSON.stringify(data) },
      getToken,
      orgId,
    ),
  updateSubtask: (getToken: GetToken, orgId: string, taskId: string, subtaskId: string, data: { title?: string; is_completed?: boolean }) =>
    request<Subtask>(
      `/api/tasks/${taskId}/subtasks/${subtaskId}`,
      { method: "PUT", body: JSON.stringify(data) },
      getToken,
      orgId,
    ),
  removeSubtask: (getToken: GetToken, orgId: string, taskId: string, subtaskId: string) =>
    request<void>(`/api/tasks/${taskId}/subtasks/${subtaskId}`, { method: "DELETE" }, getToken, orgId),
  createComment: (getToken: GetToken, orgId: string, taskId: string, data: { content: string }) =>
    request<Comment>(
      `/api/tasks/${taskId}/comments`,
      { method: "POST", body: JSON.stringify(data) },
      getToken,
      orgId,
    ),
  getActivity: (getToken: GetToken, orgId: string, taskId: string) =>
    request<ActivityLog[]>(`/api/tasks/${taskId}/activity`, { method: "GET" }, getToken, orgId),
};

export const invitationsApi = {
  send: (getToken: GetToken, orgId: string, data: InvitationCreate) =>
    request<Invitation>(
      `/api/organizations/${orgId}/invitations`,
      { method: "POST", body: JSON.stringify(data) },
      getToken,
      orgId,
    ),
  get: (getToken: GetToken, token: string) =>
    request<Invitation>(`/api/invitations/${token}`, { method: "GET" }, getToken),
  accept: (getToken: GetToken, token: string) =>
    request<Invitation>(`/api/invitations/${token}/accept`, { method: "POST" }, getToken),
  decline: (getToken: GetToken, token: string) =>
    request<Invitation>(`/api/invitations/${token}/decline`, { method: "POST" }, getToken),
};

export const organizationsApi = {
  canCreate: (getToken: GetToken) =>
    request<{ can_create: boolean }>("/api/organizations/can-create", { method: "GET" }, getToken),
  getPlan: (getToken: GetToken, orgId: string) =>
    request<{ plan: string }>(`/api/organizations/${orgId}/plan`, { method: "GET" }, getToken, orgId),
};

export const paymentsApi = {
  createStripeCheckout: (getToken: GetToken, orgId: string, plan: string) =>
    request<{url: string}>(`/api/payments/stripe/create-checkout?org_id=${orgId}&plan=${plan}`, { method: "POST" }, getToken, orgId),
  createKaspiInvoice: (getToken: GetToken, orgId: string, plan: string) =>
    request<{url: string}>(`/api/payments/kaspi/create-invoice?org_id=${orgId}&plan=${plan}`, { method: "POST" }, getToken, orgId),
};

export const analyticsApi = {
  get: (getToken: GetToken, orgId: string) =>
    request<any>(`/api/analytics/${orgId}`, { method: "GET" }, getToken, orgId),
};