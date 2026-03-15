import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      toast.error("Database not configured");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message || "Invalid credentials");
      return;
    }
    if (!data.user) {
      toast.error("Invalid credentials");
      return;
    }

    const loginEmail = data.user.email?.trim()?.toLowerCase();
    if (loginEmail) {
      const { data: whitelistRow } = await supabase
        .from("admin_whitelist")
        .select("id")
        .eq("email", loginEmail)
        .maybeSingle();
      if (!whitelistRow) {
        await supabase.auth.signOut();
        toast.error("Not authorized as admin.");
        return;
      }
    }

    const { data: adminRow, error: adminError } = await supabase
      .from("admins")
      .select("id")
      .eq("user_id", data.user.id)
      .maybeSingle();
    if (adminError) {
      await supabase.auth.signOut();
      toast.error(adminError.message || "Could not verify admin.");
      return;
    }
    if (!adminRow) {
      await supabase.auth.signOut();
      toast.error("Not an admin. Create an admin account first.");
      return;
    }
    toast.success("Signed in");
    navigate("/admin");
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

          <p className="mt-4 text-center text-sm text-muted-foreground">
            No account?{" "}
            <button
              type="button"
              className="font-medium text-foreground underline-offset-4 hover:underline"
              onClick={() => navigate("/admin-create")}
            >
              Create admin account
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
