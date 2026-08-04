import { useState } from "react";
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

  const subtasks = task.subtasks || [];

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !orgId) return;
    setIsSubmitting(true);
    try {
      await tasksApi.createSubtask(getToken, orgId, task.id, { title: newTitle.trim() });
      setNewTitle("");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } catch (e) {
      console.error(e);
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
        for (const stTitle of res.subtasks) {
          if (stTitle.trim()) {
            await tasksApi.createSubtask(getToken, orgId, task.id, { title: stTitle.trim() });
          }
        }
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
    try {
      await tasksApi.updateSubtask(getToken, orgId, task.id, subtask.id, { is_completed: checked });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (subtaskId: string) => {
    if (!orgId) return;
    try {
      await tasksApi.removeSubtask(getToken, orgId, task.id, subtaskId);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-3 mt-4 pt-4 border-t border-border">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Subtasks</h4>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isGenerating || !task.title}
          onClick={handleAiGenerate}
          className="h-7 text-xs font-semibold bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-pink-500/10 hover:from-violet-500/20 hover:via-purple-500/20 hover:to-pink-500/20 border-purple-500/30 text-purple-600 dark:text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.2)] hover:shadow-[0_0_16px_rgba(168,85,247,0.4)] transition-all duration-300 rounded-full px-3"
        >
          <Sparkles className={`h-3.5 w-3.5 mr-1.5 text-purple-500 ${isGenerating ? "animate-spin" : "animate-pulse"}`} />
          {isGenerating ? "Thinking..." : "AI Auto-generate"}
        </Button>
      </div>
      
      {subtasks.length > 0 && (
        <ul className="space-y-2">
          {subtasks.map(st => (
            <li key={st.id} className="flex items-center gap-2 group">
              <Checkbox 
                checked={st.is_completed} 
                onCheckedChange={(c) => handleToggle(st, !!c)}
                className="h-4 w-4"
              />
              <span className={`flex-1 text-sm ${st.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                {st.title}
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                onClick={() => handleDelete(st.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2">
        <Input 
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd(e);
            }
          }}
          placeholder="Add a subtask..." 
          className="h-8 text-sm"
        />
        <Button 
          type="button" 
          onClick={handleAdd}
          size="sm" 
          variant="secondary" 
          disabled={!newTitle.trim() || isSubmitting}
        >
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>
    </div>
  );
}

