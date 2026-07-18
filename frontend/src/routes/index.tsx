import { createFileRoute } from "@tanstack/react-router";

import { CTA } from "../components/landing/cta";
import { Features } from "../components/landing/features";
import { SiteFooter } from "../components/landing/footer";
import { Hero } from "../components/landing/hero";
import { SiteHeader } from "../components/site-header";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <Hero />
        <Features />
        <CTA />
      </main>
      <SiteFooter />
    </div>
  );
}
