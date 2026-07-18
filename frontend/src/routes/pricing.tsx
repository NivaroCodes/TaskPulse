import { createFileRoute } from "@tanstack/react-router";

import { SiteFooter } from "../components/landing/footer";
import { PricingCards } from "../components/pricing/pricing-cards";
import { SiteHeader } from "../components/site-header";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — TaskBoard" },
      { name: "description", content: "Simple, transparent pricing for teams of every size. Start free." },
      { property: "og:title", content: "Pricing — TaskBoard" },
      { property: "og:description", content: "Free, Pro, Team, Enterprise. Pick the plan that fits your team." },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <PricingCards />
      </main>
      <SiteFooter />
    </div>
  );
}