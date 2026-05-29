import Link from "next/link";
import { desc, eq, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations, projects } from "@/lib/db/schema";

export default async function ClientsPage() {
  const orgs = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      createdAt: organizations.createdAt,
      projectCount: count(projects.id),
    })
    .from(organizations)
    .leftJoin(projects, eq(projects.organizationId, organizations.id))
    .groupBy(organizations.id, organizations.name, organizations.createdAt)
    .orderBy(organizations.name)
    .catch(() => []);

  return (
    <div className="px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl text-brand-navy">Clients</h1>
        <p className="text-sm text-muted-foreground">{orgs.length} organizations</p>
      </div>

      {orgs.length === 0 ? (
        <div className="rounded-lg border bg-white px-6 py-12 text-center text-sm text-muted-foreground">
          No clients yet. Create a project to add a client organization.
        </div>
      ) : (
        <div className="rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Organization</th>
                <th className="px-4 py-2">Projects</th>
                <th className="px-4 py-2">Added</th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((org) => (
                <tr key={org.id} className="border-b last:border-b-0 hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium text-brand-navy">{org.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {org.projectCount > 0 ? (
                      <Link
                        href={`/staff?tab=projects` as never}
                        className="text-brand-green hover:underline"
                      >
                        {org.projectCount} project{org.projectCount !== 1 ? "s" : ""}
                      </Link>
                    ) : (
                      <span>0 projects</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(org.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
