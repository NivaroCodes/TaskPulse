import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { useAnalytics, useOrgPlan, useSprintInsights } from "../../lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Lock, LayoutDashboard, CheckCircle2, Clock, CircleDashed, Sparkles, BrainCircuit, RefreshCw } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

const COLORS = {
  pending: "#94a3b8",
  started: "#fbbf24",
  completed: "#34d399",
};

export function DashboardAnalytics({ memberships, role }: { memberships: any; role: string }) {
  const { data, isLoading, error } = useAnalytics();
  const { data: planData } = useOrgPlan();
  const navigate = useNavigate();

  const [insights, setInsights] = useState<string | null>(null);
  const { mutate: generateInsights, isPending: isGenerating } = useSprintInsights();

  const isRoleAllowed = ["org:admin", "org:project_manager"].includes(role);
  const plan = planData?.plan ?? "free";
  const hasAccess = plan === "team" || plan === "enterprise";

  const handleGenerateInsights = () => {
    const member_names: Record<string, string> = {};
    memberships?.forEach((m: any) => {
      const u = m.publicUserData;
      if (u && u.userId) {
        const name = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
        member_names[u.userId] = name || u.identifier || "Участник команды";
      }
    });
    generateInsights({ member_names }, {
      onSuccess: (res) => setInsights(res.insights),
    });
  };

  if (!isRoleAllowed) {
    return (
      <Card className="w-full bg-muted/30 border-dashed overflow-hidden relative mb-8">
        <div className="absolute inset-0 backdrop-blur-[2px] bg-background/50 z-10 flex flex-col items-center justify-center">
          <div className="bg-background border shadow-lg rounded-xl p-6 flex flex-col items-center text-center max-w-sm mx-4">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Access Denied</h3>
            <p className="text-sm text-muted-foreground mb-4">
              You do not have permission to view reporting and analytics. Only Admins and Project Managers can access this feature.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (!hasAccess) {
    return (
      <Card className="w-full bg-muted/30 border-dashed overflow-hidden relative mb-8">
        <div className="absolute inset-0 backdrop-blur-[2px] bg-background/50 z-10 flex flex-col items-center justify-center">
          <div className="bg-background border shadow-lg rounded-xl p-6 flex flex-col items-center text-center max-w-sm mx-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Analytics Locked</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Advanced reporting and analytics are available on the Team and Enterprise plans.
            </p>
            <button
              onClick={() => navigate({ to: "/pricing" })}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium text-sm transition-colors"
            >
              Upgrade to Team
            </button>
          </div>
        </div>
        <CardContent className="p-6 opacity-30 pointer-events-none filter blur-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card><CardHeader className="py-4"><CardTitle className="text-sm font-medium">Total Tasks</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">42</div></CardContent></Card>
            <Card><CardHeader className="py-4"><CardTitle className="text-sm font-medium">Completed</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">24</div></CardContent></Card>
            <Card><CardHeader className="py-4"><CardTitle className="text-sm font-medium">In Progress</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">12</div></CardContent></Card>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[300px]">
            <Card className="flex items-center justify-center"><CircleDashed className="h-16 w-16 text-muted-foreground" /></Card>
            <Card className="flex items-center justify-center"><LayoutDashboard className="h-16 w-16 text-muted-foreground" /></Card>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return <div className="h-[200px] flex items-center justify-center text-muted-foreground">Loading analytics...</div>;
  }

  if (error || !data) {
    return <div className="p-4 bg-destructive/10 text-destructive rounded-lg mb-8">Failed to load analytics.</div>;
  }

  const { summary, statusDistribution, workloadDistribution } = data;

  const mappedWorkload = workloadDistribution.map((item: any) => {
    const member = memberships?.find((m: any) => m.publicUserData.userId === item.full_id)?.publicUserData;
    return {
      ...item,
      name: member ? `${member.firstName} ${member.lastName}` : item.name,
    };
  });

  return (
    <div className="space-y-6 mb-8">
      <Card className="border-cyan-500/30 bg-gradient-to-br from-background via-cyan-500/[0.03] to-purple-500/[0.03] shadow-[0_0_20px_rgba(6,182,212,0.08)] overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 border-b border-border/40 bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-lg border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
              <BrainCircuit className="h-5 w-5 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <CardTitle className="text-base font-bold bg-gradient-to-r from-cyan-400 via-teal-300 to-purple-400 bg-clip-text text-transparent">
                AI Scrum Master & Sprint Insights
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Интеллектуальный анализ спринта, рисков и загруженности команды
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isGenerating}
            onClick={handleGenerateInsights}
            className="h-8 text-xs font-semibold bg-gradient-to-r from-cyan-500/10 via-teal-500/10 to-purple-500/10 hover:from-cyan-500/20 hover:via-teal-500/20 hover:to-purple-500/20 border-cyan-500/30 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)] hover:shadow-[0_0_18px_rgba(6,182,212,0.45)] transition-all duration-300 rounded-full px-4 w-fit"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 mr-2 text-cyan-400 animate-spin" />
                Анализ спринта...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 mr-1.5 text-cyan-400 animate-pulse" />
                {insights ? "Обновить отчёт" : "Сгенерировать AI-отчёт"}
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="relative flex h-12 w-12 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-20"></span>
                <BrainCircuit className="h-6 w-6 text-cyan-400 animate-bounce" />
              </div>
              <p className="text-xs font-medium text-cyan-400/80 animate-pulse">
                Сбор активности и анализ метрик команды через Groq LLM...
              </p>
            </div>
          )}
          {!isGenerating && !insights && (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <BrainCircuit className="h-10 w-10 text-cyan-500/30 mb-3" />
              <p className="text-sm font-medium">Готов к интеллектуальному аудиту спринта</p>
              <p className="text-xs max-w-md mt-1 text-muted-foreground/80">
                Нажми кнопку генерации, чтобы получить оценку здоровья спринта, выявить узкие места и получить рекомендации по распределению задач.
              </p>
            </div>
          )}
          {!isGenerating && insights && (
            <div className="prose prose-invert max-w-none">
              <div className="rounded-xl border border-cyan-500/20 bg-background/60 p-6 shadow-inner">
                <ReactMarkdown
                  components={{
                    h3: ({ node, ...props }) => (
                      <h3 className="text-sm font-extrabold uppercase tracking-wider text-cyan-400 mt-6 mb-3 first:mt-0 flex items-center gap-2 border-b border-cyan-500/25 pb-2" {...props} />
                    ),
                    p: ({ node, ...props }) => (
                      <p className="text-xs text-foreground/90 leading-relaxed my-2 last:mb-0" {...props} />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul className="space-y-2 my-3 list-none pl-0" {...props} />
                    ),
                    li: ({ node, ...props }) => (
                      <li className="relative pl-5 my-1.5 text-xs text-foreground/90 leading-relaxed before:content-['⚡'] before:absolute before:left-0 before:top-0 before:text-cyan-400 before:font-bold" {...props} />
                    ),
                    strong: ({ node, ...props }) => (
                      <strong className="font-semibold text-cyan-300 mr-1" {...props} />
                    ),
                    blockquote: ({ node, ...props }) => (
                      <blockquote className="p-4 my-3 bg-cyan-500/10 border-l-4 border-cyan-500 rounded-r-xl text-xs text-foreground/90 italic shadow-sm" {...props} />
                    ),
                  }}
                >
                  {insights}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-primary/10 text-primary rounded-lg">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
              <h3 className="text-2xl font-bold">{summary.total}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-emerald-400/10 text-emerald-500 rounded-lg">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completed</p>
              <h3 className="text-2xl font-bold">{summary.completed}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-amber-400/10 text-amber-500 rounded-lg">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">In Progress</p>
              <h3 className="text-2xl font-bold">{summary.started}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-slate-400/10 text-slate-500 rounded-lg">
              <CircleDashed className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending</p>
              <h3 className="text-2xl font-bold">{summary.pending}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Tasks by Status</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-[250px]">
            {summary.total === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No tasks yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell key="cell-0" fill={COLORS.pending} />
                    <Cell key="cell-1" fill={COLORS.started} />
                    <Cell key="cell-2" fill={COLORS.completed} />
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--background))" }}
                    itemStyle={{ color: "hsl(var(--foreground))" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Team Workload</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-[250px]">
            {workloadDistribution.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No tasks assigned</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mappedWorkload} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: "#94a3b8" }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: "#94a3b8" }}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #334155", backgroundColor: "#0f172a", color: "#f8fafc" }}
                    itemStyle={{ color: "#f8fafc" }}
                  />
                  <Bar dataKey="tasks" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
