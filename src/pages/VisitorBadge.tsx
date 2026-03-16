import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { supabase } from "@/lib/supabase";

type Visitor = {
  full_name: string;
  purpose: string;
  host_name: string;
  appointment_time: string | null;
  duration_minutes: number | null;
};

const VisitorBadge = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("t");
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [loading, setLoading] = useState(true);

  const [visitUrl, setVisitUrl] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!supabase || !token) {
        setLoading(false);
        return;
      }
      let id: string;
      try {
        id =
          typeof window !== "undefined" ? window.atob(token) : token;
      } catch {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("visitors")
        .select(
          "full_name, purpose, host_name, appointment_time, duration_minutes",
        )
        .eq("id", id)
        .maybeSingle();
      setVisitor((data as Visitor) ?? null);
      const baseUrl =
        typeof window !== "undefined"
          ? window.location.origin
          : "https://example.com";
      setVisitUrl(`${baseUrl}/visit/${id}`);
      setLoading(false);
    };
    void run();
  }, [token]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <p className="text-sm text-muted-foreground">Loading badge…</p>
      </div>
    );
  }

  if (!visitor) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <p className="text-sm text-muted-foreground">Badge not found.</p>
      </div>
    );
  }

  const appointment = visitor.appointment_time
    ? new Date(visitor.appointment_time).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : "—";

  const durationLabel =
    typeof visitor.duration_minutes === "number"
      ? visitor.duration_minutes === 60
        ? "1 hour"
        : visitor.duration_minutes % 60 === 0
        ? `${visitor.duration_minutes / 60} hours`
        : `${visitor.duration_minutes} minutes`
      : "—";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-md print:border print:shadow-none">
        <div className="mb-4 border-b border-border pb-3 text-center">
          <h1 className="text-lg font-semibold text-foreground">
            Visitor Badge
          </h1>
          <p className="text-xs text-muted-foreground">
            Please keep this badge visible while on site.
          </p>
        </div>
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Visitor
            </p>
            <p className="text-base font-medium text-foreground">
              {visitor.full_name}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Host
            </p>
            <p className="text-sm text-foreground">{visitor.host_name}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Purpose
            </p>
            <p className="text-sm text-foreground">{visitor.purpose}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Appointment
              </p>
              <p className="text-sm text-foreground">{appointment}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Duration
              </p>
              <p className="text-sm text-foreground">{durationLabel}</p>
            </div>
          </div>

          <div className="mt-4 flex justify-center">
            {visitUrl && (
              // QR code for this visit, same target as email
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  visitUrl,
                )}`}
                alt="Visitor QR code"
                className="h-40 w-40 rounded-md border border-border bg-background p-1"
              />
            )}
          </div>
        </div>
        <div className="mt-6 flex gap-3 print:hidden">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex h-9 flex-1 items-center justify-center rounded-md bg-primary text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            Print badge
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex h-9 flex-1 items-center justify-center rounded-md border border-border text-xs font-medium text-foreground hover:bg-accent"
          >
            Download (Print to PDF)
          </button>
        </div>
      </div>
    </div>
  );
};

export default VisitorBadge;

