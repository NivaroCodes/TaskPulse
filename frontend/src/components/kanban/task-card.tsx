import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2 } from "lucide-react";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { PRIORITY_LABEL, type Task } from "../../lib/tasks";

const priorityStyles: Record<string, string> = {
  low: "border-sky-500/40 bg-sky-500/10 text-sky-300",
  medium: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  high: "border-rose-500/40 bg-rose-500/10 text-rose-300",
};

export function TaskCard({
  task,
  canManage,
  onEdit,
  onDelete,
}: {
  task: Task;
  canManage: boolean;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: !canManage,
    data: { task },
  });

  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-lg border border-border/60 bg-card p-3 text-sm transition hover:border-primary/40",
        isDragging && "opacity-40",
      )}
    >
      <div className="flex items-start gap-2">
        {canManage && (
          <button
            {...attributes}
            {...listeners}
            className="mt-0.5 -ml-1 cursor-grab text-muted-foreground/50 opacity-0 transition group-hover:opacity-100 active:cursor-grabbing"
            aria-label="Drag"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <div className="font-medium leading-snug">{task.title}</div>
          {task.description && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
          )}
          <div className="mt-2 flex items-center gap-1.5">
            {task.priority && (
              <Badge variant="outline" className={cn("h-5 px-1.5 text-[10px] font-medium", priorityStyles[task.priority])}>
                {PRIORITY_LABEL[task.priority]}
              </Badge>
            )}
          </div>
        </div>

        {canManage && (
          <div className="flex flex-col gap-0.5 opacity-0 transition group-hover:opacity-100">
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onEdit(task)} aria-label="Edit">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => onDelete(task)} aria-label="Delete">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}