import type { Metadata } from "next";

// Metropolis weights used across the app:
//   300 — body / small text         (light)
//   400 — paragraph default        (regular)
//   500 — labels, captions          (medium)
//   600 — h3, buttons, emphasis     (semibold)
//   700 — h2, h1 default            (bold)
//   800 — display headlines         (extrabold)
import "@fontsource/metropolis/300.css";
import "@fontsource/metropolis/400.css";
import "@fontsource/metropolis/500.css";
import "@fontsource/metropolis/600.css";
import "@fontsource/metropolis/700.css";
import "@fontsource/metropolis/800.css";

import "./globals.css";

export const metadata: Metadata = {
  title: "TDO Software Client Portal",
  description:
    "Branded client portal for collecting website content — copy, photos, and brand assets — for TDO Software website design projects.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground">
        {children}
      </body>
    </html>
  );
}
