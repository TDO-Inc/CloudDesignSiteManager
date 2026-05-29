import { db } from "@/lib/db";
import { offices } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";

export default async function OfficesPage() {
  const rows = await db
    .select()
    .from(offices)
    .orderBy(offices.name)
    .catch(() => []);

  return (
    <div className="px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl text-brand-navy">Offices</h1>
        <p className="text-sm text-muted-foreground">{rows.length} offices</p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border bg-white px-6 py-12 text-center text-sm text-muted-foreground">
          No offices configured. Contact your administrator to add offices.
        </div>
      ) : (
        <div className="rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Slug</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3 font-medium">{o.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{o.slug}</td>
                  <td className="px-4 py-3">
                    <Badge variant={o.active ? "success" : "muted"}>
                      {o.active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        Office management (add, edit, deactivate) is coming in Phase 2.
      </p>
    </div>
  );
}
