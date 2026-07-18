export type TaskStatus = "pending" | "started" | "completed";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  org_id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority?: TaskPriority | null;
  assignee?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface TaskCreate {
  title: string;
  description?: string;
  status: TaskStatus;
  priority?: TaskPriority;
}

export interface TaskUpdate extends Partial<TaskCreate> {}

export const STATUSES: { id: TaskStatus; label: string; hint: string }[] = [
  { id: "pending", label: "To do", hint: "Ideas & incoming work" },
  { id: "started", label: "In progress", hint: "Actively being worked on" },
  { id: "completed", label: "Done", hint: "Shipped and closed" },
];

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};