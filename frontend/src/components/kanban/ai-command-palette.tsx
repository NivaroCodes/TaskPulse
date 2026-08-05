import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useParseTaskCommand } from "../../lib/queries";
import { Sparkles, BrainCircuit, CornerDownLeft, Calendar, User, Flag, Check, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface AiCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberships: any;
  onConfirmCreate: (taskData: {
    title: string;
    status: "pending";
    priority: string;
    due_date?: string;
    assignee?: string;
  }) => void;
  isCreating: boolean;
}

export function AiCommandPalette({
  open,
  onOpenChange,
  memberships,
  onConfirmCreate,
  isCreating,
}: AiCommandPaletteProps) {
  const [prompt, setPrompt] = useState("");
  const [parsedData, setParsedData] = useState<{
    title: string;
    priority: string;
    due_date: string | null;
    assignee_id: string | null;
    assignee_name: string | null;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const { mutate: parseCommand, isPending: isParsing } = useParseTaskCommand();

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setPrompt("");
      setParsedData(null);
    }
  }, [open]);

  const handleParse = () => {
    if (!prompt.trim() || isParsing) return;
    const current_date = new Date().toISOString().split("T")[0];
    const members: Array<{ id: string; name: string }> = [];
    if (Array.isArray(memberships)) {
      memberships.forEach((m: any) => {
        const u = m.publicUserData;
        if (u && u.userId) {
          const fullName = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.identifier || "User";
          members.push({ id: u.userId, name: fullName });
        }
      });
    }
    parseCommand(
      { prompt: prompt.trim(), current_date, members },
      {
        onSuccess: (data) => {
          setParsedData(data);
        },
        onError: () => {
          toast.error("Failed to process command. Please try again.");
        },
      }
    );
  };

  const handleConfirm = () => {
    if (!parsedData) return;
    onConfirmCreate({
      title: parsedData.title,
      status: "pending",
      priority: parsedData.priority || "medium",
      due_date: parsedData.due_date ? `${parsedData.due_date}T12:00:00.000Z` : undefined,
      assignee: parsedData.assignee_id || undefined,
    });
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!parsedData) {
        handleParse();
      } else {
        handleConfirm();
      }
    } else if (e.key === "Escape" && parsedData) {
      e.stopPropagation();
      setParsedData(null);
    }
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case "urgent":
        return "bg-rose-500/15 text-rose-400 border-rose-500/30";
      case "high":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "low":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      default:
        return "bg-sky-500/15 text-sky-400 border-sky-500/30";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border border-violet-500/20 bg-zinc-950/95 backdrop-blur-2xl shadow-[0_0_60px_rgba(139,92,246,0.15)] sm:rounded-2xl">
        <DialogHeader className="p-4 bg-muted/20 border-b border-border/40 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-violet-500/10 rounded-lg border border-violet-500/30">
              <Sparkles className="h-4 w-4 text-purple-400 animate-pulse" />
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                AI Smart Command Bar
                <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  Spotlight
                </span>
              </DialogTitle>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border/60 text-[10px] font-mono">Enter ↵</kbd>
            <span>to execute</span>
          </div>
        </DialogHeader>

        <div className="p-5 space-y-5" onKeyDown={handleKeyDown}>
          {!parsedData ? (
            <div className="space-y-4">
              <div className="relative flex items-center">
                <Input
                  ref={inputRef}
                  disabled={isParsing || isCreating}
                  placeholder="Type task in plain text, e.g., Fix authentication bottleneck by next Friday @alex high priority..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="h-14 pl-4 pr-28 text-sm bg-zinc-900/60 border-violet-500/30 focus-visible:ring-purple-500/40 rounded-xl shadow-inner text-foreground placeholder:text-muted-foreground/60 transition-all"
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={!prompt.trim() || isParsing || isCreating}
                  onClick={handleParse}
                  className="absolute right-2 h-10 px-4 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:via-indigo-500 hover:to-purple-500 text-white font-semibold rounded-lg shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all"
                >
                  {isParsing ? (
                    <BrainCircuit className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span>Parse</span>
                      <CornerDownLeft className="h-3.5 w-3.5" />
                    </div>
                  )}
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 rounded-xl border border-border/30 bg-muted/10 flex items-center gap-2.5">
                  <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold">⏰</span>
                  <div>
                    <div className="font-medium text-foreground/90">Smart Dates</div>
                    <div className="text-[10px] text-muted-foreground">"by Friday", "in 3 days"</div>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl border border-border/30 bg-muted/10 flex items-center gap-2.5">
                  <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 font-bold">⚡</span>
                  <div>
                    <div className="font-medium text-foreground/90">Priority Tags</div>
                    <div className="text-[10px] text-muted-foreground">"high", "urgent", "low"</div>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl border border-border/30 bg-muted/10 flex items-center gap-2.5">
                  <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 font-bold">👤</span>
                  <div>
                    <div className="font-medium text-foreground/90">Team Mention</div>
                    <div className="text-[10px] text-muted-foreground">"@username", "for Sarah"</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/[0.05] via-indigo-500/[0.05] to-purple-500/[0.05] shadow-inner space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-purple-400 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" /> Magic Preview — Ready to launch
                    </span>
                    <h3 className="text-base font-bold text-foreground leading-snug">{parsedData.title}</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setParsedData(null)}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted/40"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold uppercase tracking-wider ${getPriorityColor(parsedData.priority)}`}>
                    <Flag className="h-3 w-3" />
                    <span>{parsedData.priority || "medium"}</span>
                  </div>

                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border/50 bg-background/50 text-xs font-medium text-foreground/90">
                    <Calendar className="h-3 w-3 text-indigo-400" />
                    <span>
                      {parsedData.due_date
                        ? format(new Date(parsedData.due_date), "MMM d, yyyy")
                        : "No deadline"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border/50 bg-background/50 text-xs font-medium text-foreground/90">
                    <User className="h-3 w-3 text-purple-400" />
                    <span>{parsedData.assignee_name || "Unassigned"}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setParsedData(null)}
                  className="text-xs h-9 px-4 border-border/60 hover:bg-muted/40"
                >
                  Edit prompt
                </Button>
                <Button
                  size="sm"
                  disabled={isCreating}
                  onClick={handleConfirm}
                  className="text-xs font-semibold h-9 px-6 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:via-purple-500 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.35)] transition-all rounded-lg"
                >
                  <Check className="h-4 w-4 mr-1.5 stroke-[3]" />
                  <span>Confirm & Create</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
