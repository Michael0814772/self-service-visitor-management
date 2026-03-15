import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { ArrowLeft, UserPlus } from "lucide-react";
import { supabase } from "@/lib/supabase";

const AdminCreate = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      toast.error("Database not configured");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    if (signUpError) {
      setLoading(false);
      toast.error(signUpError.message || "Sign up failed");
      return;
    }
    if (!data.user) {
      setLoading(false);
      toast.error("Sign up failed");
      return;
    }
    if (!data.session) {
      setLoading(false);
      toast.error(
        "Turn off “Confirm email” in Supabase Auth so admins are created without sending email.",
      );
      return;
    }
    const signUpEmail = data.user.email?.trim()?.toLowerCase();
    if (signUpEmail) {
      const { data: whitelistRow } = await supabase
        .from("admin_whitelist")
        .select("id")
        .eq("email", signUpEmail)
        .maybeSingle();
      if (!whitelistRow) {
        setLoading(false);
        toast.error("Not authorized as admin.");
        return;
      }
    }
    const { error: insertError } = await supabase.from("admins").insert({
      user_id: data.user.id,
      email: data.user.email ?? email.trim(),
      name: name.trim() || null,
    });
    setLoading(false);
    if (insertError) {
      toast.error(insertError.message || "Could not create admin");
      return;
    }
    setCreated(true);
    toast.success("Admin created. You can sign in now.");
    setTimeout(() => navigate("/admin/login"), 1500);
  };

  if (created) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 text-center">
          <h2 className="text-lg font-semibold text-foreground">
            Admin created
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            You can sign in at Admin Login.
          </p>
          <Button
            variant="outline"
            className="mt-4 w-full"
            onClick={() => navigate("/admin/login")}
          >
            Go to Admin Login
          </Button>
        </div>
      </div>
    );
  }

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
          <h1 className="flex items-center gap-2 text-xl font-semibold text-foreground">
            <UserPlus className="h-5 w-5" /> Create admin account
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign up to become an admin. You can then sign in and manage
            visitors.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg border border-border bg-card p-6"
        >
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm">
              Name
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              className="h-10"
            />
          </div>

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
              minLength={6}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-sm">
              Confirm password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="h-10"
              minLength={6}
            />
          </div>

          <Button type="submit" disabled={loading} className="h-10 w-full">
            {loading ? "Creating…" : "Create admin account"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <button
            type="button"
            className="font-medium text-foreground underline-offset-4 hover:underline"
            onClick={() => navigate("/admin/login")}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

export default AdminCreate;
