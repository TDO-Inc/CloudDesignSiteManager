import { requireStaff } from "@/lib/auth/current-user";
import { StaffShell } from "@/components/staff/staff-shell";

export default async function StaffAuthedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();
  return <StaffShell user={user}>{children}</StaffShell>;
}
