import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { Button } from "../ui/button";

export function CTA() {
  return (
    <section className="border-t border-border/60">
      <div className="mx-auto max-w-6xl px-4 py-20 md:px-6">
        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-10 text-center md:p-16">
          <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-64 w-64 rounded-full bg-primary/25 blur-3xl" />
          <h2 className="relative text-3xl font-semibold tracking-tight md:text-4xl">Ready to run a tighter board?</h2>
          <p className="relative mx-auto mt-3 max-w-md text-muted-foreground">
            Set up your organization in under a minute. Free forever for small teams.
          </p>
          <div className="relative mt-6">
            <Button asChild size="lg">
              <Link to={"/sign-up" as any}>Create your board <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}