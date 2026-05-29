"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  projectId: string;
  milestones: Array<{ slug: string; label: string }>;
  current: string;
}

export function MilestoneSelect({ projectId, milestones, current }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(current);
  const [saving, setSaving] = useState(false);

  async function onChange(next: string) {
    setValue(next);
    setSaving(true);
    try {
      await fetch(`/api/projects/${projectId}/milestone`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ milestoneSlug: next }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <select
      value={value}
      disabled={saving}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border bg-white px-2 py-1 text-sm"
    >
      {milestones.map((m) => (
        <option key={m.slug} value={m.slug}>
          {m.label}
        </option>
      ))}
    </select>
  );
}
