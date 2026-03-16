import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CheckCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";
import { supabase } from "@/lib/supabase";
import { getCreationMessage } from "@/lib/emailTemplates";
import emailjs from "@emailjs/browser";

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
    host_id: "",
    host_name: "",
    host_email: "",
    appointment_time: "",
  });

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from("admins")
      .select("id, name, email")
      .order("name", { ascending: true, nullsFirst: false })
      .then(({ data }) => setHosts((data ?? []) as Host[]));
  }, []);

  useEffect(() => {
    const key = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
    if (key) emailjs.init(key);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "host_id") {
      const host = hosts.find((h) => h.id === value);
      if (host) {
        setForm((prev) => ({
          ...prev,
          host_id: value,
          host_name: host.name?.trim() || host.email,
          host_email: host.email,
        }));
        return;
      }
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      toast.error("Database not configured");
      return;
    }
    if (form.appointment_time.trim()) {
      const chosen = new Date(form.appointment_time.trim());
      const now = new Date();
      now.setSeconds(0, 0);
      if (chosen < now) {
        toast.error("Appointment time must be now or in the future.");
        return;
      }
    }
    setLoading(true);
    const { error } = await supabase.from("visitors").insert({
      full_name: form.full_name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      purpose: form.purpose.trim(),
      host_name: form.host_name.trim(),
      appointment_time: form.appointment_time.trim()
        ? new Date(form.appointment_time.trim()).toISOString()
        : null,
    });
    if (error) {
      setLoading(false);
      toast.error(error.message || "Request failed");
      return;
    }
    const hostEmail = form.host_email?.trim();
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
    const adminNotifyTemplateId = import.meta.env.VITE_EMAILJS_ADMIN_NOTIFY_TEMPLATE_ID;
    if (hostEmail && serviceId && publicKey && adminNotifyTemplateId) {
      try {
        const adminLink = `${typeof window !== "undefined" ? window.location.origin : ""}/admin/login`;
        const message = getCreationMessage({
          visitor_name: form.full_name.trim(),
          purpose: form.purpose.trim(),
          host_name: form.host_name.trim(),
          visit_date: new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          admin_link: adminLink,
        });
        await emailjs.send(serviceId, adminNotifyTemplateId, {
          email: hostEmail,
          to_email: hostEmail,
          name: form.host_name.trim(),
          message,
        });
      } catch {
        // Email is best-effort; visitor was already created
      }
    }
    setLoading(false);
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
                host_id: "",
                host_name: "",
                host_email: "",
                appointment_time: "",
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
                Email *
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="sarah@example.com"
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-sm">
                Phone *
              </Label>
              <Input
                id="phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
                placeholder="+1 234 567 890"
                className="h-10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="host_id" className="text-sm">
              Host (who are you visiting?) *
            </Label>
            <select
              id="host_id"
              name="host_id"
              value={form.host_id}
              onChange={handleChange}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Select host</option>
              {hosts.map((h) => {
                const label = h.name?.trim() || h.email;
                return (
                  <option key={h.id} value={h.id}>
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
            <Label htmlFor="appointment_time" className="text-sm">
              Appointment time *
            </Label>
            <Input
              id="appointment_time"
              name="appointment_time"
              type="datetime-local"
              required
              min={(() => {
                const d = new Date();
                const pad = (n: number) => String(n).padStart(2, "0");
                return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
              })()}
              value={form.appointment_time}
              onChange={handleChange}
              className="h-10"
            />
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
