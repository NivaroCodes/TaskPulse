import { Link } from "@tanstack/react-router";
import { LayoutGrid } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground md:flex-row md:px-6">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 text-primary" />
          <span>TaskBoard &copy; {new Date().getFullYear()}</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
          <Link to={"/sign-in" as any} className="hover:text-foreground">Sign in</Link>
          <Link to={"/sign-up" as any} className="hover:text-foreground">Sign up</Link>
        </nav>
      </div>
    </footer>
  );
}