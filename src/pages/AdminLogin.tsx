import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: replace with real Supabase auth when backend is connected
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    if (email === "admin@school.edu" && password === "admin123") {
      sessionStorage.setItem("self-service-admin", "1");
      navigate("/admin");
      return;
    }
    toast.error("Invalid credentials");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6">
          <button
            onClick={() => navigate("/")}
            className="mb-4 flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <h1 className="text-xl font-semibold text-foreground">Admin login</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to manage visitor requests.
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="space-y-4 rounded-lg border border-border bg-card p-6"
        >
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@company.com"
              className="h-10"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="h-10"
            />
          </div>

          <Button type="submit" disabled={loading} className="h-10 w-full">
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
