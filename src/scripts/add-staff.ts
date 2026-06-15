/**
 * Bootstrap script — add a staff user from the CLI.
 *
 * Usage:
 *   npm run staff:add -- --email=jared.ardine@tdo4endo.com --name="Jared Ardine" --password=changeme123 --admin
 *
 * Idempotent on email — if the user exists, password/name/admin flags are
 * updated rather than failing.
 */

import "dotenv/config";
import { eq } from "drizzle-orm";
import { db, connectDb } from "../lib/db";
import { users } from "../lib/db/schema";
import { hashPassword } from "../lib/auth/password";

interface Args {
  email: string;
  name: string;
  password: string;
  admin: boolean;
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const found = args.find((a) => a.startsWith(`--${flag}=`));
    return found ? found.slice(flag.length + 3) : undefined;
  };
  const email = get("email");
  const name = get("name");
  const password = get("password");
  const admin = args.includes("--admin");

  if (!email || !name || !password) {
    console.error(
      "Usage: npm run staff:add -- --email=<email> --name=\"<name>\" --password=<password> [--admin]",
    );
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }
  return { email: email.toLowerCase(), name, password, admin };
}

async function main() {
  await connectDb();
  const args = parseArgs();
  const passwordHash = await hashPassword(args.password);

  const existing = await db.query.users.findFirst({ where: eq(users.email, args.email) });
  if (existing) {
    if (existing.userType !== "staff") {
      console.error(
        `User ${args.email} already exists as a client. Refusing to convert.`,
      );
      process.exit(1);
    }
    await db
      .update(users)
      .set({
        name: args.name,
        passwordHash,
        isAdmin: args.admin || existing.isAdmin,
        deactivatedAt: null,
      })
      .where(eq(users.id, existing.id));
    console.log(`Updated existing staff user ${args.email}${args.admin ? " (admin)" : ""}.`);
  } else {
    await db.insert(users).values({
      email: args.email,
      name: args.name,
      userType: "staff",
      passwordHash,
      isAdmin: args.admin,
    });
    console.log(`Created staff user ${args.email}${args.admin ? " (admin)" : ""}.`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
