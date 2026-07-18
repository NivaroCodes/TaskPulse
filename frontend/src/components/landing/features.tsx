import { Building2, KeyRound, MoveHorizontal, Zap, Users, Shield } from "lucide-react";

const items = [
  { icon: Building2, title: "Organization-first", body: "Every task lives inside your organization. Switch orgs, get a fresh board — no data mixing." },
  { icon: MoveHorizontal, title: "Fluid drag & drop", body: "Move tasks across statuses with optimistic updates. No spinners, no jank." },
  { icon: KeyRound, title: "Roles & permissions", body: "Backed by Clerk. Members read, admins manage. Enforced on client and server." },
  { icon: Zap, title: "Keyboard fast", body: "Compact UI, low-latency interactions. Built for people who ship." },
  { icon: Users, title: "Team-ready", body: "Invite teammates, assign tasks, keep everyone aligned on what is next." },
  { icon: Shield, title: "Secure by default", body: "Auth via Clerk, tokens verified on the FastAPI backend on every request." },
];

export function Features() {
  return (
    <section className="border-t border-border/60 bg-background py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="max-w-xl">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Everything a team needs. Nothing it does not.
          </h2>
          <p className="mt-3 text-muted-foreground">
            TaskBoard focuses on the 20% of features you actually use every day.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ icon: Icon, title, body }) => (
            <div key={title} className="group rounded-xl border border-border/60 bg-card/60 p-5 transition hover:border-primary/40 hover:bg-card">
              <span className="mb-4 grid h-9 w-9 place-items-center rounded-md bg-primary/15 text-primary ring-1 ring-primary/30">
                <Icon className="h-4 w-4" />
              </span>
              <h3 className="text-sm font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}