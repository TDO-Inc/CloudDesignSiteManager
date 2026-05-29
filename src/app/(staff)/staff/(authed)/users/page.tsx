import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { IconArrowLeft } from "@tabler/icons-react";
import { requireStaffAdmin } from "@/lib/auth/current-user";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { StaffUsersManager } from "@/components/staff/staff-users-manager";

export default async function StaffUsersPage() {
  await requireStaffAdmin();

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      isAdmin: users.isAdmin,
      deactivatedAt: users.deactivatedAt,
      lastLoginAt: users.lastLoginAt,
      hasPassword: users.passwordHash,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.userType, "staff"))
    .orderBy(asc(users.createdAt))
    .catch(() => []);

  return (
    <div className="px-6 py-6">
      <Link href="/staff" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-brand-green">
        <IconArrowLeft size={16} /> Dashboard
      </Link>

      <header className="mb-6">
        <h1 className="text-2xl text-brand-navy">Staff users</h1>
        <p className="text-sm text-muted-foreground">
          Manage who can sign in to the staff portal. Admins can add, deactivate, and reset passwords for other staff.
        </p>
      </header>

      <StaffUsersManager
        initialUsers={rows.map((r) => ({
          id: r.id,
          email: r.email,
          name: r.name,
          isAdmin: r.isAdmin,
          active: r.deactivatedAt === null,
          hasPassword: !!r.hasPassword,
          lastLoginAt: r.lastLoginAt ? r.lastLoginAt.toISOString() : null,
        }))}
      />
    </div>
  );
}
