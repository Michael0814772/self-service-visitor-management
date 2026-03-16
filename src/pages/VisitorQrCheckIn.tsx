import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { CheckCircle, XCircle, Info } from "lucide-react";
import { supabase } from "@/lib/supabase";

type State = "loading" | "checked_in" | "checked_out" | "error";

const VisitorQrCheckIn = () => {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<State>("loading");
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!supabase || !id) {
        setState("error");
        return;
      }
      try {
        const { data, error } = await supabase
          .from("visitors")
          .select("status")
          .eq("id", id)
          .maybeSingle();
        if (error || !data) {
          setReason("Invalid or unknown QR code.");
          setState("error");
          return;
        }
        const now = new Date().toISOString();
        if (data.status === "APPROVED") {
          const { error: updateError } = await supabase
            .from("visitors")
            .update({
              status: "CHECKED_IN",
              checked_in_at: now,
            })
            .eq("id", id)
            .eq("status", "APPROVED");
          if (updateError) {
            setReason("We could not update your visit status.");
            setState("error");
          } else {
            setState("checked_in");
          }
          return;
        }
        if (data.status === "CHECKED_IN") {
          const { error: updateError } = await supabase
            .from("visitors")
            .update({
              status: "CHECKED_OUT",
              checked_out_at: now,
            })
            .eq("id", id)
            .eq("status", "CHECKED_IN");
          if (updateError) {
            setReason("We could not update your visit status.");
            setState("error");
          } else {
            setState("checked_out");
          }
          return;
        }
        if (data.status === "PENDING") {
          setReason("Your visit has not been approved yet.");
        } else if (data.status === "REJECTED") {
          setReason("This visit request was rejected.");
        } else if (data.status === "CHECKED_OUT") {
          setReason("You are already checked out.");
        } else {
          setReason("This visit cannot be checked in with this code.");
        }
        setState("error");
      } catch {
        setReason("Unexpected error while contacting the server.");
        setState("error");
      }
    };
    void run();
  }, [id]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-8 text-center">
        {state === "loading" && (
          <>
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">
              Checking you in…
            </p>
          </>
        )}
        {state === "checked_in" && (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-status-approved-bg">
              <CheckCircle className="h-7 w-7 text-status-approved-fg" />
            </div>
            <p className="text-sm font-medium text-foreground">
              You have been checked in.
            </p>
          </>
        )}
        {state === "checked_out" && (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-status-approved-bg">
              <CheckCircle className="h-7 w-7 text-status-approved-fg" />
            </div>
            <p className="text-sm font-medium text-foreground">
              You have been checked out.
            </p>
          </>
        )}
        {state === "error" && (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-status-rejected-bg">
              <XCircle className="h-7 w-7 text-status-rejected-fg" />
            </div>
            <p className="text-sm font-medium text-foreground">
              We could not check you in.
            </p>
            {reason && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Info className="h-3 w-3" />
                <span>{reason}</span>
              </p>
            )}
            {!reason && (
              <p className="text-xs text-muted-foreground">
                Please contact the front desk.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default VisitorQrCheckIn;

