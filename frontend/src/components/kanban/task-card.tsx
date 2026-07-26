import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2, Calendar, CheckSquare, MessageSquare } from "lucide-react";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { PRIORITY_LABEL, type Task, type Subtask } from "../../lib/tasks";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../ui/hover-card";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Checkbox } from "../ui/checkbox";
import { useAuth } from "@clerk/tanstack-react-start";
import { tasksApi } from "../../lib/api";
import { useQueryClient } from "@tanstack/react-query";

const priorityStyles: Record<string, string> = {
  low: "border-sky-500/40 bg-sky-500/10 text-sky-300",
  medium: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  high: "border-rose-500/40 bg-rose-500/10 text-rose-300",
};

export function TaskCard({
  task,
  canManage,
  canDelete,
  memberships,
  onEdit,
  onDelete,
}: {
  task: Task;
  canManage: boolean;
  canDelete: boolean;
  memberships?: any;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: !canManage,
    data: { task },
  });
  
  const { getToken, orgId } = useAuth();
  const queryClient = useQueryClient();

  const handleSubtaskToggle = async (subtask: Subtask, checked: boolean) => {
    if (!orgId) return;
    try {
      await tasksApi.updateSubtask(getToken, orgId, task.id, subtask.id, { is_completed: checked });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } catch (e) {
      console.error(e);
    }
  };

  const style = { transform: CSS.Transform.toString(transform), transition };

  const assigneeData = memberships?.find((m: any) => m.publicUserData.userId === task.assignee)?.publicUserData;
  const initials = assigneeData ? `${assigneeData.firstName?.[0] ?? ""}${assigneeData.lastName?.[0] ?? ""}`.toUpperCase() : "?";

  let isOverdue = false;
  let formattedDate = "";
  if (task.due_date) {
    const due = new Date(task.due_date);
    formattedDate = due.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    if (due < today && task.status !== "completed") {
      isOverdue = true;
    }
  }

  const completedSubtasks = task.subtasks?.filter(s => s.is_completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const totalComments = task.comments?.length || 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(canManage ? attributes : {})}
      {...(canManage ? listeners : {})}
      className={cn(
        "group relative rounded-lg border border-border/60 bg-card p-3 text-sm transition hover:border-primary/40",
        canManage && "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-40",
      )}
    >
      <div className="flex items-start gap-2">

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
            {task.due_date && (
              <div className={cn(
                "flex items-center gap-1 h-5 px-1.5 rounded-md border text-[10px] font-medium",
                isOverdue 
                  ? "border-destructive/40 bg-destructive/10 text-destructive" 
                  : "border-border/60 bg-muted/30 text-muted-foreground"
              )}>
                <Calendar className="w-3 h-3" />
                {formattedDate}
              </div>
            )}
            
            {totalSubtasks > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-1 h-5 px-1.5 rounded-md border border-border/60 bg-muted/30 text-[10px] font-medium text-muted-foreground hover:bg-muted/50 transition">
                    <CheckSquare className="w-3 h-3" />
                    {completedSubtasks}/{totalSubtasks}
                  </button>
                </PopoverTrigger>
                <PopoverContent side="bottom" className="w-64 p-3 z-50">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm border-b pb-1">Subtasks</h4>
                    <ul className="space-y-2 mt-2">
                      {task.subtasks?.map(st => (
                        <li key={st.id} className="flex items-center gap-2">
                          <Checkbox 
                            checked={st.is_completed} 
                            onCheckedChange={(c) => handleSubtaskToggle(st, !!c)}
                            className="h-4 w-4"
                          />
                          <span className={`text-sm ${st.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                            {st.title}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </PopoverContent>
              </Popover>
            )}
            
            {totalComments > 0 && (
              <HoverCard openDelay={200} closeDelay={200}>
                <HoverCardTrigger asChild>
                  <div className="flex items-center gap-1 h-5 px-1.5 rounded-md border border-border/60 bg-muted/30 text-[10px] font-medium text-muted-foreground cursor-help">
                    <MessageSquare className="w-3 h-3" />
                    {totalComments}
                  </div>
                </HoverCardTrigger>
                <HoverCardContent side="bottom" className="w-72 p-3 z-50">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm border-b pb-1">Comments</h4>
                    <div className="space-y-3 mt-2 max-h-[200px] overflow-y-auto">
                      {task.comments?.map(comment => {
                        const commenter = memberships?.find((m: any) => m.publicUserData.userId === comment.user_id)?.publicUserData;
                        const name = commenter ? `${commenter.firstName} ${commenter.lastName}` : "Unknown";
                        return (
                          <div key={comment.id} className="bg-muted/50 p-2 rounded-md text-sm">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-medium text-xs">{name}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(comment.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="whitespace-pre-wrap">{comment.content}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
            )}
            
            {assigneeData && (
              <Avatar className="h-6 w-6 border text-[10px]">
                <AvatarImage src={assigneeData.imageUrl} alt={assigneeData.firstName} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            )}
          </div>
        </div>

        {canManage && (
          <div className="flex flex-col gap-0.5 opacity-0 transition group-hover:opacity-100">
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onEdit(task)} aria-label="Edit">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            {canDelete && (
              <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => onDelete(task)} aria-label="Delete">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}