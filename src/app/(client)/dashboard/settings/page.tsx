import { eq } from "drizzle-orm";
import { IconLock, IconMail } from "@tabler/icons-react";
import { requireClient } from "@/lib/auth/current-user";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { PasswordSettings } from "@/components/client/password-settings";

export const metadata = { title: "Account · TDO Client Portal" };

export default async function SettingsPage() {
  const client = await requireClient();

  const isDevSession = client.id.startsWith("dev:client:");
  let hasPassword = false;
  if (!isDevSession) {
    try {
      const u = await db.query.users.findFirst({ where: eq(users.id, client.id) });
      hasPassword = Boolean(u?.passwordHash);
    } catch {
      hasPassword = false;
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <header className="mb-8">
        <h1 className="text-2xl text-brand-navy">Account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage how you sign in to your portal.
        </p>
      </header>

      <div className="space-y-6">
        {/* Profile summary */}
        <div className="rounded-lg border bg-white p-6">
          <div className="mb-3 flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-brand-green/10 text-brand-green">
              <IconMail size={20} />
            </div>
            <h2 className="text-base font-semibold text-brand-navy">Your details</h2>
          </div>
          <dl className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
            <dt className="text-muted-foreground">Name</dt>
            <dd className="text-brand-navy">{client.name}</dd>
            <dt className="text-muted-foreground">Email</dt>
            <dd className="text-brand-navy">{client.email}</dd>
          </dl>
        </div>

        {/* Password */}
        <div className="rounded-lg border bg-white p-6">
          <div className="mb-3 flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-brand-green/10 text-brand-green">
              <IconLock size={20} />
            </div>
            <h2 className="text-base font-semibold text-brand-navy">
              {hasPassword ? "Change password" : "Set a password"}
            </h2>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            {hasPassword
              ? "Update the password you use to sign in."
              : "Set a password so you can sign in without waiting for an email link each time. You can always still request a sign-in link instead."}
          </p>
          <PasswordSettings hasPassword={hasPassword} isDevSession={isDevSession} />
        </div>
      </div>
    </div>
  );
}
