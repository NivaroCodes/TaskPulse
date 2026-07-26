import { useState } from "react";
import { useAuth } from "@clerk/tanstack-react-start";
import { tasksApi } from "../../lib/api";
import { Subtask, Task } from "../../lib/tasks";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export function SubtaskList({ task }: { task: Task }) {
  const { getToken, orgId } = useAuth();
  const queryClient = useQueryClient();
  const [newTitle, setNewTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      <h4 className="text-sm font-medium">Subtasks</h4>
      
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
