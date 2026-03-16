import { supabase } from "./supabase";

type AuditAction =
  | "VISITOR_CHECKIN_REQUEST"
  | "VISITOR_STATUS_UPDATE"
  | "QR_CHECKIN"
  | "QR_CHECKOUT"
  | "ADMIN_LOGIN"
  | "ADMIN_LOGOUT"
  | "ADMIN_CREATE";

export async function logAudit(entry: {
  user_id: string | null;
  action: AuditAction | string;
  details?: Record<string, unknown>;
}) {
  if (!supabase) return;
  try {
    await supabase.from("audit_log").insert({
      user_id: entry.user_id,
      action: entry.action,
      details: entry.details ? JSON.stringify(entry.details) : null,
    });
  } catch {
    // Audit logging is best-effort; ignore failures
  }
}

