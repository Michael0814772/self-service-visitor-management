type Status = "PENDING" | "APPROVED" | "REJECTED" | "VISITED";

const styles: Record<Status, string> = {
  PENDING: "bg-status-pending-bg text-status-pending-fg border-status-pending-border",
  APPROVED: "bg-status-approved-bg text-status-approved-fg border-status-approved-border",
  REJECTED: "bg-status-rejected-bg text-status-rejected-fg border-status-rejected-border",
  VISITED: "bg-status-visited-bg text-status-visited-fg border-status-visited-border",
};

export const StatusBadge = ({ status }: { status: Status }) => (
  <span
    className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles[status]}`}
  >
    {status}
  </span>
);
