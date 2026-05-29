import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getClientSession, getStaffSession } from "./session";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  userType: "client" | "staff";
  isAdmin?: boolean;
};

export async function getCurrentClient(): Promise<CurrentUser | null> {
  const session = await getClientSession();
  if (!session.userId) return null;

  // Dev-bypass client session — trust the encrypted cookie directly.
  if (session.userId.startsWith("dev:client:")) {
    if (!session.email || !session.name) return null;
    return { id: session.userId, email: session.email, name: session.name, userType: "client" };
  }

  try {
    const u = await db.query.users.findFirst({ where: eq(users.id, session.userId) });
    if (!u || u.userType !== "client") return null;
    return { id: u.id, email: u.email, name: u.name, userType: "client" };
  } catch {
    return null;
  }
}

export async function getCurrentStaff(): Promise<CurrentUser | null> {
  const session = await getStaffSession();
  if (!session.userId) return null;

  // Dev-bypass staff session — trust the encrypted cookie directly.
  if (session.userId.startsWith("dev:")) {
    if (!session.email || !session.name) return null;
    return { id: session.userId, email: session.email, name: session.name, userType: "staff", isAdmin: true };
  }

  try {
    const u = await db.query.users.findFirst({ where: eq(users.id, session.userId) });
    if (!u || u.userType !== "staff" || u.deactivatedAt) return null;
    return { id: u.id, email: u.email, name: u.name, userType: "staff", isAdmin: u.isAdmin };
  } catch {
    return null;
  }
}

export async function requireClient() {
  const user = await getCurrentClient();
  if (!user) redirect("/sign-in");
  return user;
}

export async function requireStaff() {
  const user = await getCurrentStaff();
  if (!user) redirect("/sign-in?role=staff");
  return user;
}

export async function requireStaffAdmin() {
  const user = await requireStaff();
  if (!user.isAdmin) redirect("/staff?error=forbidden");
  return user;
}
