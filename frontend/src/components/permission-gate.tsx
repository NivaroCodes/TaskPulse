import { useOrganization } from "@clerk/tanstack-react-start";
import type { ReactNode } from "react";

export function PermissionGate({
  children,
  fallback = null,
  role,
}: {
  children: ReactNode;
  fallback?: ReactNode;
  role?: string;
}) {
  const { membership, isLoaded } = useOrganization();
  if (!isLoaded) return null;
  const userRole = membership?.role;
  const allowed = role ? userRole === role : userRole === "org:admin";
  return <>{allowed ? children : fallback}</>;
}

export function useCanManageTasks(): boolean {
  const { membership, isLoaded } = useOrganization();
  if (!isLoaded) return false;
  return ["org:admin", "org:project_manager", "org:member"].includes(membership?.role || "");
}

export function useCanDeleteTasks(): boolean {
  const { membership, isLoaded } = useOrganization();
  if (!isLoaded) return false;
  return ["org:admin", "org:project_manager"].includes(membership?.role || "");
}