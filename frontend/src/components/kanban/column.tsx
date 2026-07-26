import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";

import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import type { Task, TaskStatus } from "../../lib/tasks";

import { TaskCard } from "./task-card";

export function Column({
  status,
  label,
  hint,
  tasks,
  memberships,
  canManage,
  canDelete,
  onAdd,
  onEdit,
  onDelete,
}: {
  status: TaskStatus;
  label: string;
  hint: string;
  tasks: Task[];
  memberships: any;
  canManage: boolean;
  canDelete: boolean;
  onAdd: (status: TaskStatus) => void;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col:${status}` });

  return (
    <div
      className={cn(
        "flex h-full min-h-[60vh] w-[85vw] shrink-0 flex-col rounded-xl border border-border/60 bg-card/40 md:w-auto",
        isOver && "border-primary/60 bg-card/60",
      )}
    >
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "h-1.5 w-1.5 shrink-0 rounded-full",
              status === "pending" && "bg-muted-foreground",
              status === "started" && "bg-amber-400",
              status === "completed" && "bg-emerald-400",
            )}
          />
          <span className="truncate text-sm font-semibold">{label}</span>
          <span className="rounded-full bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
            {tasks.length}
          </span>
        </div>
        {canManage && (
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onAdd(status)} aria-label={`Add task to ${label}`}>
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div ref={setNodeRef} className="flex-1 space-y-2 overflow-y-auto px-2 pb-2">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 && (
            <div className="rounded-lg border border-dashed border-border/60 p-6 text-center text-xs text-muted-foreground">
              {hint}
            </div>
          )}
          {tasks.map((t) => (
            <TaskCard key={t.id} task={t} canManage={canManage} canDelete={canDelete} memberships={memberships} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}