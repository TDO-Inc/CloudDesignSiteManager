import { eq, desc } from "drizzle-orm";
import { requireClient } from "@/lib/auth/current-user";
import { getPrimaryClientProject } from "@/lib/projects/queries";
import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { FileUploader } from "@/components/client/file-uploader";
import { Badge } from "@/components/ui/badge";

export default async function FilesPage() {
  const user = await requireClient();
  const project = await getPrimaryClientProject(user.id).catch(() => null);
  if (!project) return null;

  const allFiles = await db
    .select()
    .from(files)
    .where(eq(files.projectId, project.id))
    .orderBy(desc(files.createdAt))
    .catch(() => []);

  const categories = project.templateSnapshot.fileCategories.categories;

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <header className="mb-6">
        <h1 className="text-2xl text-brand-navy">Photos &amp; files</h1>
        <p className="text-sm text-muted-foreground">
          Upload logos, photos, and any documents we&apos;ll need. Pick the category that fits best — your TDO team can re-categorize anything if needed.
        </p>
      </header>

      <div className="space-y-6">
        {categories.map((cat) => {
          const catFiles = allFiles.filter((f) => f.category === cat.slug);
          return (
            <section key={cat.slug} className="rounded-lg border bg-white p-5">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h2 className="text-base text-brand-navy">{cat.label}</h2>
                  {cat.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{cat.description}</p>
                  )}
                </div>
                <Badge variant="muted">{catFiles.length} files</Badge>
              </div>

              <FileUploader
                projectId={project.id}
                category={cat.slug}
                accept={cat.accept}
                multiple={cat.multiple !== false}
              />

              {catFiles.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {catFiles.map((f) => (
                    <li key={f.id} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm">
                      <span className="truncate">{f.filename}</span>
                      <span className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">
                          {(f.sizeBytes / 1024).toFixed(0)} KB
                        </span>
                        <Badge variant={
                          f.scanStatus === "clean" ? "success" :
                          f.scanStatus === "infected" || f.scanStatus === "error" ? "outline" :
                          "warning"
                        }>
                          {f.scanStatus === "clean" ? "Ready" : f.scanStatus === "pending" ? "Scanning…" : f.scanStatus}
                        </Badge>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
