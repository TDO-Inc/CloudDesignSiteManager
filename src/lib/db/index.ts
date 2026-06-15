import { drizzle, type NodeMsSqlDatabase } from "drizzle-orm/node-mssql";
import * as sql from "mssql";
import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __mssqlPool: sql.ConnectionPool | undefined;
  // eslint-disable-next-line no-var
  var __dbInstance: NodeMsSqlDatabase<typeof schema> | undefined;
}

function getDb(): NodeMsSqlDatabase<typeof schema> {
  if (global.__dbInstance) return global.__dbInstance;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool =
    global.__mssqlPool ??
    new sql.ConnectionPool(connectionString);

  // Fire-and-forget: start connecting so the pool is ready by the time the
  // first query arrives. Queries will fail with "Not connected" if they race
  // ahead of this, but in practice the server is up long before the first
  // request is handled.
  if (!pool.connected && !pool.connecting) {
    pool.connect().catch((err: unknown) => {
      console.error("[db] Connection pool failed to connect:", err);
    });
  }

  const instance = drizzle(pool, { schema });
  if (process.env.NODE_ENV !== "production") {
    global.__mssqlPool = pool;
    global.__dbInstance = instance;
  } else {
    global.__dbInstance = instance;
  }
  return instance;
}

/**
 * For CLI scripts: awaits the connection pool before the first query.
 * Next.js server code doesn't need this — the pool connects during startup,
 * well before the first request arrives.
 */
export async function connectDb(): Promise<void> {
  getDb(); // ensures __mssqlPool is initialized
  await global.__mssqlPool!.connect(); // no-op if already connected/connecting
}

/**
 * Drizzle client — actual connection is created on first access, not at
 * module load, so `next build` can collect page data without DATABASE_URL.
 */
export const db: NodeMsSqlDatabase<typeof schema> = new Proxy(
  {} as NodeMsSqlDatabase<typeof schema>,
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
