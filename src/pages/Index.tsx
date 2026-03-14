import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";
import { Users, Shield } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
          <Users className="h-6 w-6 text-foreground" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">Visitor Management</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Self-service check-in system. Register your visit or sign in as an administrator.
        </p>

        <div className="mt-8 space-y-3">
          <Button onClick={() => navigate("/check-in")} className="h-10 w-full gap-2">
            <Users className="h-4 w-4" /> Check In
          </Button>
          <Button
            onClick={() => navigate("/admin/login")}
            variant="outline"
            className="h-10 w-full gap-2"
          >
            <Shield className="h-4 w-4" /> Admin Login
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
