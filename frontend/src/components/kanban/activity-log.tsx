import { useEffect, useState } from "react";
import { useAuth, useOrganization } from "@clerk/tanstack-react-start";
import { tasksApi } from "../../lib/api";
import { ActivityLog, Task } from "../../lib/tasks";

export function ActivityLogSection({ task }: { task: Task }) {
  const { getToken, orgId } = useAuth();
  const { memberships } = useOrganization({ memberships: true });
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    tasksApi.getActivity(getToken, orgId, task.id)
      .then(setLogs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [task.id, orgId, getToken]);

  const getUserName = (userId: string) => {
    const member = memberships?.data?.find(m => m.publicUserData?.userId === userId);
    if (member?.publicUserData) return `${member.publicUserData.firstName || ''} ${member.publicUserData.lastName || ''}`.trim() || "System / Unknown User";
    return "System / Unknown User";
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground p-4 text-center">Loading activity...</div>;
  }

  if (logs.length === 0) {
    return <div className="text-sm text-muted-foreground p-4 text-center">No activity recorded yet.</div>;
  }

  return (
    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
      <div className="relative border-l border-muted ml-3 space-y-6 pb-4">
        {logs.map((log) => (
          <div key={log.id} className="relative pl-6">
            <span className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
            <div className="flex flex-col space-y-1">
              <span className="text-sm font-medium">
                {getUserName(log.user_id)}
                <span className="font-normal text-muted-foreground ml-1">{log.action.toLowerCase()}</span>
              </span>
              {log.details && (
                <span className="text-xs text-muted-foreground">
                  {log.details}
                </span>
              )}
              <span className="text-[10px] text-muted-foreground">
                {new Date(log.created_at).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
