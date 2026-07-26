import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (!resendApiKey) return null;
  if (!resendClient) {
    resendClient = new Resend(resendApiKey);
  }
  return resendClient;
}

export interface SendEmailOptions {
  to: string[];
  subject: string;
  html: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const client = getResendClient();
  if (!client) {
    console.warn("[email] RESEND_API_KEY not configured — skipping email send");
    return false;
  }

  try {
    await client.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "LabFlow <notifications@labflow.app>",
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    return true;
  } catch (err) {
    console.error("[email] Failed to send email:", err);
    return false;
  }
}
