"use client";

import { useRouter } from "next/navigation";
import { BriefRevisionDialog } from "./brief-revision-dialog";

interface BriefRevisionCellProps {
  projectId: string;
  sectionSlug: string;
  sectionLabel: string;
}

export function BriefRevisionCell({ projectId, sectionSlug, sectionLabel }: BriefRevisionCellProps) {
  const router = useRouter();

  return (
    <BriefRevisionDialog
      projectId={projectId}
      sectionSlug={sectionSlug}
      sectionLabel={sectionLabel}
      onDone={() => router.refresh()}
    />
  );
}
