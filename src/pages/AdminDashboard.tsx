import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";
import { LogOut, Users, Clock, CheckCircle, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { getApprovalMessage, getRejectionMessage } from "@/lib/emailTemplates";
import { logAudit } from "@/lib/audit";
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
  floor: string | null;
  status: VisitorStatus;
  created_at: string;
  updated_at: string;
  checked_in_at: string | null;
  checked_out_at: string | null;
  notes: string | null;
}

type FilterTab = "ALL" | VisitorStatus;

type AuditLog = {
  log_id: string;
  user_id: string | null;
  action: string;
  timestamp: string;
  details: string | null;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [view, setView] = useState<"queue" | "audit">("queue");
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [adminName, setAdminName] = useState<string>("");
  const [approveDurationMinutes, setApproveDurationMinutes] =
    useState<number>(30);
  const [approveFloorNumber, setApproveFloorNumber] = useState("");
  const [showApproveDuration, setShowApproveDuration] = useState(false);
  const [updatingVisitorId, setUpdatingVisitorId] = useState<string | null>(
    null,
  );
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<AuditLog | null>(null);
  const [auditActionFilter, setAuditActionFilter] = useState<string>("ALL");

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
    if (view !== "audit" || !supabase) return;
    setAuditLoading(true);
    supabase
      .from("audit_log")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setAuditLogs(((data as AuditLog[]) ?? []) as AuditLog[]);
        setAuditLoading(false);
        setAuditActionFilter("ALL");
      });
  }, [view]);

  useEffect(() => {
    // Reset approve flow when changing selection or status
    setShowApproveDuration(false);
    setApproveDurationMinutes(30);
    setApproveFloorNumber("");
    setShowRejectReason(false);
    setRejectReason("");
  }, [selectedVisitor?.id, selectedVisitor?.status]);

  const updateStatus = async (
    id: string,
    status: VisitorStatus,
    options?: {
      durationMinutes?: number;
      floorNumber?: string;
      notes?: string;
    },
  ) => {
    if (!supabase) return;
    if (updatingVisitorId) return;
    setUpdatingVisitorId(id);
    const visitor = visitors.find((v) => v.id === id);
    const now = new Date().toISOString();
    const durationMinutes = options?.durationMinutes;
    const floorNumber = options?.floorNumber?.trim();
    const notes = options?.notes?.trim();
    const { error } = await supabase
      .from("visitors")
      .update({
        status,
        ...(status === "CHECKED_IN" ? { checked_in_at: now } : {}),
        ...(status === "CHECKED_OUT" ? { checked_out_at: now } : {}),
        ...(status === "APPROVED" && typeof durationMinutes === "number"
          ? { duration_minutes: durationMinutes }
          : {}),
        ...(status === "APPROVED" && floorNumber
          ? { floor: floorNumber }
          : {}),
        ...(status === "REJECTED" && notes
          ? { notes }
          : {}),
      })
      .eq("id", id);
    if (error) {
      toast.error(error.message || "Update failed");
      setUpdatingVisitorId(null);
      return;
    }
    void logAudit({
      user_id: visitor?.id ?? id,
      action: "VISITOR_STATUS_UPDATE",
      details: {
        from: visitor?.status,
        to: status,
        durationMinutes,
        floorNumber,
        notes,
      },
    });
    const recipientEmail = visitor?.email?.trim();
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_ADMIN_NOTIFY_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
    if (recipientEmail && serviceId && templateId && publicKey) {
      try {
        const baseUrl =
          typeof window !== "undefined"
            ? window.location.origin
            : "https://example.com";

        let message: string | null = null;

        if (status === "APPROVED") {
          const token =
            typeof window !== "undefined"
              ? window.btoa(visitor!.id)
              : visitor!.id;
          const qrTarget = `${baseUrl}/visit/${visitor!.id}`;
          const badgeUrl = `${baseUrl}/badge?t=${encodeURIComponent(token)}`;
          const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
            qrTarget,
          )}`;
          message = getApprovalMessage({
            purpose: visitor!.purpose,
            host_name: visitor!.host_name,
            appointment_time: visitor!.appointment_time,
            duration_minutes:
              typeof durationMinutes === "number"
                ? durationMinutes
                : visitor!.duration_minutes ?? undefined,
            floor: floorNumber ?? visitor!.floor,
            qr_code_url: qrCodeUrl,
            badge_url: badgeUrl,
          });
        } else if (status === "REJECTED" && notes) {
          message = getRejectionMessage(notes);
        }

        if (message) {
          emailjs.init(publicKey);
          await emailjs.send(serviceId, templateId, {
            email: recipientEmail,
            to_email: recipientEmail,
            name: visitor!.full_name,
            message,
          });
        }
      } catch {
        // Email is best-effort
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
              ...(status === "APPROVED" && floorNumber
                ? { floor: floorNumber }
                : {}),
              ...(status === "REJECTED" && notes ? { notes } : {}),
              updated_at: now,
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
              ...(status === "APPROVED" && floorNumber
                ? { floor: floorNumber }
                : {}),
              ...(status === "REJECTED" && notes ? { notes } : {}),
              updated_at: now,
            }
          : null,
      );
    }
    toast.success(`Visitor ${status.toLowerCase()}`);
    setUpdatingVisitorId(null);
  };

  const handleLogout = async () => {
    const session = await supabase?.auth.getSession();
    const adminId = session?.data.session?.user.id ?? null;
    await supabase?.auth.signOut();
    void logAudit({
      user_id: adminId,
      action: "ADMIN_LOGOUT",
      details: {},
    });
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
            onClick={() => setView("queue")}
            className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
              view === "queue"
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
            }`}
          >
            <Clock className="h-4 w-4" /> Visitor Queue
          </button>
          <button
            type="button"
            onClick={() => setView("audit")}
            className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
              view === "audit"
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
            }`}
          >
            <Users className="h-4 w-4" /> Audit log
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
            {view === "queue" ? (
              <>
                Visitor Queue{" "}
                {pendingCount > 0 && (
                  <span className="ml-1 text-muted-foreground">
                    ({pendingCount} Pending)
                  </span>
                )}
              </>
            ) : (
              "Audit log"
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

        {view === "queue" && (
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
        )}

        <div className="p-6">
          {view === "audit" ? (
            auditLoading ? (
              <p className="text-sm text-muted-foreground">Loading audit log…</p>
            ) : auditLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No audit entries yet.</p>
            ) : (
              <>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    Showing latest {auditLogs.length} events
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Filter</span>
                    <select
                      value={auditActionFilter}
                      onChange={(e) => setAuditActionFilter(e.target.value)}
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground"
                    >
                      <option value="ALL">All actions</option>
                      {Array.from(new Set(auditLogs.map((l) => l.action))).map(
                        (action) => (
                          <option key={action} value={action}>
                            {action}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                </div>
                <div className="overflow-hidden rounded-lg border border-border">
                  <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Time
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Action
                      </th>
                      <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground md:table-cell">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(auditActionFilter === "ALL"
                      ? auditLogs
                      : auditLogs.filter((log) => log.action === auditActionFilter)
                    ).map((log) => (
                      <tr
                        key={log.log_id}
                        className="cursor-pointer border-b border-border last:border-b-0 hover:bg-secondary/30"
                        onClick={() => setSelectedAudit(log)}
                      >
                        <td className="px-4 py-2 tabular-nums text-muted-foreground">
                          {format(new Date(log.timestamp), "MMM d, yyyy HH:mm:ss")}
                        </td>
                        <td className="px-4 py-2 text-xs font-medium text-foreground">
                          {log.action}
                        </td>
                        <td className="hidden max-w-xs px-4 py-2 text-xs text-muted-foreground md:table-cell">
                          {log.details
                            ? log.details.length > 120
                              ? `${log.details.slice(0, 120)}…`
                              : log.details
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </>
            )
          ) : loading ? (
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
                    <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground xl:table-cell">
                      Created
                    </th>
                    <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground xl:table-cell">
                      Updated
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
                        <td className="hidden px-4 py-3 tabular-nums text-muted-foreground xl:table-cell">
                          {visitor.created_at
                            ? format(
                                new Date(visitor.created_at),
                                "MMM d, hh:mm a",
                              )
                            : "—"}
                        </td>
                        <td className="hidden px-4 py-3 tabular-nums text-muted-foreground xl:table-cell">
                          {visitor.updated_at
                            ? format(
                                new Date(visitor.updated_at),
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

      {/* Visitor detail slide-over */}
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
                      <p className="text-xs text-muted-foreground">Duration</p>
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
                    <div>
                      <label
                        htmlFor="approve-floor"
                        className="text-xs text-muted-foreground"
                      >
                        Floor number *
                      </label>
                      <input
                        id="approve-floor"
                        type="text"
                        inputMode="text"
                        autoComplete="off"
                        placeholder="e.g. 2, 3B, or Ground"
                        className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={approveFloorNumber}
                        onChange={(e) => setApproveFloorNumber(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        disabled={
                          updatingVisitorId === selectedVisitor.id ||
                          !approveFloorNumber.trim()
                        }
                        onClick={() =>
                          updateStatus(selectedVisitor.id, "APPROVED", {
                            durationMinutes: approveDurationMinutes,
                            floorNumber: approveFloorNumber.trim(),
                          })
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
                        onClick={() => {
                          setShowApproveDuration(false);
                          setApproveDurationMinutes(30);
                          setApproveFloorNumber("");
                        }}
                        className="h-10 flex-1 gap-1 border-border text-muted-foreground hover:bg-accent"
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : selectedVisitor.status === "PENDING" && showRejectReason ? (
                  <>
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground">
                        Rejection reason *
                      </p>
                      <textarea
                        className="mt-1 h-20 w-full rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Briefly explain why this request is rejected"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        disabled={
                          updatingVisitorId === selectedVisitor.id ||
                          !rejectReason.trim()
                        }
                        onClick={() =>
                          updateStatus(selectedVisitor.id, "REJECTED", {
                            notes: rejectReason,
                          })
                        }
                        className="h-10 flex-1 gap-1 bg-status-rejected-fg text-primary-foreground hover:bg-status-rejected-fg/90"
                      >
                        <XCircle className="h-4 w-4" /> Confirm reject
                      </Button>
                      <Button
                        variant="outline"
                        disabled={updatingVisitorId === selectedVisitor.id}
                        onClick={() => {
                          setShowRejectReason(false);
                          setRejectReason("");
                        }}
                        className="h-10 flex-1 gap-1 border-border text-muted-foreground hover:bg-accent"
                      >
                        Cancel
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
                    {selectedVisitor.floor &&
                      selectedVisitor.status !== "PENDING" &&
                      selectedVisitor.status !== "REJECTED" && (
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Floor
                          </p>
                          <p className="text-sm text-foreground">
                            {selectedVisitor.floor}
                          </p>
                        </div>
                      )}
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Created at
                      </p>
                      <p className="text-sm tabular-nums text-foreground">
                        {selectedVisitor.created_at
                          ? format(
                              new Date(selectedVisitor.created_at),
                              "MMM d, yyyy 'at' hh:mm a",
                            )
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Updated at
                      </p>
                      <p className="text-sm tabular-nums text-foreground">
                        {selectedVisitor.updated_at
                          ? format(
                              new Date(selectedVisitor.updated_at),
                              "MMM d, yyyy 'at' hh:mm a",
                            )
                          : "—"}
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
                          onClick={() => setShowRejectReason(true)}
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

      {/* Audit detail slide-over */}
      <AnimatePresence>
        {selectedAudit && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-foreground"
              onClick={() => setSelectedAudit(null)}
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
                  Audit entry
                </h2>
                <button
                  type="button"
                  onClick={() => setSelectedAudit(null)}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Close
                </button>
              </div>
              <div className="space-y-4 p-6 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Time</p>
                  <p className="text-sm tabular-nums text-foreground">
                    {format(
                      new Date(selectedAudit.timestamp),
                      "MMM d, yyyy 'at' hh:mm:ss a",
                    )}
                  </p>
                </div>
                {/* Intentionally omitting user_id from the UI to avoid exposing sensitive identifiers */}
                <div>
                  <p className="text-xs text-muted-foreground">Action</p>
                  <p className="text-sm font-medium text-foreground">
                    {selectedAudit.action}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Details</p>
                  <pre className="mt-1 max-h-64 overflow-auto rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                    {selectedAudit.details
                      ? (() => {
                          try {
                            return JSON.stringify(
                              JSON.parse(selectedAudit.details),
                              null,
                              2,
                            );
                          } catch {
                            return selectedAudit.details;
                          }
                        })()
                      : "—"}
                  </pre>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
