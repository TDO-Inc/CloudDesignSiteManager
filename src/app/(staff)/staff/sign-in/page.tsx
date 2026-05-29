import { redirect } from "next/navigation";

interface StaffSignInProps {
  searchParams: Promise<{ error?: string; returnTo?: string }>;
}

export default async function StaffSignInPage({ searchParams }: StaffSignInProps) {
  const params = await searchParams;
  const url = new URLSearchParams();
  url.set("role", "staff");
  if (params.error) url.set("error", params.error);
  if (params.returnTo) url.set("returnTo", params.returnTo);
  redirect(`/sign-in?${url.toString()}`);
}
