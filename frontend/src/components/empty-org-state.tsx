import { CreateOrganization, OrganizationList } from "@clerk/tanstack-react-start";
import { Building2 } from "lucide-react";

export function EmptyOrgState() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-5xl flex-col items-center justify-center gap-8 px-4 py-16">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
          <Building2 className="h-6 w-6" />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">Choose an organization</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          TaskBoard is built for teams. Create a new organization or pick an existing one to see its kanban board.
        </p>
      </div>
      <div className="grid w-full gap-6 md:grid-cols-2">
        <div className="flex justify-center">
          <OrganizationList
            hidePersonal
            afterSelectOrganizationUrl="/dashboard"
            afterCreateOrganizationUrl="/dashboard"
          />
        </div>
        <div className="flex justify-center">
          <CreateOrganization afterCreateOrganizationUrl="/dashboard" />
        </div>
      </div>
    </div>
  );
}