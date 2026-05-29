import { emailLayout, button, escapeHtml } from "./layout";

export interface MagicLinkEmailProps {
  recipientName: string;
  signInUrl: string;
  expiresInMinutes: number;
  projectName?: string;
}

export function magicLinkEmail(props: MagicLinkEmailProps) {
  const { recipientName, signInUrl, expiresInMinutes, projectName } = props;
  const subject = projectName
    ? `Sign in to your ${projectName} project portal`
    : "Sign in to the TDO Software Client Portal";

  const html = emailLayout({
    preheader: `Your one-tap sign-in link — expires in ${expiresInMinutes} minutes.`,
    bodyHtml: `
      <h2 style="margin:0 0 14px 0;font-size:20px;">Hi ${escapeHtml(recipientName)},</h2>
      <p style="margin:0 0 18px 0;">Click the button below to sign in to your TDO website project portal. The link will expire in <strong>${expiresInMinutes} minutes</strong>.</p>
      <div style="margin:24px 0;">${button(signInUrl, "Sign in")}</div>
      <p style="margin:0 0 8px 0;color:#5d6e7a;font-size:13px;">Or copy and paste this URL into your browser:</p>
      <p style="margin:0 0 18px 0;word-break:break-all;font-size:13px;color:#1A9E75;">${escapeHtml(signInUrl)}</p>
      <p style="margin:0;color:#5d6e7a;font-size:13px;">Didn't request this? You can safely ignore the email — no one can sign in without this link.</p>
    `,
  });

  const text = `Hi ${recipientName},\n\nSign in to your TDO website project portal. The link expires in ${expiresInMinutes} minutes:\n\n${signInUrl}\n\nDidn't request this? You can ignore the email.`;

  return { subject, html, text };
}
