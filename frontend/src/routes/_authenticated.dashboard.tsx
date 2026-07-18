import { useOrganization } from "@clerk/tanstack-react-start";
import { createFileRoute } from "@tanstack/react-router";

import { EmptyOrgState } from "../components/empty-org-state";
import { Board } from "../components/kanban/board";
import { SiteHeader } from "../components/site-header";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — TaskBoard" },
      { name: "description", content: "Your team's kanban board." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { organization, isLoaded } = useOrganization();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      {!isLoaded ? (
        <div className="p-8 text-sm text-muted-foreground">Loading organization...</div>
      ) : !organization ? (
        <EmptyOrgState />
      ) : (
        <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
          <Board />
        </main>
      )}
    </div>
  );
}