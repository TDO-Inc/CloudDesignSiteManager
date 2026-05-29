import { db } from "@/lib/db";
import { projectTemplates, serviceTypes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";

export default async function TemplatesPage() {
  const rows = await db
    .select({
      id: projectTemplates.id,
      name: projectTemplates.name,
      description: projectTemplates.description,
      version: projectTemplates.version,
      active: projectTemplates.active,
      createdAt: projectTemplates.createdAt,
      serviceTypeName: serviceTypes.name,
    })
    .from(projectTemplates)
    .innerJoin(serviceTypes, eq(serviceTypes.id, projectTemplates.serviceTypeId))
    .orderBy(projectTemplates.name)
    .catch(() => []);

  return (
    <div className="px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl text-brand-navy">Templates</h1>
        <p className="text-sm text-muted-foreground">{rows.length} project templates</p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border bg-white px-6 py-12 text-center text-sm text-muted-foreground">
          No templates configured yet.
        </div>
      ) : (
        <div className="rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Service type</th>
                <th className="px-4 py-2">Version</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{t.name}</p>
                    {t.description && (
                      <p className="text-xs text-muted-foreground">{t.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{t.serviceTypeName}</td>
                  <td className="px-4 py-3 text-muted-foreground">v{t.version}</td>
                  <td className="px-4 py-3">
                    <Badge variant={t.active ? "success" : "muted"}>
                      {t.active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        Template editing (milestones, brief fields, file categories) is coming in Phase 2.
      </p>
    </div>
  );
}
