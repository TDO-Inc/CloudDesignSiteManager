import { emailLayout, button, escapeHtml } from "./layout";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/* ------------------------------------------------------------------ */
/* Client invite                                                       */
/* ------------------------------------------------------------------ */

export interface ClientInviteEmailProps {
  recipientName: string;
  projectName: string;
  signInUrl: string;
  pmName: string;
}

export function clientInviteEmail(p: ClientInviteEmailProps) {
  return {
    subject: `You're invited — ${p.projectName} portal access`,
    html: emailLayout({
      preheader: `Your TDO Client Portal is ready. Click to get started on ${p.projectName}.`,
      bodyHtml: `
        <h2 style="margin:0 0 14px 0;font-size:20px;">Hi ${escapeHtml(p.recipientName)},</h2>
        <p style="margin:0 0 14px 0;">You've been invited to the <strong>TDO Software Client Portal</strong> for your website project: <strong>${escapeHtml(p.projectName)}</strong>.</p>
        <p style="margin:0 0 14px 0;">The portal is where you'll submit your website content — things like your practice overview, team bios, services, and photos. Your project manager <strong>${escapeHtml(p.pmName)}</strong> will be guiding you through the process.</p>
        <p style="margin:0 0 18px 0;">Click the button below to sign in. The link expires in <strong>24 hours</strong> — after that, just return to the portal and request a new link.</p>
        <div style="margin:24px 0;">${button(p.signInUrl, "Open my portal")}</div>
        <p style="margin:0 0 8px 0;color:#5d6e7a;font-size:13px;">Or copy and paste this URL into your browser:</p>
        <p style="margin:0 0 18px 0;word-break:break-all;font-size:13px;color:#1A9E75;">${escapeHtml(p.signInUrl)}</p>
        <p style="margin:0;color:#5d6e7a;font-size:13px;">Questions? Reply to this email or use the Messages section inside the portal.</p>
      `,
    }),
    text: `Hi ${p.recipientName},\n\nYou've been invited to the TDO Software Client Portal for ${p.projectName}.\n\nYour project manager ${p.pmName} will guide you through submitting your website content.\n\nSign in here (link expires in 24 hours):\n${p.signInUrl}\n\nQuestions? Reply to this email.`,
  };
}

/* ------------------------------------------------------------------ */
/* New message notification                                           */
/* ------------------------------------------------------------------ */

export interface NewMessageEmailProps {
  recipientName: string;
  senderName: string;
  projectName: string;
  messagePreview: string;
  portalUrl: string;
}

export function newMessageEmail(p: NewMessageEmailProps) {
  return {
    subject: `New message from ${p.senderName} — ${p.projectName}`,
    html: emailLayout({
      preheader: `${p.senderName} sent you a message about ${p.projectName}.`,
      bodyHtml: `
        <h2 style="margin:0 0 14px 0;font-size:20px;">Hi ${escapeHtml(p.recipientName)},</h2>
        <p style="margin:0 0 14px 0;"><strong>${escapeHtml(p.senderName)}</strong> sent you a message about <strong>${escapeHtml(p.projectName)}</strong>:</p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0;border-collapse:collapse;width:100%;background:#f9fafb;border-radius:8px;border-left:4px solid #1A9E75;">
          <tr><td style="padding:14px 16px;font-size:14px;color:#0F2B3C;font-style:italic;">${escapeHtml(p.messagePreview)}${p.messagePreview.length >= 200 ? "…" : ""}</td></tr>
        </table>
        <div style="margin:24px 0;">${button(p.portalUrl, "Reply in portal")}</div>
      `,
    }),
    text: `Hi ${p.recipientName},\n\n${p.senderName} sent you a message about ${p.projectName}:\n\n"${p.messagePreview}${p.messagePreview.length >= 200 ? "…" : ""}"\n\nReply here: ${p.portalUrl}`,
  };
}

/* ------------------------------------------------------------------ */
/* Revision requested                                                  */
/* ------------------------------------------------------------------ */

export interface RevisionRequestedEmailProps {
  recipientName: string;
  projectName: string;
  sectionLabel: string;
  revisionNote: string;
  portalUrl: string;
}

export function revisionRequestedEmail(p: RevisionRequestedEmailProps) {
  return {
    subject: `Revision needed — ${p.sectionLabel} (${p.projectName})`,
    html: emailLayout({
      preheader: `Your TDO team has requested a revision on ${p.sectionLabel}.`,
      bodyHtml: `
        <h2 style="margin:0 0 14px 0;font-size:20px;">Hi ${escapeHtml(p.recipientName)},</h2>
        <p style="margin:0 0 14px 0;">Your TDO team has reviewed your <strong>${escapeHtml(p.sectionLabel)}</strong> content for <strong>${escapeHtml(p.projectName)}</strong> and left the following note:</p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0;border-collapse:collapse;width:100%;background:#fffbeb;border-radius:8px;border-left:4px solid #f59e0b;">
          <tr><td style="padding:14px 16px;font-size:14px;color:#0F2B3C;">${escapeHtml(p.revisionNote)}</td></tr>
        </table>
        <p style="margin:0 0 18px 0;color:#5d6e7a;">Please update your content and re-submit when you're ready. You can make changes at any time.</p>
        <div style="margin:24px 0;">${button(p.portalUrl, "Update my content")}</div>
      `,
    }),
    text: `Hi ${p.recipientName},\n\nYour TDO team has requested a revision on the ${p.sectionLabel} section of ${p.projectName}.\n\nNote from your team:\n${p.revisionNote}\n\nPlease update your content and re-submit:\n${p.portalUrl}`,
  };
}

export interface FileUploadedEmailProps {
  recipientName: string;
  uploaderName: string;
  projectName: string;
  filename: string;
  category: string;
  projectUrl: string;
}

export function fileUploadedEmail(p: FileUploadedEmailProps) {
  return {
    subject: `New file uploaded — ${p.projectName}`,
    html: emailLayout({
      preheader: `${p.uploaderName} uploaded "${p.filename}".`,
      bodyHtml: `
        <h2 style="margin:0 0 14px 0;font-size:20px;">Hi ${escapeHtml(p.recipientName)},</h2>
        <p style="margin:0 0 14px 0;"><strong>${escapeHtml(p.uploaderName)}</strong> uploaded a new file to <strong>${escapeHtml(p.projectName)}</strong>.</p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0;border-collapse:collapse;width:100%;background:#f9fafb;border-radius:8px;">
          <tr><td style="padding:14px 16px;"><div style="font-size:12px;color:#5d6e7a;text-transform:uppercase;letter-spacing:0.04em;">${escapeHtml(p.category)}</div><div style="font-size:15px;font-weight:600;margin-top:4px;">${escapeHtml(p.filename)}</div></td></tr>
        </table>
        <div style="margin:24px 0;">${button(p.projectUrl, "Open project")}</div>
      `,
    }),
    text: `${p.uploaderName} uploaded "${p.filename}" (${p.category}) to ${p.projectName}.\n\n${p.projectUrl}`,
  };
}

export interface ContentSubmittedEmailProps {
  recipientName: string;
  submitterName: string;
  projectName: string;
  sectionLabel: string;
  projectUrl: string;
}

export function contentSubmittedEmail(p: ContentSubmittedEmailProps) {
  return {
    subject: `Content submitted — ${p.sectionLabel} (${p.projectName})`,
    html: emailLayout({
      preheader: `${p.submitterName} submitted the ${p.sectionLabel} content brief.`,
      bodyHtml: `
        <h2 style="margin:0 0 14px 0;font-size:20px;">Hi ${escapeHtml(p.recipientName)},</h2>
        <p style="margin:0 0 14px 0;"><strong>${escapeHtml(p.submitterName)}</strong> just submitted the <strong>${escapeHtml(p.sectionLabel)}</strong> content brief for <strong>${escapeHtml(p.projectName)}</strong>.</p>
        <div style="margin:24px 0;">${button(p.projectUrl, "Review submission")}</div>
      `,
    }),
    text: `${p.submitterName} submitted ${p.sectionLabel} for ${p.projectName}.\n\n${p.projectUrl}`,
  };
}

export interface StatusChangedEmailProps {
  recipientName: string;
  projectName: string;
  oldMilestone?: string;
  newMilestone: string;
  triggeredByName: string;
  projectUrl: string;
}

export function statusChangedEmail(p: StatusChangedEmailProps) {
  return {
    subject: `Status updated — ${p.projectName} → ${p.newMilestone}`,
    html: emailLayout({
      preheader: `${p.projectName} moved to ${p.newMilestone}.`,
      bodyHtml: `
        <h2 style="margin:0 0 14px 0;font-size:20px;">Hi ${escapeHtml(p.recipientName)},</h2>
        <p style="margin:0 0 14px 0;"><strong>${escapeHtml(p.projectName)}</strong> moved to <strong>${escapeHtml(p.newMilestone)}</strong>${p.oldMilestone ? ` from <span style=\"color:#5d6e7a;\">${escapeHtml(p.oldMilestone)}</span>` : ""}.</p>
        <p style="margin:0 0 18px 0;color:#5d6e7a;font-size:13px;">Updated by ${escapeHtml(p.triggeredByName)}.</p>
        <div style="margin:24px 0;">${button(p.projectUrl, "Open project")}</div>
      `,
    }),
    text: `${p.projectName} moved to ${p.newMilestone}${p.oldMilestone ? ` from ${p.oldMilestone}` : ""}.\n\n${p.projectUrl}`,
  };
}

export function projectUrlFor(projectId: string, audience: "client" | "staff" = "client") {
  return audience === "staff"
    ? `${APP_URL}/staff/projects/${projectId}`
    : `${APP_URL}/dashboard`;
}
