// Pass-through layout — both /staff/sign-in (public) and /staff/(authed)/*
// (protected) live under this group. The protected layout is nested under
// (authed) and enforces requireStaff() + renders the StaffShell.
export default function StaffGroupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
