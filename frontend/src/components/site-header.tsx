import { Link } from "@tanstack/react-router";
import { OrganizationSwitcher, UserButton } from "@clerk/tanstack-react-start";
import { SignedIn, SignedOut } from "./auth-gates";
import { LayoutGrid } from "lucide-react";

import { Button } from "./ui/button";
import { SendInvitationDialog } from "./invitations/send-invitation-dialog";
import { CreateOrganizationDialog } from "./organizations/create-organization-dialog";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 glass">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight shrink-0">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-primary/15 text-primary ring-1 ring-primary/30">
            <LayoutGrid className="h-4 w-4" />
          </span>
          <span className="hidden sm:inline">TaskBoard</span>
        </Link>

        <nav className="ml-2 flex items-center gap-0.5 md:gap-1 text-xs md:text-sm text-muted-foreground">
          <Link
            to="/"
            className="rounded-md px-2 py-1 md:px-2.5 md:py-1.5 transition hover:bg-accent hover:text-foreground"
            activeOptions={{ exact: true }}
            activeProps={{ className: "text-foreground bg-accent font-medium" }}
          >
            Home
          </Link>
          <Link
            to="/pricing"
            className="rounded-md px-2 py-1 md:px-2.5 md:py-1.5 transition hover:bg-accent hover:text-foreground"
            activeProps={{ className: "text-foreground bg-accent font-medium" }}
          >
            Pricing
          </Link>
          <SignedIn>
            <Link
              to="/dashboard"
              className="rounded-md px-2 py-1 md:px-2.5 md:py-1.5 transition hover:bg-accent hover:text-foreground"
              activeProps={{ className: "text-foreground bg-accent font-medium" }}
            >
              Dashboard
            </Link>
          </SignedIn>
        </nav>

        <div className="ml-auto flex items-center gap-1.5 md:gap-2 shrink-0">
          <SignedIn>
            <div className="flex items-center">
              <OrganizationSwitcher
                hidePersonal
                appearance={{
                  elements: {
                    rootBox: "flex items-center",
                    organizationSwitcherTrigger:
                      "rounded-md border border-border/60 bg-card px-2 py-1 text-xs md:text-sm hover:bg-accent max-w-[120px] sm:max-w-none truncate",
                  },
                }}
              />
            </div>
            <CreateOrganizationDialog />
            <SendInvitationDialog />
            <UserButton
              appearance={{ elements: { avatarBox: "h-7 w-7 md:h-8 md:w-8" } }}
            />
          </SignedIn>
          <SignedOut>
            <Button asChild variant="ghost" size="sm">
              <Link to={"/sign-in" as any}>Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to={"/sign-up" as any}>Get started</Link>
            </Button>
          </SignedOut>
        </div>
      </div>
    </header>
  );
}