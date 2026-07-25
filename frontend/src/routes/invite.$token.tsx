import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useAuth, useOrganizationList } from "@clerk/tanstack-react-start";
import { useGetInvitationDetails, useAcceptInvitation, useDeclineInvitation } from "../lib/queries";
import { Button } from "../components/ui/button";
import { SiteHeader } from "../components/site-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";

export const Route = createFileRoute("/invite/$token")({
  head: () => ({
    meta: [
      { title: "Invitation — TaskBoard" },
      { name: "description", content: "Accept your organization invitation." },
    ],
  }),
  component: InvitePage,
});

function InvitePage() {
  const { token } = Route.useParams();
  const { isLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();
  
  const { data: invitation, isLoading, error } = useGetInvitationDetails(token);
  const { mutate: accept, isPending: isAccepting } = useAcceptInvitation();
  const { mutate: decline, isPending: isDeclining } = useDeclineInvitation();

  const { setActive } = useOrganizationList();
  
  const handleAccept = () => {
    accept(token, {
      onSuccess: async () => {
        if (setActive && invitation?.organization_id) {
          try {
            await setActive({ organization: invitation.organization_id });
          } catch (e) {
            console.error("Failed to set active organization", e);
          }
        }
        navigate({ to: "/dashboard" });
      },
    });
  };

  const handleDecline = () => {
    decline(token, {
      onSuccess: () => {
        navigate({ to: "/" });
      },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto flex max-w-7xl items-center justify-center px-4 py-24 md:px-6">
        <Card className="w-full max-w-md shadow-lg border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Organization Invitation</CardTitle>
            <CardDescription>
              You have been invited to join an organization on TaskBoard.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-6">
            {isLoading ? (
              <p className="text-sm text-muted-foreground animate-pulse">Loading invitation details...</p>
            ) : error ? (
              <div className="text-center text-destructive">
                <p>This invitation is invalid or has expired.</p>
              </div>
            ) : invitation?.status === "accepted" ? (
              <div className="text-center text-primary">
                <p>This invitation has already been accepted.</p>
                <Button asChild className="mt-4" variant="outline">
                  <Link to="/dashboard">Go to Dashboard</Link>
                </Button>
              </div>
            ) : invitation?.status === "declined" ? (
              <div className="text-center text-muted-foreground">
                <p>This invitation was declined.</p>
              </div>
            ) : invitation ? (
              <div className="text-center">
                <p className="mb-2">
                  <span className="font-semibold text-primary">{invitation.sender_user_id}</span> has invited you to join as a <span className="font-semibold capitalize text-primary">{invitation.role.replace("org:", "")}</span>.
                </p>
                <div className="mt-4 rounded-md border border-border bg-muted/30 px-4 py-2">
                  <p className="text-sm text-muted-foreground">Sent to: {invitation.recipient_email}</p>
                </div>
              </div>
            ) : null}
          </CardContent>
          {invitation && !error && invitation.status === "pending" && (
            <CardFooter className="flex flex-col gap-3">
              {!isLoaded ? (
                <Button disabled className="w-full">Loading...</Button>
              ) : !isSignedIn ? (
                <div className="w-full text-center">
                  <Button asChild className="w-full">
                    <Link to="/sign-up">Sign up to Accept</Link>
                  </Button>
                  <p className="mt-4 text-xs text-muted-foreground">
                    Already have an account? <Link to="/sign-in" className="underline hover:text-primary transition-colors">Sign in</Link>
                  </p>
                </div>
              ) : (
                <div className="flex w-full gap-3">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleDecline}
                    disabled={isAccepting || isDeclining}
                  >
                    {isDeclining ? "Declining..." : "Decline"}
                  </Button>
                  <Button
                    className="w-full"
                    onClick={handleAccept}
                    disabled={isAccepting || isDeclining}
                  >
                    {isAccepting ? "Accepting..." : "Accept Invitation"}
                  </Button>
                </div>
              )}
            </CardFooter>
          )}
        </Card>
      </main>
    </div>
  );
}
