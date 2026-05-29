import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string }>;
}

export default async function StaffProjectsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const qs = new URLSearchParams({ tab: "projects" });
  if (params.status) qs.set("status", params.status);
  if (params.q) qs.set("q", params.q);
  redirect(`/staff?${qs.toString()}`);
}
