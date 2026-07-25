import type { Task, TaskCreate, TaskUpdate } from "./tasks";
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