import { useState, useRef, useEffect } from "react";
import { useAuth, useOrganization, useUser } from "@clerk/tanstack-react-start";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { cn } from "../../lib/utils";
import { tasksApi } from "../../lib/api";
import { Task } from "../../lib/tasks";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Send, Sparkles, BrainCircuit } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useEditComment, useSummarizeDiscussion } from "../../lib/queries";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export function CommentSection({ task }: { task: Task }) {
  const { getToken, orgId, userId } = useAuth();
  const { user } = useUser();
  const { memberships } = useOrganization({ memberships: true });
  const queryClient = useQueryClient();
  const currentUserId = userId || user?.id;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const prevLenRef = useRef<number>(task.comments?.length || 0);
  const isMySubmitRef = useRef<boolean>(false);
  const [newCount, setNewCount] = useState<number>(0);

  const scrollToBottom = (smooth = true) => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    }
  };
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState<{ consensus: string; action_items: string[] } | null>(null);

  const editComment = useEditComment();
  const summarize = useSummarizeDiscussion();

  const comments = Array.from(new Map((task.comments || []).map((c) => [c.id, c])).values());

  const getUserData = (id: string) => {
    const member = memberships?.data?.find(m => m.publicUserData?.userId === id);
    if (member?.publicUserData) {
      const name = `${member.publicUserData.firstName || ''} ${member.publicUserData.lastName || ''}`.trim() || member.publicUserData.identifier || "Unknown User";
      const initials = (name[0] || 'U').toUpperCase();
      return { name, imageUrl: member.publicUserData.imageUrl, initials };
    }
    return { name: "Unknown User", imageUrl: undefined, initials: "U" };
  };

  useEffect(() => {
    scrollToBottom(false);
  }, []);

  useEffect(() => {
    const len = comments.length;
    if (len > prevLenRef.current) {
      const diff = len - prevLenRef.current;
      scrollToBottom(true);

      if (!isMySubmitRef.current) {
        setNewCount((c) => c + diff);
        const now = Date.now();
        if (now - ((window as any).__lastAudioPlay || 0) > 1000) {
          (window as any).__lastAudioPlay = now;
          try {
            const audio = new Audio("/notification.wav");
            audio.volume = 1.0;
            const playPromise = audio.play();
            if (playPromise !== undefined) {
              playPromise.catch(() => {});
            }
          } catch {
          }
        }
      }
    }
    prevLenRef.current = len;
  }, [comments.length]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !orgId) return;
    setIsSubmitting(true);
    isMySubmitRef.current = true;
    try {
      await tasksApi.createComment(getToken, orgId, task.id, { content: newComment.trim() });
      setNewComment("");
      setNewCount(0);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setTimeout(() => {
        scrollToBottom(true);
        isMySubmitRef.current = false;
      }, 300);
    } catch (e) {
      console.error(e);
      isMySubmitRef.current = false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAiEdit = async (action: string) => {
    if (!newComment.trim()) return;
    try {
      const res = await editComment.mutateAsync({ text: newComment, action });
      if (res?.result_text) {
        setNewComment(res.result_text);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSummarize = async () => {
    if (showSummary && summaryData) {
      setShowSummary(false);
      return;
    }
    try {
      const payload = comments.map((c) => ({
        author: getUserData(c.user_id).name,
        text: c.content,
      }));
      const res = await summarize.mutateAsync({ comments: payload });
      if (res) {
        setSummaryData(res);
        setShowSummary(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col h-[285px] justify-between overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-background via-muted/10 to-background p-4 shadow-xs">
      <div className="flex items-center justify-between pb-2 border-b border-border/40">
        <div className="flex items-center gap-1.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Comments</h4>
          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">
            {comments.length}
          </span>
          {newCount > 0 && (
            <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-full font-bold shadow-xs">
              +{newCount}
            </span>
          )}
        </div>
        {comments.length >= 2 && (
          <button
            type="button"
            onClick={handleSummarize}
            disabled={summarize.isPending}
            className="group relative inline-flex items-center gap-1.5 h-7 px-2.5 py-1 rounded-full bg-zinc-900/90 hover:bg-zinc-900 border border-violet-500/30 hover:border-purple-400/60 shadow-[0_0_15px_rgba(139,92,246,0.15)] transition-all duration-200 text-[11px] font-semibold text-zinc-100 disabled:opacity-50 shrink-0"
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500/10 via-indigo-500/10 to-pink-500/10 opacity-70 group-hover:opacity-100 transition-opacity pointer-events-none" />
            {summarize.isPending ? (
              <BrainCircuit className="h-3 w-3 animate-spin text-purple-400" />
            ) : (
              <Sparkles className="h-3 w-3 text-purple-400 group-hover:text-pink-400 animate-pulse" />
            )}
            <span>{showSummary ? "Hide Summary" : "AI Summary"}</span>
          </button>
        )}
      </div>

      {showSummary && summaryData && (
        <div className="max-h-[150px] overflow-y-auto p-3 my-1.5 rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/[0.08] via-indigo-500/[0.05] to-purple-500/[0.08] shadow-inner space-y-2 text-xs shrink-0 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-purple-400 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" /> AI Thread Summary
            </span>
            <button
              type="button"
              onClick={() => setShowSummary(false)}
              className="text-muted-foreground hover:text-foreground text-[10px] px-1"
            >
              ✕
            </button>
          </div>
          <div className="text-foreground font-medium text-[11px] leading-relaxed bg-zinc-900/50 p-2 rounded-lg border border-border/30">
            <span className="text-indigo-400 font-semibold mr-1">Consensus:</span>
            {summaryData.consensus}
          </div>
          {summaryData.action_items.length > 0 && (
            <div className="space-y-1 pt-0.5">
              <span className="text-[10px] font-semibold text-purple-300 uppercase tracking-wider">Action Items</span>
              <ul className="space-y-1">
                {summaryData.action_items.map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[11px] text-zinc-300">
                    <span className="text-pink-400 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      <div className="relative flex-1 overflow-hidden flex flex-col my-2">
        <div 
          ref={containerRef}
          className="flex-1 overflow-y-auto pr-2 space-y-2.5 pt-1"
          onScroll={(e) => {
            const el = e.currentTarget;
            if (el.scrollHeight - el.scrollTop - el.clientHeight < 25) {
              if (newCount > 0) setNewCount(0);
            }
          }}
        >
          {comments.length > 0 ? (
            comments.map((comment) => {
              const isMe = comment.user_id === currentUserId;
              const userData = getUserData(comment.user_id);
              const timeStr = new Date(comment.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              const dateStr = new Date(comment.created_at).toLocaleDateString([], { month: "short", day: "numeric" });

              return (
                <div key={comment.id} className={cn("flex items-start gap-2.5 max-w-[85%]", isMe ? "ml-auto flex-row-reverse pr-2" : "mr-auto pl-0.5")}>
                  <Avatar className="h-7 w-7 border border-border/50 shadow-sm shrink-0 mt-0.5">
                    <AvatarImage src={userData.imageUrl} alt={userData.name} />
                    <AvatarFallback className={cn("text-[10px] font-bold", isMe ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-300")}>
                      {userData.initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className={cn(
                    "flex flex-col gap-1 px-3 py-2.5 transition-all shadow-sm",
                    isMe
                      ? "bg-gradient-to-br from-violet-600/95 via-indigo-600/95 to-purple-600/95 text-white border border-violet-400/30 rounded-2xl rounded-tr-[3px] shadow-[0_4px_15px_rgba(139,92,246,0.2)]"
                      : "bg-zinc-900/90 hover:bg-zinc-900 border border-border/60 text-zinc-100 rounded-2xl rounded-tl-[3px]"
                  )}>
                    <div className="flex items-center justify-between gap-3 text-[10px] leading-none">
                      <span className={cn("font-bold truncate max-w-[130px]", isMe ? "text-violet-100" : "text-indigo-400")}>
                        {isMe ? "You" : userData.name}
                      </span>
                      <span className={cn("text-[9px] shrink-0 font-medium", isMe ? "text-violet-200/80" : "text-zinc-400")}>
                        {timeStr} · {dateStr}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-xs leading-relaxed break-words font-normal pt-0.5">
                      {comment.content}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex items-center justify-center h-full min-h-[120px] text-xs text-muted-foreground/60 italic border border-dashed border-border/40 rounded-lg">
              No comments yet. Start a discussion! 💬
            </div>
          )}
        </div>

        {newCount > 0 && (
          <div className="absolute bottom-2 right-3 z-20">
            <button
              type="button"
              onClick={() => {
                setNewCount(0);
                scrollToBottom(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900/95 hover:bg-zinc-800 border border-border/70 text-zinc-200 text-[11px] font-medium shadow-lg backdrop-blur-md transition-all cursor-pointer"
            >
              <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
              <span>{newCount} new</span>
              <span className="text-[10px] text-muted-foreground">↓</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 pt-2.5 border-t border-border/40 mt-auto">
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
          className="h-8 text-xs rounded-lg border-border/60 focus:border-primary/50 flex-1"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              disabled={!newComment.trim() || editComment.isPending}
              className="group relative flex items-center justify-center h-8 px-2.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-900 border border-violet-500/30 hover:border-purple-400/60 shadow-[0_0_12px_rgba(139,92,246,0.15)] transition-all shrink-0 disabled:opacity-40 disabled:pointer-events-none text-[11px] font-semibold text-zinc-100 gap-1"
              title="AI Edit Co-pilot"
            >
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-violet-500/10 via-indigo-500/10 to-pink-500/10 opacity-70 group-hover:opacity-100 transition-opacity pointer-events-none" />
              {editComment.isPending ? (
                <BrainCircuit className="h-3.5 w-3.5 animate-spin text-purple-400" />
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-purple-400 group-hover:text-pink-400 animate-pulse" />
                  <span className="hidden sm:inline text-[10px]">AI Edit</span>
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 p-1.5 border border-violet-500/20 bg-zinc-950/95 backdrop-blur-xl text-zinc-200 rounded-xl shadow-[0_0_25px_rgba(139,92,246,0.2)]">
            <DropdownMenuItem
              onClick={() => handleAiEdit("professional")}
              className="flex items-center gap-2 px-2.5 py-2 text-xs rounded-lg cursor-pointer hover:bg-purple-500/15 focus:bg-purple-500/15 focus:text-white"
            >
              <span>👔</span>
              <span>Make Professional</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleAiEdit("grammar")}
              className="flex items-center gap-2 px-2.5 py-2 text-xs rounded-lg cursor-pointer hover:bg-indigo-500/15 focus:bg-indigo-500/15 focus:text-white"
            >
              <span>✍️</span>
              <span>Fix Grammar</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleAiEdit("concise")}
              className="flex items-center gap-2 px-2.5 py-2 text-xs rounded-lg cursor-pointer hover:bg-pink-500/15 focus:bg-pink-500/15 focus:text-white"
            >
              <span>🎯</span>
              <span>Make Concise</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button 
          type="button" 
          onClick={handleAdd}
          size="icon" 
          disabled={!newComment.trim() || isSubmitting} 
          className="h-8 w-8 rounded-lg shrink-0"
        >
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
