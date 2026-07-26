import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useState } from "react";

import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { useAuth, useOrganization } from "@clerk/tanstack-react-start";
import { paymentsApi } from "../../lib/api";

type Tier = {
  name: string;
  tagline: string;
  monthly: number | "custom";
  yearly: number | "custom";
  cta: string;
  highlight?: boolean;
  features: string[];
};

const tiers: Tier[] = [
  {
    name: "Free",
    tagline: "For individuals just getting started.",
    monthly: 0,
    yearly: 0,
    cta: "Start free",
    features: [
      "Up to 2 members per organization",
      "1 organization",
      "Unlimited basic tasks",
      "Standard statuses (To do / In progress / Done)",
      "Email support",
    ],
  },
  {
    name: "Pro",
    tagline: "For growing teams that need more collaboration.",
    monthly: 12,
    yearly: 120,
    cta: "Upgrade to Pro",
    highlight: true,
    features: [
      "Everything in Free, plus:",
      "Up to 10 members per organization",
      "Unlimited organizations",
      "Custom task statuses",
      "Subtasks & dependencies",
      "File attachments (1 GB)",
      "Priority email support",
    ],
  },
  {
    name: "Team",
    tagline: "For larger teams that need robust collaboration.",
    monthly: 29,
    yearly: 290,
    cta: "Choose Team",
    features: [
      "Everything in Pro, plus:",
      "Up to 50 members per organization",
      "Advanced roles & permissions",
      "Guest access",
      "Basic reporting & analytics",
      "File storage up to 10 GB",
      "Dedicated chat support",
    ],
  },
  {
    name: "Enterprise",
    tagline: "For large orgs with custom needs.",
    monthly: "custom",
    yearly: "custom",
    cta: "Contact sales",
    features: [
      "Everything in Team, plus:",
      "Unlimited members & organizations",
      "SSO (SAML)",
      "Audit logs",
      "Custom integrations",
      "On-premise deployment",
      "24/7 phone & email support",
      "Dedicated CSM & SLA",
    ],
  },
];

export function PricingCards() {
  const [yearly, setYearly] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const { isSignedIn, getToken } = useAuth();
  const { organization } = useOrganization();

  const handleSubscribe = async (planName: string, provider: 'stripe' | 'kaspi') => {
    const plan = planName.toLowerCase();
    
    if (!isSignedIn) {
      window.location.href = '/sign-in?redirect_url=/pricing';
      return;
    }
    
    if (!organization) {
      alert("Please create or select an organization first.");
      return;
    }

    setLoadingPlan(`${plan}-${provider}`);
    
    try {
      const response = provider === 'stripe' 
        ? await paymentsApi.createStripeCheckout(getToken, organization.id, plan)
        : await paymentsApi.createKaspiInvoice(getToken, organization.id, plan);
      
      if (response && response.url) {
        window.location.href = response.url;
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      alert("Failed to initiate payment. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 md:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          Simple pricing for every team
        </h1>
        <p className="mt-4 text-muted-foreground">
          Start free. Upgrade when your team grows. Cancel anytime.
        </p>

        <div className="mt-8 inline-flex items-center gap-1 rounded-full border border-border/60 bg-card/60 p-1 text-sm">
          <button
            onClick={() => setYearly(false)}
            className={cn("rounded-full px-3.5 py-1.5 transition", !yearly ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
          >
            Monthly
          </button>
          <button
            onClick={() => setYearly(true)}
            className={cn("rounded-full px-3.5 py-1.5 transition", yearly ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
          >
            Yearly <span className="ml-1 text-xs opacity-80">save 17%</span>
          </button>
        </div>
      </div>

      <div className="mt-14 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {tiers.map((tier) => {
          const price = yearly ? tier.yearly : tier.monthly;
          return (
            <div
              key={tier.name}
              className={cn(
                "relative flex flex-col rounded-xl border p-6 transition duration-300",
                tier.highlight 
                  ? "border-primary/60 bg-card shadow-lg shadow-primary/10 transform md:-translate-y-2" 
                  : "border-border/60 bg-card/60 hover:border-border opacity-60 hover:opacity-100",
              )}
            >
              {tier.highlight && (
                <span className="absolute -top-2.5 left-6 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-semibold">{tier.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{tier.tagline}</p>
              <div className="mt-5 flex items-baseline gap-1">
                {price === "custom" ? (
                  <span className="text-3xl font-semibold">Custom</span>
                ) : (
                  <>
                    <span className="text-4xl font-semibold tracking-tight">${price}</span>
                    <span className="text-sm text-muted-foreground">/{yearly ? "year" : "month"}</span>
                  </>
                )}
              </div>

              {tier.name === "Free" ? (
                <Button asChild className="mt-5 rounded-md" variant={tier.highlight ? "default" : "outline"}>
                  <Link to="/sign-up">{tier.cta}</Link>
                </Button>
              ) : (
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <Button 
                    className="w-full rounded-md" 
                    variant="default"
                    onClick={() => handleSubscribe(tier.name, 'stripe')}
                    disabled={loadingPlan !== null}
                  >
                    {loadingPlan === `${tier.name.toLowerCase()}-stripe` ? 'Wait...' : 'Stripe'}
                  </Button>
                  <Button 
                    className="w-full rounded-md bg-[#f14635] text-white hover:bg-[#f14635]/90 border border-[#f14635]" 
                    onClick={() => handleSubscribe(tier.name, 'kaspi')}
                    disabled={loadingPlan !== null}
                  >
                    {loadingPlan === `${tier.name.toLowerCase()}-kaspi` ? 'Wait...' : 'Kaspi Pay'}
                  </Button>
                </div>
              )}

              <ul className="mt-6 space-y-2.5 text-sm">
                {tier.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-foreground/80">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}