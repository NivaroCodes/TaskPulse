import { useState } from "react";
import { useAuth, useOrganization } from "@clerk/tanstack-react-start";
import { tasksApi } from "../../lib/api";
import { Task } from "../../lib/tasks";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Send } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export function CommentSection({ task }: { task: Task }) {
  const { getToken, orgId } = useAuth();
  const { memberships } = useOrganization({ memberships: true });
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const comments = task.comments || [];

  const getUserName = (userId: string) => {
    const member = memberships?.data?.find(m => m.publicUserData.userId === userId);
    if (member) return `${member.publicUserData.firstName} ${member.publicUserData.lastName}`;
    return "Unknown User";
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !orgId) return;
    setIsSubmitting(true);
    try {
      await tasksApi.createComment(getToken, orgId, task.id, { content: newComment.trim() });
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3 mt-4 pt-4 border-t border-border">
      <h4 className="text-sm font-medium">Comments</h4>
      
      {comments.length > 0 && (
        <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
          {comments.map(comment => (
            <div key={comment.id} className="bg-muted/50 p-2 rounded-md text-sm">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-xs">{getUserName(comment.user_id)}</span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(comment.created_at).toLocaleString()}
                </span>
              </div>
              <p className="whitespace-pre-wrap">{comment.content}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-start gap-2">
        <Textarea 
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleAdd(e);
            }
          }}
          placeholder="Write a comment..." 
          className="min-h-[60px] text-sm resize-none"
        />
        <Button 
          type="button" 
          onClick={handleAdd}
          size="sm" 
          disabled={!newComment.trim() || isSubmitting} 
          className="mt-1"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
