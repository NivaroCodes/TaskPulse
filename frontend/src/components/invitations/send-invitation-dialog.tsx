import { useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { useSendInvitation, useOrgPlan } from "../../lib/queries";
import { MailPlus, AlertCircle, Lock } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export function SendInvitationDialog() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("org:member");
  const navigate = useNavigate();
  
  const { data: planData } = useOrgPlan();
  const plan = planData?.plan ?? "free";
  const hasAdvancedRoles = plan === "team" || plan === "enterprise";

  const { mutate: sendInvitation, isPending } = useSendInvitation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    sendInvitation(
      { recipient_email: email, role },
      {
        onSuccess: () => {
          setOpen(false);
          setEmail("");
          setRole("org:member");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 h-8">
          <MailPlus className="h-4 w-4" />
          <span className="hidden sm:inline">Invite Team</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Send Invitation</DialogTitle>
            <DialogDescription>
              Invite a new member to join your organization.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="org:member">Member</SelectItem>
                  <SelectItem value="org:admin">Admin</SelectItem>
                  <SelectItem value="org:project_manager" disabled={!hasAdvancedRoles}>
                    <div className="flex items-center gap-2">
                      Project Manager {!hasAdvancedRoles && <Lock className="h-3 w-3 text-muted-foreground" />}
                    </div>
                  </SelectItem>
                  <SelectItem value="org:viewer" disabled={!hasAdvancedRoles}>
                    <div className="flex items-center gap-2">
                      Viewer {!hasAdvancedRoles && <Lock className="h-3 w-3 text-muted-foreground" />}
                    </div>
                  </SelectItem>
                  <SelectItem value="org:guest" disabled={!hasAdvancedRoles}>
                    <div className="flex items-center gap-2">
                      Guest {!hasAdvancedRoles && <Lock className="h-3 w-3 text-muted-foreground" />}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {!hasAdvancedRoles && (
              <div className="text-xs text-muted-foreground mt-1 mb-2">
                Advanced roles (Project Manager, Viewer, Guest) are available on the Team plan.{' '}
                <button 
                  type="button" 
                  onClick={() => { setOpen(false); navigate({ to: '/pricing' }); }}
                  className="text-primary hover:underline font-medium"
                >
                  Upgrade now
                </button>
              </div>
            )}
            
            <Alert variant="default" className="bg-muted/50 border-primary/20">
              <AlertCircle className="h-4 w-4 text-primary" />
              <AlertTitle className="text-sm font-medium">Deliverability Notice</AlertTitle>
              <AlertDescription className="text-xs text-muted-foreground mt-1">
                If your team member doesn't see the email, ask them to check their <strong>Spam folder</strong> and mark it as <strong>"Not Spam"</strong>. Also, asking them to reply "Got it!" helps improve our email delivery!
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Sending..." : "Send Invite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
