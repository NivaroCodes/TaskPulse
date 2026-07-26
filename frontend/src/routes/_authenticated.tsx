import { useAuth } from "@clerk/tanstack-react-start";
import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useNotifications } from "../hooks/useNotifications";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();

  useNotifications();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate({ to: "/sign-in" });
    }
  }, [isLoaded, isSignedIn, navigate]);

  if (!isLoaded) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }
  if (!isSignedIn) return null;

  return <Outlet />;
}