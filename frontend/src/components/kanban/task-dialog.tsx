import { useEffect, useState } from "react";
import { useOrganization } from "@clerk/tanstack-react-start";

import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import { STATUSES, type Task, type TaskCreate, type TaskPriority, type TaskStatus } from "../../lib/tasks";
import { SubtaskList } from "./subtask-list";
import { CommentSection } from "./comment-section";
import { ActivityLogSection } from "./activity-log";
import { Calendar } from "../ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "../../lib/utils";

export function TaskDialog({
  open,
  onOpenChange,
  onSubmit,
  initial,
  submitting,
  mode,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (data: TaskCreate) => void | Promise<void>;
  initial?: Task | { status?: TaskStatus };
  submitting?: boolean;
  mode: "create" | "edit";
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("pending");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [assignee, setAssignee] = useState<string>("unassigned");
  const [dueDate, setDueDate] = useState<string>("");

  const { memberships, isLoaded } = useOrganization({ memberships: true });

  useEffect(() => {
    if (!open) return;
    const asTask = initial as Task | undefined;
    setTitle(asTask?.title ?? "");
    setDescription(asTask?.description ?? "");
    setStatus(((asTask?.status) ?? (initial as { status?: TaskStatus })?.status ?? "pending") as TaskStatus);
    setPriority((asTask?.priority ?? "medium") as TaskPriority);
    setAssignee(asTask?.assignee ?? "unassigned");
    setDueDate(asTask?.due_date || "");
  }, [open, initial]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New task" : "Edit task"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Add a new task to your board." : "Update this task's details."}
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            onSubmit({ 
              title: title.trim(), 
              description: description.trim() || undefined, 
              status, 
              priority,
              assignee: assignee === "unassigned" ? null : assignee,
              due_date: dueDate ? new Date(dueDate).toISOString() : null
            } as any);
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ship v2 release" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Notes, context, links..." rows={4} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Assignee</Label>
              <Select value={assignee} onValueChange={setAssignee} disabled={!isLoaded}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {memberships?.data?.map((m) => (
                    <SelectItem key={m.publicUserData.userId} value={m.publicUserData.userId}>
                      {m.publicUserData.firstName} {m.publicUserData.lastName} ({m.publicUserData.identifier})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 flex flex-col justify-end">
              <Label htmlFor="due_date" className="mb-1.5">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal border-primary/20 hover:bg-primary/5 hover:text-primary transition-all rounded-xl",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-primary/70" />
                    {dueDate ? format(new Date(dueDate), "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-auto p-0 bg-background/60 backdrop-blur-xl border-primary/30 rounded-2xl shadow-xl overflow-hidden" 
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={dueDate ? new Date(dueDate) : undefined}
                    onSelect={(d) => setDueDate(d ? d.toISOString() : "")}
                    initialFocus
                    className="p-3"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {mode === "edit" && initial && "id" in initial && (
            <div className="pt-2">
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="w-full grid grid-cols-2 bg-primary/5">
                  <TabsTrigger value="details">Details & Comments</TabsTrigger>
                  <TabsTrigger value="activity">Activity Log</TabsTrigger>
                </TabsList>
                <TabsContent value="details" className="mt-4">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <SubtaskList task={initial as Task} />
                    <CommentSection task={initial as Task} />
                  </div>
                </TabsContent>
                <TabsContent value="activity" className="mt-4">
                  <ActivityLogSection task={initial as Task} />
                </TabsContent>
              </Tabs>
            </div>
          )}
          
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting || !title.trim()}>
              {mode === "create" ? "Create task" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}