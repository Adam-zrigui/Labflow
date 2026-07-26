import { prisma } from "./prisma";
import { sendEmail } from "./email";
import { writeAuditLog } from "./audit";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function sendFlagNotifications(
  tenantId: string,
  sampleId: string,
  templateName: string
): Promise<void> {
  let recipients: { email: string }[];
  try {
    recipients = await prisma.user.findMany({
      where: {
        tenantId,
        deletedAt: null,
        notifyOnFlag: true,
        role: { in: ["Admin", "SeniorScientist"] },
      },
      select: { email: true },
    });
  } catch (err) {
    console.error("[notify] Failed to query recipients:", err);
    await writeAuditLog("Sample", sampleId, "system", "flag_notification_failed", null, {
      reason: "Failed to query recipients",
    });
    return;
  }

  if (recipients.length === 0) return;

  const sampleUrl = `${APP_URL}/samples/${sampleId}`;
  const sampleShortId = "SMP-" + sampleId.slice(0, 4).toUpperCase();

  const subject = `Sample ${sampleShortId} flagged for review`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 0;">
      <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 16px;">Sample flagged for review</h2>
      <p style="font-size: 14px; color: #555; margin-bottom: 8px;">
        <strong>${sampleShortId}</strong> in workflow <strong>${templateName}</strong> has been flagged and requires review.
      </p>
      <p style="font-size: 14px; color: #555; margin-bottom: 24px;">
        A sample has failed a quality check and needs attention before it can proceed.
      </p>
      <a href="${sampleUrl}" style="display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 500;">
        Review sample
      </a>
      <p style="font-size: 12px; color: #999; margin-top: 32px;">
        You received this because you opted in to flag notifications in your LabFlow settings.
      </p>
    </div>
  `;

  const emails = recipients.map((r) => r.email);
  const sent = await sendEmail({ to: emails, subject, html });

  await writeAuditLog(
    "Sample",
    sampleId,
    "system",
    sent ? "flag_notification_sent" : "flag_notification_failed",
    null,
    { recipients: emails.length, templateName }
  );
}
