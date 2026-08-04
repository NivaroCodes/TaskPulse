import { useState } from "react";
import { useAuth, useOrganization } from "@clerk/tanstack-react-start";
import { tasksApi } from "../../lib/api";
import { Task } from "../../lib/tasks";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Send } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export function CommentSection({ task }: { task: Task }) {
  const { getToken, orgId } = useAuth();
  const { memberships } = useOrganization({ memberships: true });
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const comments = Array.from(new Map((task.comments || []).map((c) => [c.id, c])).values());

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
    <div className="flex flex-col h-full rounded-xl border border-border/60 bg-gradient-to-br from-background via-muted/10 to-background p-3 shadow-xs space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-border/40">
        <div className="flex items-center gap-1.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Comments</h4>
          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">
            {comments.length}
          </span>
        </div>
      </div>
      
      <div className="flex-1 min-h-[110px] max-h-[170px] overflow-y-auto pr-1 space-y-2">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="bg-muted/60 hover:bg-muted/80 p-2 rounded-lg border border-border/30 transition-colors text-xs space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[11px] text-primary">{getUserName(comment.user_id)}</span>
                <span className="text-[10px] text-muted-foreground/70">
                  {new Date(comment.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })},{" "}
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-foreground/90 leading-relaxed text-xs">{comment.content}</p>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center h-[90px] text-xs text-muted-foreground/60 italic border border-dashed border-border/40 rounded-lg">
            No comments yet. Start a discussion! 💬
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 pt-1 border-t border-border/40">
        <Input 
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleAdd(e);
            }
          }}
          placeholder="Write a comment..." 
          className="h-8 text-xs rounded-lg border-border/60 focus:border-primary/50"
        />
        <Button 
          type="button" 
          onClick={handleAdd}
          size="sm" 
          disabled={!newComment.trim() || isSubmitting} 
          className="h-8 px-3 rounded-lg shrink-0 gap-1 text-xs font-semibold"
        >
          <Send className="h-3.5 w-3.5" />
          <span>Post</span>
        </Button>
      </div>
    </div>
  );
}

