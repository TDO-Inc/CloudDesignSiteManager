/**
 * SendGrid email client + a single `sendEmail()` helper that ALSO writes a row to
 * email_delivery_log. All app code should go through this helper so we have a
 * single place to find delivery failures during debugging.
 *
 * In dev (no SENDGRID_API_KEY) emails are logged to the console instead of sent.
 */

import sgMail from "@sendgrid/mail";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { emailDeliveryLog } from "@/lib/db/schema";

const FROM_EMAIL = process.env.EMAIL_FROM ?? "webadmin@tdo4endo.com";
const FROM_NAME = process.env.EMAIL_FROM_NAME ?? "TDO Software";
const API_KEY = process.env.SENDGRID_API_KEY ?? "";

if (API_KEY) {
  sgMail.setApiKey(API_KEY);
}

export interface SendEmailInput {
  to: string;
  subject: string;
  template: string; // logical template name for the delivery log
  html: string;
  text?: string;
  projectId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface SendEmailResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const from = { email: FROM_EMAIL, name: FROM_NAME };

  // Always log the attempt first, then update with the result. This way a
  // crash mid-send still leaves us with a record.
  const [logRow] = await db
    .insert(emailDeliveryLog)
    .output()
    .values({
      toEmail: input.to,
      fromEmail: FROM_EMAIL,
      subject: input.subject,
      template: input.template,
      projectId: input.projectId,
      userId: input.userId,
      status: "queued",
      metadata: input.metadata ?? {},
    });
  if (!logRow) return { ok: false, error: "email_log_insert_failed" };

  if (!API_KEY) {
    // Dev fallback — print and "succeed".
    console.log("──── EMAIL (DEV — no SENDGRID_API_KEY) ────");
    console.log(`From:    ${FROM_NAME} <${FROM_EMAIL}>`);
    console.log(`To:      ${input.to}`);
    console.log(`Subject: ${input.subject}`);
    console.log(`Template: ${input.template}`);
    console.log(input.text ?? "(html-only body)");
    console.log("────────────────────────────────────────────");
    await db
      .update(emailDeliveryLog)
      .set({ status: "sent", providerMessageId: `dev-${logRow.id}` })
      .where(eq(emailDeliveryLog.id, logRow.id));
    return { ok: true, messageId: `dev-${logRow.id}` };
  }

  try {
    const [response] = await sgMail.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    const messageId = response.headers["x-message-id"] as string | undefined;
    await db
      .update(emailDeliveryLog)
      .set({ status: "sent", providerMessageId: messageId ?? null })
      .where(eq(emailDeliveryLog.id, logRow.id));
    return { ok: true, messageId };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db
      .update(emailDeliveryLog)
      .set({ status: "failed", error: message })
      .where(eq(emailDeliveryLog.id, logRow.id));
    return { ok: false, error: message };
  }
}
