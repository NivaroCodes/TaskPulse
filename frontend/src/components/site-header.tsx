import { Link } from "@tanstack/react-router";
import { OrganizationSwitcher, UserButton } from "@clerk/tanstack-react-start";
import { SignedIn, SignedOut } from "./auth-gates";
import { LayoutGrid } from "lucide-react";

import { Button } from "./ui/button";
import { SendInvitationDialog } from "./invitations/send-invitation-dialog";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 glass">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-primary/15 text-primary ring-1 ring-primary/30">
            <LayoutGrid className="h-4 w-4" />
          </span>
          <span>TaskBoard</span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 text-sm text-muted-foreground md:flex">
          <Link
            to="/"
            className="rounded-md px-2.5 py-1.5 transition hover:bg-accent hover:text-foreground"
            activeOptions={{ exact: true }}
            activeProps={{ className: "text-foreground bg-accent" }}
          >
            Home
          </Link>
          <Link
            to="/pricing"
            className="rounded-md px-2.5 py-1.5 transition hover:bg-accent hover:text-foreground"
            activeProps={{ className: "text-foreground bg-accent" }}
          >
            Pricing
          </Link>
          <SignedIn>
            <Link
              to="/dashboard"
              className="rounded-md px-2.5 py-1.5 transition hover:bg-accent hover:text-foreground"
              activeProps={{ className: "text-foreground bg-accent" }}
            >
              Dashboard
            </Link>
          </SignedIn>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <SignedIn>
            <div className="hidden sm:block">
              <OrganizationSwitcher
                hidePersonal
                appearance={{
                  elements: {
                    rootBox: "flex items-center",
                    organizationSwitcherTrigger:
                      "rounded-md border border-border/60 bg-card px-2 py-1 text-sm hover:bg-accent",
                  },
                }}
              />
            </div>
            <SendInvitationDialog />
            <UserButton
              appearance={{ elements: { avatarBox: "h-8 w-8" } }}
            />
          </SignedIn>
          <SignedOut>
            <Button asChild variant="ghost" size="sm">
              <Link to="/sign-in">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/sign-up">Get started</Link>
            </Button>
          </SignedOut>
        </div>
      </div>
    </header>
  );
}