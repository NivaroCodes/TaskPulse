import { useState } from "react";
import { CreateOrganization } from "@clerk/tanstack-react-start";
import { Plus } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { organizationsApi } from "@/lib/api";
import { useAuth } from "@clerk/tanstack-react-start";

export function CreateOrganizationDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canCreate, setCanCreate] = useState(false);
  
  const { getToken } = useAuth();

  const handleOpenChange = async (newOpen: boolean) => {
    if (newOpen) {
      setLoading(true);
      setError(null);
      setCanCreate(false);
      try {
        const response = await organizationsApi.canCreate(getToken);
        if (response && response.can_create) {
          setCanCreate(true);
        }
      } catch (err: any) {
        if (err.message && err.message.includes("limit")) {
          setError(err.message);
        } else {
          setError("An error occurred while checking permissions.");
        }
      } finally {
        setLoading(false);
      }
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1 h-8 px-2 rounded-md border-border/60">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Org</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Organization</DialogTitle>
          <DialogDescription>
            Create a new workspace for your team.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-4">
          {loading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          ) : error ? (
            <div className="text-center space-y-4">
              <div className="p-4 bg-destructive/10 text-destructive rounded-md text-sm font-medium">
                {error}
              </div>
              <Button asChild className="w-full">
                <a href="/pricing">View Pricing Plans</a>
              </Button>
            </div>
          ) : canCreate ? (
            <div className="w-full flex justify-center">
              <CreateOrganization 
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "shadow-none border-none",
                  }
                }}
              />
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
