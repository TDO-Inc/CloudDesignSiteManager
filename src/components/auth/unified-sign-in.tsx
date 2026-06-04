"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { IconMail, IconShieldLock, IconBolt, IconLock } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type Role = "client" | "staff";

interface UnifiedSignInProps {
  defaultRole?: Role;
  /** When true, show the admin (dev-only) bypass on the staff tab. */
  devMode?: boolean;
}

const errorMessages: Record<string, string> = {
  missing_token: "That link was incomplete. Try again or request a new one.",
  invalid_token: "That link isn't valid. It may have already been used.",
  expired: "That link has expired. Request a new one below.",
  already_used: "That link was already used. Request a new one below.",
  internal: "Something went wrong. Please try again in a moment.",
  sign_in_failed: "Sign-in failed. Try again, and contact IT if it keeps happening.",
  not_staff: "That account is registered as a client, not staff.",
  rate_limited: "A link was just sent. Wait a minute before trying again.",
};

export function UnifiedSignIn({ defaultRole = "client", devMode = false }: UnifiedSignInProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<Role>(defaultRole);

  const error = searchParams.get("error");
  const sent = searchParams.get("sent");
  const returnTo = searchParams.get("returnTo") ?? "/staff";

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  // Clients can sign in with a password or request a magic link. Password is
  // the default; "link" doubles as the first-time / forgot-password path.
  const [clientMode, setClientMode] = useState<"password" | "link">("password");
  const [clientPassword, setClientPassword] = useState("");
  const [clientPwSubmitting, setClientPwSubmitting] = useState(false);
  const [clientPwError, setClientPwError] = useState<string | null>(null);

  async function onClientPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setClientPwError(null);
    setClientPwSubmitting(true);
    try {
      const res = await fetch("/api/auth/client/password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password: clientPassword }),
      });
      if (!res.ok) {
        setClientPwError(
          res.status === 401
            ? "That email and password didn't match. New here, or no password set yet? Use a sign-in link."
            : "Sign-in failed. Try again.",
        );
        return;
      }
      const { redirectTo } = (await res.json()) as { redirectTo: string };
      router.push(redirectTo as never);
    } finally {
      setClientPwSubmitting(false);
    }
  }

  // Staff password sign-in state
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffSubmitting, setStaffSubmitting] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);

  async function onStaffPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStaffError(null);
    setStaffSubmitting(true);
    try {
      const res = await fetch("/api/auth/staff/password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: staffEmail, password: staffPassword }),
      });
      if (!res.ok) {
        if (res.status === 401) {
          setStaffError("That email and password didn't match.");
        } else {
          setStaffError("Sign-in failed. Try again.");
        }
        return;
      }
      const { redirectTo } = (await res.json()) as { redirectTo: string };
      router.push(redirectTo as never);
    } finally {
      setStaffSubmitting(false);
    }
  }

  // Admin (dev) bypass state — no password required.
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminSubmitting, setAdminSubmitting] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  // Client dev bypass state.
  const [clientDevSubmitting, setClientDevSubmitting] = useState(false);

  // Whether to expose the legacy SSO button (default hidden, user clicks "Use intranet SSO instead").
  const [showSso, setShowSso] = useState(false);

  async function onAdminSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAdminError(null);
    setAdminSubmitting(true);
    try {
      const res = await fetch("/api/auth/admin/sign-in", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: adminName, email: adminEmail }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setAdminError(
          body?.error === "email_belongs_to_client"
            ? "That email is registered as a client. Use a different one."
            : "Admin sign-in failed.",
        );
        return;
      }
      const { redirectTo } = (await res.json()) as { redirectTo: string };
      router.push(redirectTo as never);
    } finally {
      setAdminSubmitting(false);
    }
  }

  async function onClientDevSignIn() {
    setClientDevSubmitting(true);
    try {
      const res = await fetch("/api/auth/dev/client-sign-in", { method: "POST" });
      if (res.ok) {
        const { redirectTo } = (await res.json()) as { redirectTo: string };
        router.push(redirectTo as never);
      }
    } finally {
      setClientDevSubmitting(false);
    }
  }

  async function onClientSubmit(e: React.FormEvent) {
    e.preventDefault();
    setClientError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/magic-link/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.status === 429) {
        setClientError("A link was just sent. Wait a minute before trying again.");
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setClientError(errorMessages[body?.error] ?? "Couldn't send link. Try again.");
        return;
      }
      router.push("/sign-in?sent=1");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex w-full max-w-md flex-col">
      <RoleToggle role={role} onChange={setRole} />

      <div className="mt-10">
        <h1 className="text-3xl tracking-tight text-brand-navy">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {role === "client"
            ? "Sign in to your website design project portal."
            : "Sign in with your TDO staff account."}
        </p>
      </div>

      {sent && role === "client" && (
        <Banner tone="success" className="mt-6">
          <strong className="font-semibold">Check your email.</strong> If your
          address is registered as a client, we just sent a sign-in link.
        </Banner>
      )}
      {error && (
        <Banner tone="error" className="mt-6">
          {errorMessages[error] ?? "Something went wrong. Please try again."}
        </Banner>
      )}

      <div className="mt-8">
        {role === "client" ? (
          <div className="space-y-5">
            {clientMode === "password" ? (
              <form onSubmit={onClientPasswordSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="client-email">Email address</Label>
                  <Input
                    id="client-email"
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@your-practice.com"
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="client-password">Password</Label>
                  <Input
                    id="client-password"
                    type="password"
                    required
                    value={clientPassword}
                    onChange={(e) => setClientPassword(e.target.value)}
                    className="h-11"
                  />
                </div>
                {clientPwError && (
                  <p className="text-sm text-brand-coral">{clientPwError}</p>
                )}
                <Button
                  type="submit"
                  size="lg"
                  className="h-11 w-full text-sm"
                  disabled={clientPwSubmitting}
                >
                  <IconLock size={16} /> {clientPwSubmitting ? "Signing in…" : "Sign in"}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setClientPwError(null);
                    setClientMode("link");
                  }}
                  className="text-xs text-brand-green hover:underline"
                >
                  First time here, or forgot your password? Email me a sign-in link
                </button>
              </form>
            ) : (
              <form onSubmit={onClientSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@your-practice.com"
                    autoFocus
                    className="h-11"
                  />
                </div>
                {clientError && (
                  <p className="text-sm text-brand-coral">{clientError}</p>
                )}
                <Button
                  type="submit"
                  size="lg"
                  className="h-11 w-full text-sm"
                  disabled={submitting}
                >
                  <IconMail size={16} /> {submitting ? "Sending…" : "Email me a sign-in link"}
                </Button>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  We&apos;ll only send a link if your email is on the contact list
                  for an active project. Links expire after 15 minutes. You can set
                  a password from your account once you&apos;re in.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setClientError(null);
                    setClientMode("password");
                  }}
                  className="text-xs text-brand-green hover:underline"
                >
                  Sign in with a password instead
                </button>
              </form>
            )}
            {devMode && (
              <div className="rounded-md border border-dashed border-amber-300 bg-amber-50/60 p-4">
                <div className="flex items-center gap-2 text-amber-900">
                  <IconBolt size={14} />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Dev bypass
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-amber-900/80">
                  Skip sign-in and continue as a demo client. Available in development only.
                </p>
                <Button
                  type="button"
                  variant="navy"
                  size="sm"
                  className="mt-3 w-full"
                  disabled={clientDevSubmitting}
                  onClick={onClientDevSignIn}
                >
                  {clientDevSubmitting ? "Signing in…" : "Sign in as demo client"}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            <form onSubmit={onStaffPasswordSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="staff-email">Email</Label>
                <Input
                  id="staff-email"
                  type="email"
                  required
                  autoFocus
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="you@tdo4endo.com"
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="staff-password">Password</Label>
                <Input
                  id="staff-password"
                  type="password"
                  required
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  className="h-11"
                />
              </div>
              {staffError && (
                <p className="text-sm text-brand-coral">{staffError}</p>
              )}
              <Button
                type="submit"
                size="lg"
                className="h-11 w-full text-sm"
                disabled={staffSubmitting}
              >
                <IconLock size={16} /> {staffSubmitting ? "Signing in…" : "Sign in"}
              </Button>
            </form>

            <div className="text-xs leading-relaxed text-muted-foreground">
              {showSso ? (
                <div className="space-y-3">
                  <div className="relative my-2 flex items-center">
                    <div className="flex-1 border-t" />
                    <span className="mx-3 text-[10px] uppercase tracking-wider text-muted-foreground">or</span>
                    <div className="flex-1 border-t" />
                  </div>
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link
                      href={`/api/auth/staff/begin?returnTo=${encodeURIComponent(returnTo)}` as never}
                    >
                      <IconShieldLock size={14} /> Continue with intranet SSO
                    </Link>
                  </Button>
                  <button
                    type="button"
                    onClick={() => setShowSso(false)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Hide
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSso(true)}
                  className="text-brand-green hover:underline"
                >
                  Use intranet SSO instead
                </button>
              )}
            </div>

            {devMode && (
              <div className="rounded-md border border-dashed border-amber-300 bg-amber-50/60 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-amber-900">
                    <IconBolt size={14} />
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Dev bypass
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAdminOpen((v) => !v)}
                    className="text-xs font-medium text-amber-900 hover:underline"
                  >
                    {adminOpen ? "Hide" : "Sign in as admin"}
                  </button>
                </div>

                {adminOpen && (
                  <form onSubmit={onAdminSubmit} className="mt-4 space-y-3">
                    <p className="text-xs leading-relaxed text-amber-900/80">
                      Skip intranet SSO and sign in directly as a staff user.
                      Available in development only — disabled in production.
                    </p>
                    <div className="space-y-1.5">
                      <Label htmlFor="admin-name" className="text-xs">
                        Name
                      </Label>
                      <Input
                        id="admin-name"
                        required
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        placeholder="Jared Ardine"
                        className="h-9 bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="admin-email" className="text-xs">
                        Email
                      </Label>
                      <Input
                        id="admin-email"
                        type="email"
                        required
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="jared.ardine@tdo4endo.com"
                        className="h-9 bg-white"
                      />
                    </div>
                    {adminError && (
                      <p className="text-xs text-brand-coral">{adminError}</p>
                    )}
                    <Button
                      type="submit"
                      variant="navy"
                      size="sm"
                      className="w-full"
                      disabled={adminSubmitting}
                    >
                      {adminSubmitting ? "Signing in…" : "Sign in as admin"}
                    </Button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-10 border-t pt-6 text-xs text-muted-foreground">
        Need help? Email{" "}
        <a
          href="mailto:webadmin@tdo4endo.com"
          className="text-brand-green hover:underline"
        >
          webadmin@tdo4endo.com
        </a>
        .
      </div>
    </div>
  );
}

function RoleToggle({ role, onChange }: { role: Role; onChange: (r: Role) => void }) {
  return (
    <div
      role="tablist"
      aria-label="Sign in as"
      className="inline-flex rounded-lg border bg-muted/40 p-1 text-sm"
    >
      <TabBtn
        active={role === "client"}
        onClick={() => onChange("client")}
        icon={<IconMail size={14} />}
      >
        I&apos;m a client
      </TabBtn>
      <TabBtn
        active={role === "staff"}
        onClick={() => onChange("staff")}
        icon={<IconShieldLock size={14} />}
      >
        I&apos;m TDO staff
      </TabBtn>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-4 py-1.5 font-medium transition-colors",
        active
          ? "bg-white text-brand-navy shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function Banner({
  tone,
  className,
  children,
}: {
  tone: "success" | "error";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-md border p-3 text-sm",
        tone === "success"
          ? "border-brand-green/30 bg-brand-green/10 text-brand-navy"
          : "border-brand-coral/30 bg-brand-coral/10 text-brand-navy",
        className,
      )}
    >
      {children}
    </div>
  );
}
