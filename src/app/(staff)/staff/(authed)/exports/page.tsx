import { IconArchive } from "@tabler/icons-react";

export default function ExportsPage() {
  return (
    <div className="px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl text-brand-navy">Exports</h1>
        <p className="text-sm text-muted-foreground">Bulk data export for your projects</p>
      </div>

      <div className="rounded-lg border bg-white p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <IconArchive size={22} className="text-muted-foreground" />
        </div>
        <h2 className="text-base font-semibold text-brand-navy">Coming in Phase 2</h2>
        <p className="mt-2 max-w-sm mx-auto text-sm text-muted-foreground">
          Bulk export of project data — briefs, files, activity logs, and client information —
          in CSV and ZIP formats.
        </p>
        <p className="mt-4 text-xs text-muted-foreground">
          Per-project file exports are available now on each project&apos;s Files tab.
        </p>
      </div>
    </div>
  );
}
