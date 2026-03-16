import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

type State = "loading" | "checked_in" | "checked_out" | "error";

const VisitorQrCheckIn = () => {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<State>("loading");

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
            setState("error");
          } else {
            setState("checked_out");
          }
          return;
        }
        setState("error");
      } catch {
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
            <p className="text-xs text-muted-foreground">
              Please contact the front desk.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default VisitorQrCheckIn;

