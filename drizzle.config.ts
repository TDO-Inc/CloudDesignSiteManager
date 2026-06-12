import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  // drizzle-kit@mssql pre-release — "mssql" is not yet in the published type union
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dialect: "mssql" as any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dbCredentials: {
    connectionString:
      process.env.DATABASE_URL ??
      "Server=localhost,1433;Database=tdo_portal;User Id=sa;Password=YourStrong@Password1;Encrypt=False;TrustServerCertificate=True;",
  } as any,
  strict: true,
  verbose: true,
});
