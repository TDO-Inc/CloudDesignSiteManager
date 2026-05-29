/**
 * Resend email client + a single `sendEmail()` helper that ALSO writes a row to
 * email_delivery_log. All app code should go through this helper so we have a
 * single place to find delivery failures during debugging.
 *
 * In dev (no RESEND_API_KEY) emails are logged to the console instead of sent.
 */

import { Resend } from "resend";
import { db } from "@/lib/db";
import { emailDeliveryLog } from "@/lib/db/schema";

const FROM_EMAIL = process.env.EMAIL_FROM ?? "webadmin@tdo4endo.com";
const FROM_NAME = process.env.EMAIL_FROM_NAME ?? "TDO Software";
const API_KEY = process.env.RESEND_API_KEY ?? "";

let resend: Resend | null = null;
function getClient() {
  if (!API_KEY) return null;
  if (!resend) resend = new Resend(API_KEY);
  return resend;
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
  const client = getClient();
  const from = `${FROM_NAME} <${FROM_EMAIL}>`;

  // Always log the attempt first, then update with the result. This way a
  // crash mid-send still leaves us with a record.
  const [logRow] = await db
    .insert(emailDeliveryLog)
    .values({
      toEmail: input.to,
      fromEmail: FROM_EMAIL,
      subject: input.subject,
      template: input.template,
      projectId: input.projectId,
      userId: input.userId,
      status: "queued",
      metadata: input.metadata ?? {},
    })
    .returning();

  if (!client) {
    // Dev fallback — print and "succeed".
    console.log("──── EMAIL (DEV — no RESEND_API_KEY) ────");
    console.log(`From:    ${from}`);
    console.log(`To:      ${input.to}`);
    console.log(`Subject: ${input.subject}`);
    console.log(`Template: ${input.template}`);
    console.log(input.text ?? "(html-only body)");
    console.log("─────────────────────────────────────────");
    await db
      .update(emailDeliveryLog)
      .set({ status: "sent", providerMessageId: `dev-${logRow.id}` })
      .where(eqId(logRow.id));
    return { ok: true, messageId: `dev-${logRow.id}` };
  }

  try {
    const result = await client.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    if (result.error) {
      await db
        .update(emailDeliveryLog)
        .set({ status: "failed", error: result.error.message })
        .where(eqId(logRow.id));
      return { ok: false, error: result.error.message };
    }
    await db
      .update(emailDeliveryLog)
      .set({ status: "sent", providerMessageId: result.data?.id ?? null })
      .where(eqId(logRow.id));
    return { ok: true, messageId: result.data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db
      .update(emailDeliveryLog)
      .set({ status: "failed", error: message })
      .where(eqId(logRow.id));
    return { ok: false, error: message };
  }
}

// Small local helper so we don't have to import { eq } at the top.
import { eq } from "drizzle-orm";
function eqId(id: string) {
  return eq(emailDeliveryLog.id, id);
}
