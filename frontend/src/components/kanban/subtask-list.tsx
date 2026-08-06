import { useState, useEffect } from "react";
import { useAuth } from "@clerk/tanstack-react-start";
import { tasksApi } from "../../lib/api";
import { Subtask, Task } from "../../lib/tasks";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Plus, Trash2, Sparkles } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useGenerateSubtasks } from "../../lib/queries";
import { toast } from "sonner";

export function SubtaskList({ task }: { task: Task }) {
  const { getToken, orgId } = useAuth();
  const queryClient = useQueryClient();
  const generateSubtasks = useGenerateSubtasks();
  const [newTitle, setNewTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks || []);

  useEffect(() => {
    const list = task.subtasks || [];
    setSubtasks(Array.from(new Map(list.map((s) => [s.id, s])).values()));
  }, [task.subtasks]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !orgId) return;
    const tempTitle = newTitle.trim();
    setNewTitle("");
    setIsSubmitting(true);
    try {
      const created = await tasksApi.createSubtask(getToken, orgId, task.id, { title: tempTitle });
      if (created) {
        setSubtasks((prev) => {
          if (prev.some((s) => s.id === created.id)) return prev;
          return [...prev, created];
        });
      }
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } catch (e) {
      console.error(e);
      setNewTitle(tempTitle);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAiGenerate = async () => {
    if (!orgId) return;
    setIsGenerating(true);
    try {
      const res = await generateSubtasks.mutateAsync({
        title: task.title,
        description: task.description ?? undefined,
      });
      if (res && res.subtasks) {
        const added: Subtask[] = [];
        for (const stTitle of res.subtasks) {
          if (stTitle.trim()) {
            const created = await tasksApi.createSubtask(getToken, orgId, task.id, { title: stTitle.trim() });
            if (created) added.push(created);
          }
        }
        setSubtasks((prev) => {
          const map = new Map(prev.map((s) => [s.id, s]));
          for (const item of added) {
            map.set(item.id, item);
          }
          return Array.from(map.values());
        });
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
        toast.success("AI generated subtasks! ✨");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggle = async (subtask: Subtask, checked: boolean) => {
    if (!orgId) return;
    setSubtasks((prev) =>
      prev.map((st) => (st.id === subtask.id ? { ...st, is_completed: checked } : st))
    );
    queryClient.setQueryData(["tasks"], (old: unknown) => {
      if (!Array.isArray(old)) return old;
      return old.map((t: Task) =>
        t.id === task.id
          ? {
              ...t,
              subtasks: (t.subtasks || []).map((st: Subtask) =>
                st.id === subtask.id ? { ...st, is_completed: checked } : st
              ),
            }
          : t
      );
    });
    try {
      await tasksApi.updateSubtask(getToken, orgId, task.id, subtask.id, { is_completed: checked });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } catch (e) {
      console.error(e);
      setSubtasks(task.subtasks || []);
    }
  };

  const handleDelete = async (subtaskId: string) => {
    if (!orgId) return;
    setSubtasks((prev) => prev.filter((st) => st.id !== subtaskId));
    queryClient.setQueryData(["tasks"], (old: unknown) => {
      if (!Array.isArray(old)) return old;
      return old.map((t: Task) =>
        t.id === task.id
          ? {
              ...t,
              subtasks: (t.subtasks || []).filter((st: Subtask) => st.id !== subtaskId),
            }
          : t
      );
    });
    try {
      await tasksApi.removeSubtask(getToken, orgId, task.id, subtaskId);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } catch (e) {
      console.error(e);
      setSubtasks(task.subtasks || []);
    }
  };

  const uniqueSubtasks = Array.from(new Map(subtasks.map((s) => [s.id, s])).values());

  return (
    <div className="flex flex-col h-[285px] justify-between overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-background via-muted/10 to-background p-4 shadow-xs">
      <div className="flex items-center justify-between pb-2 border-b border-border/40">
        <div className="flex items-center gap-1.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Subtasks</h4>
          <span className="text-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded-full font-bold">
            {uniqueSubtasks.filter(s => s.is_completed).length}/{uniqueSubtasks.length}
          </span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isGenerating || !task.title}
          onClick={handleAiGenerate}
          className="h-6 text-[11px] font-semibold bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-pink-500/10 hover:from-violet-500/20 hover:via-purple-500/20 hover:to-pink-500/20 border-purple-500/30 text-purple-600 dark:text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.2)] hover:shadow-[0_0_16px_rgba(168,85,247,0.4)] transition-all duration-300 rounded-full px-2.5 shrink-0"
        >
          <Sparkles className={`h-3 w-3 mr-1 text-purple-500 ${isGenerating ? "animate-spin" : "animate-pulse"}`} />
          {isGenerating ? "Thinking..." : "AI Auto"}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto pr-1.5 space-y-1 my-1">
        {uniqueSubtasks.length > 0 ? (
          <ul className="space-y-1.5">
            {uniqueSubtasks.map((st) => (
              <li key={st.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/50 border border-transparent hover:border-border/50 transition-all duration-150 group">
                <Checkbox
                  checked={st.is_completed}
                  onCheckedChange={(c) => handleToggle(st, !!c)}
                  className="h-4 w-4 rounded-[4px] border-primary/40 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600 transition-all shrink-0 cursor-pointer"
                />
                <span
                  onClick={() => handleToggle(st, !st.is_completed)}
                  className={`flex-1 text-xs leading-tight select-none cursor-pointer break-words transition-all ${
                    st.is_completed ? "line-through text-muted-foreground opacity-60 font-normal" : "text-foreground/90 font-medium"
                  }`}
                >
                  {st.title}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-150 rounded-md shrink-0"
                  onClick={() => handleDelete(st.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex items-center justify-center h-full min-h-[120px] text-xs text-muted-foreground/60 italic border border-dashed border-border/40 rounded-lg">
            No subtasks yet. Add one or click AI Auto! ✨
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 pt-2.5 border-t border-border/40 mt-auto">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd(e);
            }
          }}
          placeholder="New subtask..."
          className="h-8 text-xs rounded-lg border-border/60 focus:border-purple-500/50 flex-1"
        />
        <Button
          type="button"
          onClick={handleAdd}
          size="sm"
          variant="secondary"
          disabled={!newTitle.trim() || isSubmitting}
          className="h-8 text-xs px-3 font-semibold rounded-lg shrink-0"
        >
          <Plus className="h-3.5 w-3.5 mr-1" /> Add
        </Button>
      </div>
    </div>
  );
}


