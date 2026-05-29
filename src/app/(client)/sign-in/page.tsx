import { UnifiedSignIn } from "@/components/auth/unified-sign-in";
import { TdoLogo } from "@/components/brand/tdo-logo";

interface SignInPageProps {
  searchParams: Promise<{ role?: string; error?: string; sent?: string; returnTo?: string }>;
}

export const metadata = {
  title: "Sign in · TDO Website Design Portal",
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const defaultRole = params.role === "staff" ? "staff" : "client";

  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_minmax(440px,560px)]">
      {/* Brand panel — TDOS-inspired purple/indigo gradient */}
      <aside className="relative hidden overflow-hidden bg-[#3D1872] bg-gradient-to-br from-[#5028A3] via-[#3D1872] to-[#2A1257] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        {/* Subtle radial highlights */}
        <div
          className="pointer-events-none absolute -left-40 -top-40 h-[26rem] w-[26rem] rounded-full bg-[#7B47CB]/30 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-44 -right-24 h-[32rem] w-[32rem] rounded-full bg-[#3D1F90]/40 blur-3xl"
          aria-hidden
        />

        {/* Top — TDO logo lockup */}
        <div className="relative">
          <TdoLogo variant="mono-light" className="h-10 w-auto" />
        </div>

        {/* Center — Portal subtitle + tagline */}
        <div className="relative max-w-md text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/70">
            Website Design Portal
          </p>
          <p className="mt-6 text-2xl font-semibold leading-snug text-white">
            Where your new website comes together.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-white/65">
            Upload photos, share content, and follow your project&apos;s
            progress in one place — built for endodontic practices, used by
            the TDO team.
          </p>
        </div>

        {/* Bottom — copyright + decorative dots */}
        <div className="relative flex items-end justify-between">
          <span className="text-xs text-white/40">© TDO Software</span>
          <DecorativeDots />
        </div>
      </aside>

      {/* Form panel */}
      <section className="flex flex-col justify-center bg-white px-8 py-12 sm:px-12 lg:px-16">
        {/* Mobile lockup */}
        <div className="mb-10 flex flex-col gap-2 lg:hidden">
          <TdoLogo className="h-8 w-auto" />
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Website Design Portal
          </p>
        </div>

        <UnifiedSignIn
          defaultRole={defaultRole}
          devMode={process.env.NODE_ENV !== "production" || process.env.ALLOW_ADMIN_BYPASS === "true"}
        />
      </section>
    </main>
  );
}

function DecorativeDots() {
  const rows = 5;
  const cols = 5;
  const spacing = 14;
  const radius = 2.5;
  return (
    <svg
      width={cols * spacing}
      height={rows * spacing}
      viewBox={`0 0 ${cols * spacing} ${rows * spacing}`}
      className="text-white/20"
      aria-hidden
    >
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => (
          <circle
            key={`${r}-${c}`}
            cx={c * spacing + radius + 1}
            cy={r * spacing + radius + 1}
            r={radius}
            fill="currentColor"
          />
        )),
      )}
    </svg>
  );
}
