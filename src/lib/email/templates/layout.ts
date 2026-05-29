/**
 * Shared email layout — TDO-branded shell rendered around each template body.
 * Plain inline-styled HTML so it survives every email client we'll ever see.
 */

export interface LayoutOptions {
  preheader?: string;
  bodyHtml: string;
}

export function emailLayout({ preheader, bodyHtml }: LayoutOptions): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>TDO Software Client Portal</title>
  </head>
  <body style="margin:0;padding:0;background:#f5f7f9;font-family:Arial,Helvetica,sans-serif;color:#0F2B3C;">
    ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>` : ""}
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f5f7f9;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e6ebf0;">
            <tr>
              <td style="background:#0F2B3C;padding:20px 24px;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="vertical-align:middle;">
                      <div style="display:inline-block;width:32px;height:32px;background:#1A9E75;border-radius:6px;text-align:center;line-height:32px;color:#fff;font-weight:700;font-size:18px;vertical-align:middle;">T</div>
                      <span style="color:#ffffff;font-size:16px;font-weight:600;margin-left:10px;vertical-align:middle;">TDO Software Client Portal</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 28px;font-size:15px;line-height:1.55;color:#0F2B3C;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px;background:#f9fafb;border-top:1px solid #e6ebf0;font-size:12px;color:#5d6e7a;">
                You're receiving this email because your endodontic practice is working with TDO Software on a website project. If this isn't you, please reply and let us know.
              </td>
            </tr>
          </table>
          <div style="font-size:11px;color:#9aa6ae;margin-top:14px;">© TDO Software · webadmin@tdo4endo.com</div>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function button(href: string, label: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:#1A9E75;border-radius:8px;">
    <a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 22px;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;">${escapeHtml(label)}</a>
  </td></tr></table>`;
}
