import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleTogglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

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
      void logAudit({
        user_id: null,
        action: "ADMIN_LOGIN",
        details: { email: email.trim().toLowerCase(), result: "error" },
      });
      return;
    }
    if (!data.user) {
      toast.error("Invalid credentials");
      void logAudit({
        user_id: null,
        action: "ADMIN_LOGIN",
        details: { email: email.trim().toLowerCase(), result: "no_user" },
      });
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
        void logAudit({
          user_id: data.user.id,
          action: "ADMIN_LOGIN",
          details: { email: loginEmail, result: "not_whitelisted" },
        });
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
      void logAudit({
        user_id: data.user.id,
        action: "ADMIN_LOGIN",
        details: { email: loginEmail, result: "admin_error" },
      });
      return;
    }
    if (!adminRow) {
      await supabase.auth.signOut();
      toast.error("Not an admin. Create an admin account first.");
      void logAudit({
        user_id: data.user.id,
        action: "ADMIN_LOGIN",
        details: { email: loginEmail, result: "no_admin_row" },
      });
      return;
    }
    void logAudit({
      user_id: data.user.id,
      action: "ADMIN_LOGIN",
      details: { email: loginEmail, result: "success" },
    });
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
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="h-10 pr-10"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={handleTogglePasswordVisibility}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleTogglePasswordVisibility();
                  }
                }}
                className="absolute right-0 top-0 flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground outline-none ring-offset-background transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={0}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 shrink-0" aria-hidden />
                ) : (
                  <Eye className="h-4 w-4 shrink-0" aria-hidden />
                )}
              </button>
            </div>
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
