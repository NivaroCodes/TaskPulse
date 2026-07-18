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
  return membership?.role === "org:admin";
}