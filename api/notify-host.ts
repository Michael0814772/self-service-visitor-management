import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { hostEmail, visitorName, visitorEmail, company, purpose } = req.body as {
    hostEmail?: string;
    visitorName?: string;
    visitorEmail?: string;
    company?: string;
    purpose?: string;
  };

  if (!hostEmail || !visitorName) {
    return res.status(400).json({ error: "hostEmail and visitorName required" });
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: "Resend not configured" });
  }

  try {
    const { error } = await resend.emails.send({
      from,
      to: hostEmail,
      subject: `Visit request from ${visitorName}`,
      html: [
        `<p><strong>${visitorName}</strong> has requested to visit.</p>`,
        purpose ? `<p><strong>Purpose:</strong> ${purpose}</p>` : "",
        company ? `<p><strong>Company:</strong> ${company}</p>` : "",
        visitorEmail ? `<p><strong>Visitor email:</strong> ${visitorEmail}</p>` : "",
        `<p>Please review and approve or reject the request in the admin dashboard.</p>`,
      ].join(""),
    });

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to send email",
    });
  }
}
