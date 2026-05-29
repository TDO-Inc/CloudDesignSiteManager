import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __pgClient: ReturnType<typeof postgres> | undefined;
  // eslint-disable-next-line no-var
  var __dbInstance: PostgresJsDatabase<typeof schema> | undefined;
}

function getDb(): PostgresJsDatabase<typeof schema> {
  if (global.__dbInstance) return global.__dbInstance;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const client =
    global.__pgClient ??
    postgres(connectionString, {
      max: 10,
      idle_timeout: 30,
      prepare: false,
    });

  const instance = drizzle(client, { schema });
  if (process.env.NODE_ENV !== "production") {
    global.__pgClient = client;
    global.__dbInstance = instance;
  } else {
    global.__dbInstance = instance;
  }
  return instance;
}

/**
 * Drizzle client — actual connection is created on first access, not at
 * module load, so `next build` can collect page data without DATABASE_URL.
 */
export const db: PostgresJsDatabase<typeof schema> = new Proxy(
  {} as PostgresJsDatabase<typeof schema>,
  {
    get(_t, prop) {
      const real = getDb();
      const value = (real as never as Record<PropertyKey, unknown>)[prop];
      if (typeof value === "function") {
        return (value as (...args: unknown[]) => unknown).bind(real);
      }
      return value;
    },
  },
);

/** True when DATABASE_URL is configured and the DB layer is available. */
export function isDatabaseAvailable(): boolean {
  return !!process.env.DATABASE_URL;
}

export { schema };
