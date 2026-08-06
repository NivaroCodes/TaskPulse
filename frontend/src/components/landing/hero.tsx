import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "../ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-60" />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-10rem] h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl"
      />
      <div className="relative mx-auto max-w-6xl px-4 py-24 md:py-32 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto flex max-w-3xl flex-col items-center text-center"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" />
            Built for fast-moving teams
          </span>
          <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight md:text-6xl">
            The kanban board your team actually{" "}
            <span className="bg-gradient-to-b from-primary to-primary/60 bg-clip-text text-transparent">
              enjoys using
            </span>
            .
          </h1>
          <p className="mt-5 max-w-xl text-balance text-base text-muted-foreground md:text-lg">
            TaskBoard keeps every organization&rsquo;s work in one focused board. Fast, keyboard-driven, beautifully dark &mdash; and permission-aware out of the box.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link to={"/sign-up" as any}>
                Start for free <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/pricing">See pricing</Link>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mx-auto mt-16 max-w-5xl"
        >
          <div className="rounded-xl border border-border/60 bg-card/60 p-2 sm:p-4 shadow-2xl shadow-primary/10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              {["To do", "In progress", "Done"].map((col, i) => (
                <div key={col} className="rounded-lg border border-border/60 bg-background/60 p-3">
                  <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
                    <span>{col}</span>
                    <span>{[4, 3, 2][i]}</span>
                  </div>
                  <div className="space-y-2">
                    {Array.from({ length: [3, 2, 2][i] }).map((_, j) => (
                      <div key={j} className="rounded-md border border-border/50 bg-card p-2.5 text-xs">
                        <div className="font-medium">Ship {["v2 release", "auth flow", "kanban DnD", "settings", "billing"][((i * 3) + j) % 5]}</div>
                        <div className="mt-1.5 h-1.5 w-2/3 rounded-full bg-muted" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}