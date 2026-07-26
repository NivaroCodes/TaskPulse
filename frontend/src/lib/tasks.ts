export type TaskStatus = "pending" | "started" | "completed";
export type TaskPriority = "low" | "medium" | "high";

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  org_id: string;
  task_id: string;
  user_id: string;
  action: string;
  details?: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  org_id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority?: TaskPriority | null;
  assignee?: string | null;
  due_date?: string | null;
  created_at?: string;
  updated_at?: string;
  subtasks?: Subtask[];
  comments?: Comment[];
}

export interface TaskCreate {
  title: string;
  description?: string;
  status: TaskStatus;
  priority?: TaskPriority;
  assignee?: string | null;
  due_date?: string | null;
  org_id: string;
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