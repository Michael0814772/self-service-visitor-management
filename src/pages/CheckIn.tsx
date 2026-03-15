import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CheckCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";
import { supabase } from "@/lib/supabase";

type Host = { id: string; name: string | null; email: string };

const CheckIn = () => {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    purpose: "",
    host_name: "",
    company: "",
  });

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from("admins")
      .select("id, name, email")
      .order("name", { ascending: true, nullsFirst: false })
      .then(({ data }) => setHosts((data ?? []) as Host[]));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      toast.error("Database not configured");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("visitors").insert({
      full_name: form.full_name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      purpose: form.purpose.trim(),
      host_name: form.host_name.trim(),
      company: form.company.trim() || null,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message || "Request failed");
      return;
    }
    setSubmitted(true);
    toast.success("Request submitted");
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-status-approved-bg">
            <CheckCircle className="h-6 w-6 text-status-approved-fg" />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Request submitted</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Your visit request is pending approval. Please wait for the admin to review your
            request.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSubmitted(false);
              setForm({
                full_name: "",
                email: "",
                phone: "",
                purpose: "",
                host_name: "",
                company: "",
              });
            }}
          >
            Submit another request
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <button
            onClick={() => navigate("/")}
            className="mb-4 flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <h1 className="text-xl font-semibold text-foreground">Check In</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Fill in your details to request entry.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg border border-border bg-card p-6"
        >
          <div className="space-y-1.5">
            <Label htmlFor="full_name" className="text-sm">
              Full name *
            </Label>
            <Input
              id="full_name"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              required
              placeholder="Sarah Chen"
              className="h-10"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="sarah@example.com"
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-sm">
                Phone
              </Label>
              <Input
                id="phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+1 234 567 890"
                className="h-10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="company" className="text-sm">
              Company
            </Label>
            <Input
              id="company"
              name="company"
              value={form.company}
              onChange={handleChange}
              placeholder="Acme Inc."
              className="h-10"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="host_name" className="text-sm">
              Host (who are you visiting?) *
            </Label>
            <select
              id="host_name"
              name="host_name"
              value={form.host_name}
              onChange={handleChange}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Select host</option>
              {hosts.map((h) => {
                const label = h.name?.trim() || h.email;
                return (
                  <option key={h.id} value={label}>
                    {label}
                  </option>
                );
              })}
            </select>
            {hosts.length === 0 && supabase && (
              <p className="text-xs text-muted-foreground">No hosts available. Add admins in the dashboard.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="purpose" className="text-sm">
              Purpose of visit *
            </Label>
            <Textarea
              id="purpose"
              name="purpose"
              value={form.purpose}
              onChange={handleChange}
              required
              placeholder="Interview — Design Department"
              rows={3}
            />
          </div>

          <Button type="submit" disabled={loading} className="h-10 w-full">
            {loading ? "Submitting…" : "Request Entry"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CheckIn;
