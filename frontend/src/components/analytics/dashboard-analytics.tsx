import { useAnalytics, useOrgPlan } from "../../lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Lock, LayoutDashboard, CheckCircle2, Clock, CircleDashed } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

const COLORS = {
  pending: "#94a3b8",
  started: "#fbbf24",
  completed: "#34d399",
};

export function DashboardAnalytics({ memberships, role }: { memberships: any, role: string }) {
  const { data, isLoading, error } = useAnalytics();
  const { data: planData } = useOrgPlan();
  const navigate = useNavigate();

  const isRoleAllowed = ["org:admin", "org:project_manager"].includes(role);
  const plan = planData?.plan ?? "free";
  const hasAccess = plan === "team" || plan === "enterprise";

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
    <div className="space-y-4 mb-8">
      {}
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
        {}
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
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {}
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
                    tick={{ fontSize: 12, fill: '#94a3b8' }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#f8fafc' }}
                    itemStyle={{ color: '#f8fafc' }}
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
