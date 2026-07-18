import { SignUp } from "@clerk/tanstack-react-start";
import { createFileRoute } from "@tanstack/react-router";

import { SiteHeader } from "../components/site-header";

export const Route = createFileRoute("/sign-up/$")({
  head: () => ({
    meta: [
      { title: "Sign up — TaskBoard" },
      { name: "description", content: "Create your TaskBoard account and start collaborating." },
    ],
  }),
  component: SignUpPage,
});

function SignUpPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col items-center px-4 py-16">
        <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" fallbackRedirectUrl="/dashboard" />
      </main>
    </div>
  );
}