import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { serviceTypes, projectTemplates, offices } from "@/lib/db/schema";
import { NewProjectForm } from "@/components/staff/new-project-form";
import { IconArrowLeft } from "@tabler/icons-react";

export default async function NewProjectPage() {
  const allServiceTypes = await db.select().from(serviceTypes).where(eq(serviceTypes.active, true)).catch(() => []);
  const allTemplates = await db.select().from(projectTemplates).where(eq(projectTemplates.active, true)).catch(() => []);
  const allOffices = await db.select().from(offices).where(eq(offices.active, true)).catch(() => []);

  return (
    <div className="px-6 py-6">
      <Link href="/staff/projects" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-brand-green">
        <IconArrowLeft size={16} /> All projects
      </Link>

      <header className="mb-6">
        <h1 className="text-2xl text-brand-navy">New project</h1>
        <p className="text-sm text-muted-foreground">
          Set up a new website project for a client. They&apos;ll get a magic-link invite once you save.
        </p>
      </header>

      <NewProjectForm
        serviceTypes={allServiceTypes.map((s) => ({ id: s.id, name: s.name, slug: s.slug }))}
        templates={allTemplates.map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description ?? "",
          serviceTypeId: t.serviceTypeId,
          version: t.version,
        }))}
        offices={allOffices.map((o) => ({ id: o.id, name: o.name }))}
      />
    </div>
  );
}
