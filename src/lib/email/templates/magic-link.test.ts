import { describe, it, expect } from "vitest";
import { magicLinkEmail } from "./magic-link";

const baseProps = {
  recipientName: "Dr. Roberts",
  signInUrl: "https://portal.tdo4endo.com/auth/verify?token=abc123",
  expiresInMinutes: 15,
};

describe("magicLinkEmail", () => {
  it("includes a generic subject when no project name is given", () => {
    const { subject } = magicLinkEmail(baseProps);
    expect(subject).toBe("Sign in to the TDO Software Client Portal");
  });

  it("personalizes the subject with the project name", () => {
    const { subject } = magicLinkEmail({ ...baseProps, projectName: "Riverside Endo" });
    expect(subject).toBe("Sign in to your Riverside Endo project portal");
  });

  it("embeds the sign-in URL and expiry in both html and text bodies", () => {
    const { html, text } = magicLinkEmail(baseProps);
    expect(html).toContain(baseProps.signInUrl);
    expect(html).toContain("15 minutes");
    expect(text).toContain(baseProps.signInUrl);
    expect(text).toContain("15 minutes");
  });

  it("escapes HTML in the recipient name to prevent injection", () => {
    const { html } = magicLinkEmail({ ...baseProps, recipientName: "<script>x</script>" });
    expect(html).not.toContain("<script>x</script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
