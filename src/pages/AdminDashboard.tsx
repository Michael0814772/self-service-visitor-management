import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";
import { LogOut, Users, Clock, CheckCircle, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { getApprovalMessage } from "@/lib/emailTemplates";
import emailjs from "@emailjs/browser";

type VisitorStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CHECKED_IN"
  | "CHECKED_OUT";

interface Visitor {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  purpose: string;
  host_name: string;
  appointment_time: string | null;
   duration_minutes: number | null;
  status: VisitorStatus;
  created_at: string;
  checked_in_at: string | null;
  checked_out_at: string | null;
  notes: string | null;
}

type FilterTab = "ALL" | VisitorStatus;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [adminName, setAdminName] = useState<string>("");
  const [approveDurationMinutes, setApproveDurationMinutes] =
    useState<number>(30);
  const [showApproveDuration, setShowApproveDuration] = useState(false);
  const [updatingVisitorId, setUpdatingVisitorId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) {
        navigate("/admin/login");
        return;
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/admin/login");
        return;
      }
      const sessionEmail = session.user.email?.trim()?.toLowerCase();
      if (sessionEmail) {
        const { data: whitelistRow } = await supabase
          .from("admin_whitelist")
          .select("id")
          .eq("email", sessionEmail)
          .maybeSingle();
        if (!whitelistRow) {
          await supabase.auth.signOut();
          toast.error("Not authorized as admin.");
          navigate("/admin/login");
          return;
        }
      }

      const { data: adminRow } = await supabase
        .from("admins")
        .select("id, name, email")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (!adminRow) {
        await supabase.auth.signOut();
        navigate("/admin/login");
        return;
      }
      const row = adminRow as { name?: string | null; email?: string };
      setAdminName(
        row.name?.trim() || row.email || session.user.email || "Admin",
      );
      const { data, error } = await supabase
        .from("visitors")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        toast.error(error.message || "Failed to load visitors");
        setVisitors([]);
      } else {
        setVisitors((data ?? []) as Visitor[]);
      }
      setLoading(false);
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    // Reset approve flow when changing selection or status
    setShowApproveDuration(false);
    setApproveDurationMinutes(30);
  }, [selectedVisitor?.id, selectedVisitor?.status]);

  const updateStatus = async (
    id: string,
    status: VisitorStatus,
    durationMinutes?: number,
  ) => {
    if (!supabase) return;
    if (updatingVisitorId) return;
    setUpdatingVisitorId(id);
    const visitor = visitors.find((v) => v.id === id);
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("visitors")
      .update({
        status,
        ...(status === "CHECKED_IN" ? { checked_in_at: now } : {}),
        ...(status === "CHECKED_OUT" ? { checked_out_at: now } : {}),
        ...(status === "APPROVED" && typeof durationMinutes === "number"
          ? { duration_minutes: durationMinutes }
          : {}),
      })
      .eq("id", id);
    if (error) {
      toast.error(error.message || "Update failed");
      setUpdatingVisitorId(null);
      return;
    }
    const recipientEmail = visitor?.email?.trim();
    if (status === "APPROVED" && recipientEmail) {
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const templateId = import.meta.env.VITE_EMAILJS_ADMIN_NOTIFY_TEMPLATE_ID;
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
      if (serviceId && templateId && publicKey) {
        try {
          const baseUrl =
            typeof window !== "undefined"
              ? window.location.origin
              : "https://example.com";
          const token =
            typeof window !== "undefined"
              ? window.btoa(visitor!.id)
              : visitor!.id;
          const qrTarget = `${baseUrl}/visit/${visitor!.id}`;
          const badgeUrl = `${baseUrl}/badge?t=${encodeURIComponent(token)}`;
          const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
            qrTarget,
          )}`;
          const message = getApprovalMessage({
            purpose: visitor!.purpose,
            host_name: visitor!.host_name,
            appointment_time: visitor!.appointment_time,
            duration_minutes:
              typeof durationMinutes === "number"
                ? durationMinutes
                : visitor!.duration_minutes ?? undefined,
            qr_code_url: qrCodeUrl,
            badge_url: badgeUrl,
          });
          emailjs.init(publicKey);
          await emailjs.send(serviceId, templateId, {
            email: recipientEmail,
            to_email: recipientEmail,
            name: visitor!.full_name,
            message,
          });
        } catch {
          // Email is best-effort
        }
      }
    }
    setVisitors((prev) =>
      prev.map((v) =>
        v.id === id
          ? {
              ...v,
              status,
              ...(status === "CHECKED_IN" ? { checked_in_at: now } : {}),
              ...(status === "CHECKED_OUT" ? { checked_out_at: now } : {}),
              ...(status === "APPROVED" && typeof durationMinutes === "number"
                ? { duration_minutes: durationMinutes }
                : {}),
            }
          : v,
      ),
    );
    if (selectedVisitor?.id === id) {
      setSelectedVisitor((prev) =>
        prev
          ? {
              ...prev,
              status,
              ...(status === "CHECKED_IN" ? { checked_in_at: now } : {}),
              ...(status === "CHECKED_OUT" ? { checked_out_at: now } : {}),
              ...(status === "APPROVED" && typeof durationMinutes === "number"
                ? { duration_minutes: durationMinutes }
                : {}),
            }
          : null,
      );
    }
    toast.success(`Visitor ${status.toLowerCase()}`);
    setUpdatingVisitorId(null);
  };

  const handleLogout = async () => {
    await supabase?.auth.signOut();
    navigate("/admin/login");
  };

  const filtered =
    activeTab === "ALL"
      ? visitors
      : visitors.filter((v) => v.status === activeTab);
  const pendingCount = visitors.filter((v) => v.status === "PENDING").length;
  const approvedCount = visitors.filter((v) => v.status === "APPROVED").length;
  const rejectedCount = visitors.filter((v) => v.status === "REJECTED").length;
  const checkedInCount = visitors.filter(
    (v) => v.status === "CHECKED_IN",
  ).length;
  const checkedOutCount = visitors.filter(
    (v) => v.status === "CHECKED_OUT",
  ).length;

  const tabs: { label: string; value: FilterTab; count?: number }[] = [
    { label: "All", value: "ALL", count: visitors.length },
    { label: "Pending", value: "PENDING", count: pendingCount },
    { label: "Approved", value: "APPROVED", count: approvedCount },
    { label: "Rejected", value: "REJECTED", count: rejectedCount },
    { label: "Checked in", value: "CHECKED_IN", count: checkedInCount },
    { label: "Checked out", value: "CHECKED_OUT", count: checkedOutCount },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card md:block">
        <div className="flex h-14 items-center border-b border-border px-4">
          <Users className="mr-2 h-5 w-5 shrink-0 text-foreground" />
          <span className="truncate text-sm font-semibold text-foreground">
            {adminName || "Visitor Management"}
          </span>
        </div>
        <nav className="space-y-1 p-3">
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md bg-accent px-3 py-2 text-sm font-medium text-foreground"
          >
            <Clock className="h-4 w-4" /> Visitor Queue
          </button>
        </nav>
        <div className="absolute bottom-0 w-64 border-t border-border p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start gap-2 text-muted-foreground"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <header className="flex h-14 items-center justify-between border-b border-border px-6">
          <h1 className="text-base font-semibold text-foreground">
            Visitor Queue{" "}
            {pendingCount > 0 && (
              <span className="ml-1 text-muted-foreground">
                ({pendingCount} Pending)
              </span>
            )}
          </h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="gap-2 text-muted-foreground md:hidden"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </header>

        <div className="flex gap-1 border-b border-border px-6 pt-2">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.value
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1.5 text-xs text-muted-foreground">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-6">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No visitors found.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Name
                    </th>
                    <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">
                      Purpose
                    </th>
                    <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">
                      Host
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">
                      Check-in
                    </th>
                    <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">
                      Check-out
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout">
                    {filtered.map((visitor) => (
                      <motion.tr
                        key={visitor.id}
                        layout
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="h-14 cursor-pointer border-b border-border last:border-b-0 hover:bg-secondary/30"
                        onClick={() => setSelectedVisitor(visitor)}
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">
                            {visitor.full_name}
                          </div>
                        </td>
                        <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                          {visitor.purpose}
                        </td>
                        <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                          {visitor.host_name}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={visitor.status} />
                        </td>
                        <td className="hidden px-4 py-3 tabular-nums text-muted-foreground lg:table-cell">
                          {visitor.checked_in_at
                            ? format(
                                new Date(visitor.checked_in_at),
                                "MMM d, hh:mm a",
                              )
                            : "—"}
                        </td>
                        <td className="hidden px-4 py-3 tabular-nums text-muted-foreground lg:table-cell">
                          {visitor.checked_out_at
                            ? format(
                                new Date(visitor.checked_out_at),
                                "MMM d, hh:mm a",
                              )
                            : "—"}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Detail slide-over */}
      <AnimatePresence>
        {selectedVisitor && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-foreground"
              onClick={() => setSelectedVisitor(null)}
              aria-hidden
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-auto border-l border-border bg-card shadow-lg"
            >
              <div className="flex h-14 items-center justify-between border-b border-border px-6">
                <h2 className="text-sm font-semibold text-foreground">
                  Visitor Details
                </h2>
                <button
                  type="button"
                  onClick={() => setSelectedVisitor(null)}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Close
                </button>
              </div>
              <div className="space-y-5 p-6">
                    {selectedVisitor.status === "PENDING" && showApproveDuration ? (
                  <>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Duration
                      </p>
                      <select
                        className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={approveDurationMinutes}
                        onChange={(e) =>
                          setApproveDurationMinutes(Number(e.target.value))
                        }
                      >
                        <option value={30}>30 minutes</option>
                        <option value={60}>1 hour</option>
                        <option value={120}>2 hours</option>
                        <option value={180}>3 hours</option>
                        <option value={240}>4 hours</option>
                      </select>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        disabled={updatingVisitorId === selectedVisitor.id}
                        onClick={() =>
                          updateStatus(
                            selectedVisitor.id,
                            "APPROVED",
                            approveDurationMinutes,
                          )
                        }
                        className="h-10 flex-1 gap-1 bg-status-approved-fg text-primary-foreground hover:bg-status-approved-fg/90"
                      >
                        <CheckCircle className="h-4 w-4" />{" "}
                        {updatingVisitorId === selectedVisitor.id
                          ? "Confirming..."
                          : "Confirm"}
                      </Button>
                      <Button
                        variant="outline"
                        disabled={updatingVisitorId === selectedVisitor.id}
                        onClick={() =>
                          updateStatus(selectedVisitor.id, "REJECTED")
                        }
                        className="h-10 flex-1 gap-1 border-status-rejected-border text-status-rejected-fg hover:bg-status-rejected-bg"
                      >
                        <XCircle className="h-4 w-4" /> Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-xs text-muted-foreground">Name</p>
                      <p className="text-sm font-medium text-foreground">
                        {selectedVisitor.full_name}
                      </p>
                    </div>
                    {selectedVisitor.email && (
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="text-sm text-foreground">
                          {selectedVisitor.email}
                        </p>
                      </div>
                    )}
                    {selectedVisitor.phone && (
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="text-sm text-foreground">
                          {selectedVisitor.phone}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">Host</p>
                      <p className="text-sm text-foreground">
                        {selectedVisitor.host_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Purpose</p>
                      <p className="text-sm text-foreground">
                        {selectedVisitor.purpose}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Appointment time
                      </p>
                      <p className="text-sm tabular-nums text-foreground">
                        {selectedVisitor.appointment_time
                          ? format(
                              new Date(selectedVisitor.appointment_time),
                              "MMM d, yyyy 'at' hh:mm a",
                            )
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <div className="mt-1">
                        <StatusBadge status={selectedVisitor.status} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Requested at
                      </p>
                      <p className="text-sm tabular-nums text-foreground">
                        {format(
                          new Date(selectedVisitor.created_at),
                          "MMM d, yyyy 'at' hh:mm a",
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Check-in at
                      </p>
                      <p className="text-sm tabular-nums text-foreground">
                        {selectedVisitor.checked_in_at
                          ? format(
                              new Date(selectedVisitor.checked_in_at),
                              "MMM d, yyyy 'at' hh:mm a",
                            )
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Check-out at
                      </p>
                      <p className="text-sm tabular-nums text-foreground">
                        {selectedVisitor.checked_out_at
                          ? format(
                              new Date(selectedVisitor.checked_out_at),
                              "MMM d, yyyy 'at' hh:mm a",
                            )
                          : "—"}
                      </p>
                    </div>

                    {selectedVisitor.status === "PENDING" && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          disabled={updatingVisitorId === selectedVisitor.id}
                          onClick={() => setShowApproveDuration(true)}
                          className="h-10 flex-1 gap-1 bg-status-approved-fg text-primary-foreground hover:bg-status-approved-fg/90"
                        >
                          <CheckCircle className="h-4 w-4" /> Approve
                        </Button>
                        <Button
                          variant="outline"
                          disabled={updatingVisitorId === selectedVisitor.id}
                          onClick={() =>
                            updateStatus(selectedVisitor.id, "REJECTED")
                          }
                          className="h-10 flex-1 gap-1 border-status-rejected-border text-status-rejected-fg hover:bg-status-rejected-bg"
                        >
                          <XCircle className="h-4 w-4" /> Reject
                        </Button>
                      </div>
                    )}
                    {selectedVisitor.status === "APPROVED" && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      disabled={updatingVisitorId === selectedVisitor.id}
                      onClick={() =>
                        updateStatus(selectedVisitor.id, "CHECKED_IN")
                      }
                      className="h-10 w-full gap-1"
                    >
                      <CheckCircle className="h-4 w-4" /> Check in
                    </Button>
                  </div>
                )}
                    {selectedVisitor.status === "CHECKED_IN" && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      disabled={updatingVisitorId === selectedVisitor.id}
                      onClick={() =>
                        updateStatus(selectedVisitor.id, "CHECKED_OUT")
                      }
                      className="h-10 w-full gap-1"
                    >
                      Check out
                    </Button>
                  </div>
                )}
                  </>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
