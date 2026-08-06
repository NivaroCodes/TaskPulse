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
import { CalendarIcon, Sparkles, Eye, Edit3 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "../../lib/utils";
import { useImproveText } from "../../lib/queries";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

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
  const [isImproving, setIsImproving] = useState(false);
  const [isPreview, setIsPreview] = useState(false);

  const improveText = useImproveText();
  const { memberships, isLoaded } = useOrganization({ memberships: true });

  const handleAiImprove = async () => {
    if (!description.trim()) return;
    setIsImproving(true);
    try {
      const res = await improveText.mutateAsync({ text: description });
      if (res && res.improved_text) {
        setDescription(res.improved_text);
        setIsPreview(true);
        toast.success("Description polished by AI ✨");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsImproving(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const asTask = initial as Task | undefined;
    const initialDesc = asTask?.description ?? "";
    setTitle(asTask?.title ?? "");
    setDescription(initialDesc);
    setIsPreview(mode === "edit" && !!initialDesc.trim());
    setStatus(((asTask?.status) ?? (initial as { status?: TaskStatus })?.status ?? "pending") as TaskStatus);
    setPriority((asTask?.priority ?? "medium") as TaskPriority);
    setAssignee(asTask?.assignee ?? "unassigned");
    setDueDate(asTask?.due_date || "");
  }, [open, initial]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px] overflow-hidden p-5 sm:p-6 gap-3.5 shadow-2xl">
        <DialogHeader className="pb-0 space-y-0">
          <DialogTitle className="text-base font-bold">{mode === "create" ? "New task" : "Edit task"}</DialogTitle>
        </DialogHeader>

        <form
          className="space-y-3.5"
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
          <div className="space-y-1">
            <Label htmlFor="title" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Title</Label>
            <Input id="title" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ship v2 release" required className="h-8 text-xs font-semibold rounded-xl border-border/60 focus:border-purple-500/50" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="description" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Description</Label>
                <div className="inline-flex rounded-lg bg-muted/60 p-0.5 text-muted-foreground border border-border/40">
                  <button
                    type="button"
                    onClick={() => setIsPreview(false)}
                    className={cn(
                      "flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-md transition-all duration-200",
                      !isPreview ? "bg-background text-foreground shadow-xs font-semibold" : "hover:text-foreground"
                    )}
                  >
                    <Edit3 className="h-3 w-3" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPreview(true)}
                    disabled={!description.trim()}
                    className={cn(
                      "flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-md transition-all duration-200 disabled:opacity-40",
                      isPreview ? "bg-background text-foreground shadow-xs font-semibold text-primary" : "hover:text-foreground"
                    )}
                  >
                    <Eye className="h-3 w-3" /> Preview
                  </button>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isImproving || !description.trim()}
                onClick={handleAiImprove}
                className="h-6 text-[11px] font-semibold bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-teal-500/10 hover:from-blue-500/20 hover:via-cyan-500/20 hover:to-teal-500/20 border-cyan-500/30 text-cyan-600 dark:text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)] hover:shadow-[0_0_16px_rgba(6,182,212,0.4)] transition-all duration-300 rounded-full px-2.5"
              >
                <Sparkles className={`h-3 w-3 mr-1 text-cyan-500 ${isImproving ? "animate-spin" : "animate-pulse"}`} />
                {isImproving ? "Polishing..." : "AI Polish"}
              </Button>
            </div>
            {isPreview && description.trim() ? (
              <div 
                onClick={() => setIsPreview(false)} 
                title="Click anywhere to edit"
                className="h-[68px] overflow-y-auto rounded-xl border border-primary/25 bg-gradient-to-br from-background/95 via-primary/[0.02] to-background p-2.5 shadow-[inset_0_2px_12px_rgba(0,0,0,0.03)] hover:border-primary/45 cursor-text transition-all duration-200 group relative text-xs"
              >
                <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/50">
                  Click to edit
                </div>
                <ReactMarkdown
                  components={{
                    h3: ({ node, ...props }) => (
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 mt-2 mb-1 first:mt-0 flex items-center gap-1.5 border-b border-cyan-500/20 pb-1" {...props} />
                    ),
                    p: ({ node, ...props }) => (
                      <p className="text-xs text-foreground/90 leading-relaxed my-1" {...props} />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul className="space-y-1 my-1 list-none pl-0.5" {...props} />
                    ),
                    li: ({ node, ...props }) => (
                      <li className="flex items-start text-xs text-foreground/85 gap-2 before:content-['•'] before:text-cyan-500 before:font-black before:text-base before:leading-none before:-mt-0.5" {...props} />
                    ),
                    strong: ({ node, ...props }) => (
                      <strong className="font-bold text-foreground bg-cyan-500/10 dark:bg-cyan-500/20 px-1.5 py-0.5 rounded text-[11px] border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 inline-block mr-1" {...props} />
                    ),
                    blockquote: ({ node, ...props }) => (
                      <blockquote className="p-2 my-1.5 bg-cyan-500/10 border-l-4 border-cyan-500 rounded-r-xl text-xs text-foreground/90 italic shadow-xs flex flex-col gap-1" {...props} />
                    ),
                  }}
                >
                  {description}
                </ReactMarkdown>
              </div>
            ) : (
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Notes, context, links... or write rough keywords and click AI Polish!" rows={3} className="h-[68px] rounded-xl border-border/60 focus:border-purple-500/50 text-xs leading-relaxed transition-all resize-none p-2.5" />
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                <SelectTrigger className="h-8 text-xs rounded-xl border-border/60"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger className="h-8 text-xs rounded-xl border-border/60"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Assignee</Label>
              <Select value={assignee} onValueChange={setAssignee} disabled={!isLoaded}>
                <SelectTrigger className="h-8 text-xs rounded-xl border-border/60"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {memberships?.data?.map((m) => m.publicUserData?.userId ? (
                    <SelectItem key={m.publicUserData.userId} value={m.publicUserData.userId}>
                      {m.publicUserData.firstName || ''} {m.publicUserData.lastName || ''} ({m.publicUserData.identifier || ''})
                    </SelectItem>
                  ) : null)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="due_date" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-8 justify-start text-left text-xs font-normal border-border/60 hover:bg-primary/5 hover:text-primary transition-all rounded-xl",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-primary/70" />
                    <span className="truncate">{dueDate ? format(new Date(dueDate), "MMM d, yyyy") : "Pick a date"}</span>
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
            <div className="pt-1">
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="w-full grid grid-cols-2 bg-primary/5 h-8 p-0.5 rounded-xl text-xs">
                  <TabsTrigger value="details" className="text-xs h-7 rounded-lg">Details & Comments</TabsTrigger>
                  <TabsTrigger value="activity" className="text-xs h-7 rounded-lg">Activity Log</TabsTrigger>
                </TabsList>
                <TabsContent value="details" className="mt-2.5">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <SubtaskList task={initial as Task} />
                    <CommentSection task={initial as Task} />
                  </div>
                </TabsContent>
                <TabsContent value="activity" className="mt-2.5 max-h-[285px] overflow-y-auto">
                  <ActivityLogSection task={initial as Task} />
                </TabsContent>
              </Tabs>
            </div>
          )}
          
          <DialogFooter className="mt-4 pt-3 pb-1 border-t border-border/40 flex items-center justify-end gap-2.5">
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              className="h-8 text-xs px-4 font-semibold text-zinc-300 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 border-border/60 rounded-xl transition-all shadow-sm" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              size="sm" 
              className="h-8 text-xs px-5 font-bold bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:via-indigo-500 hover:to-purple-500 text-white shadow-[0_0_18px_rgba(139,92,246,0.3)] hover:shadow-[0_0_24px_rgba(139,92,246,0.5)] rounded-xl transition-all duration-200" 
              disabled={submitting || !title.trim()}
            >
              {mode === "create" ? "Create task" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}