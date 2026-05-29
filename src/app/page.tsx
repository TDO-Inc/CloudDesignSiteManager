import { redirect } from "next/navigation";
import { getCurrentClient, getCurrentStaff } from "@/lib/auth/current-user";

export default async function HomePage() {
  // If we can't reach the DB (e.g. fresh checkout before env is configured),
  // fall through to /sign-in rather than crashing on the marketing root.
  try {
    const staff = await getCurrentStaff();
    if (staff) redirect("/staff");

    const client = await getCurrentClient();
    if (client) redirect("/dashboard");
  } catch (err) {
    if ((err as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    // Swallow session/DB errors at this entry point only.
  }

  redirect("/sign-in");
}
