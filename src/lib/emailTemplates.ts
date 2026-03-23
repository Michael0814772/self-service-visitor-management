/**
 * Email message bodies built in code. Sent to EmailJS with a minimal template that accepts:
 *   Hello {{name}},
 *   {{message}}
 *   Visitor Management System
 */

const CREATION_MESSAGE = `A visitor has submitted a request that requires your approval.

Visitor Information:
Name: {{visitor_name}}
Purpose: {{purpose}}
Host: {{host_name}}
Visit Date: {{visit_date}}

Action required:
Please log in to review this request.

Login here:
{{admin_link}}`;

function render(
  template: string,
  data: Record<string, string | null | undefined>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const v = data[key];
    return v != null ? String(v) : "";
  });
}

export function getCreationMessage(data: {
  visitor_name: string;
  purpose: string;
  host_name: string;
  visit_date: string;
  admin_link: string;
}): string {
  return render(CREATION_MESSAGE, data);
}

export function getApprovalMessage(data: {
  purpose: string;
  host_name: string;
  appointment_time: string | null | undefined;
  duration_minutes?: number;
  floor?: string | null;
  qr_code_url: string;
  badge_url: string;
}): string {
  const appointmentDate =
    data.appointment_time != null && data.appointment_time !== ""
      ? (() => {
          try {
            return new Date(data.appointment_time).toLocaleString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            });
          } catch {
            return data.appointment_time;
          }
        })()
      : "—";

  const floorLabel =
    data.floor != null && String(data.floor).trim() !== ""
      ? String(data.floor).trim()
      : "—";

  const durationLabel =
    typeof data.duration_minutes === "number"
      ? data.duration_minutes === 60
        ? "1 hour"
        : data.duration_minutes % 60 === 0
        ? `${data.duration_minutes / 60} hours`
        : `${data.duration_minutes} minutes`
      : "—";
  return `Your visit request has been approved.<br><br>

<b>Visit details:</b><br>
Purpose: ${data.purpose}<br>
Host: ${data.host_name}<br>
Floor: ${floorLabel}<br>
Appointment Time: ${appointmentDate}<br>
Duration: ${durationLabel}<br><br>

<b>Your QR code:</b><br>
<img src="${data.qr_code_url}" width="200" height="200"/><br><br>

You can print your visitor badge here:<br>
<a href="${data.badge_url}">${data.badge_url}</a><br><br>

Please bring your QR code for entry verification.
`;
}

export function getRejectionMessage(rejectionReason: string): string {
  return `Your visit request was not approved.<br><br>

Reason:<br>
${rejectionReason}<br><br>

Contact the office if needed.
`;
}
