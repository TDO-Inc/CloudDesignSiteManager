"use client";

import { useState } from "react";
import { IconPlus, IconTrash, IconLoader2 } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type MemberRole = "owner" | "pm" | "designer" | "developer" | "client";

interface Member {
  userId: string;
  role: MemberRole;
  user: {
    id: string;
    name: string;
    email: string;
    userType: "staff" | "client";
  };
}

interface TeamManagerProps {
  projectId: string;
  initialMembers: Member[];
}

const ROLES: { value: MemberRole; label: string }[] = [
  { value: "owner", label: "Owner" },
  { value: "pm", label: "PM" },
  { value: "designer", label: "Designer" },
  { value: "developer", label: "Developer" },
  { value: "client", label: "Client" },
];

const ROLE_SELECT_CLASS =
  "h-8 rounded-md border border-input bg-background px-2 text-xs disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-ring";

export function TeamManager({ projectId, initialMembers }: TeamManagerProps) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ email: "", name: "", role: "client" as MemberRole });
  const [addError, setAddError] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);
  const [roleLoading, setRoleLoading] = useState<string | null>(null);
  const [removeLoading, setRemoveLoading] = useState<string | null>(null);

  async function handleAdd() {
    setAddError(null);
    setAddLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: form.email.trim(), name: form.name.trim() || undefined, role: form.role }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        user?: Member["user"];
        role?: MemberRole;
        message?: string;
        error?: string;
      };
      if (!res.ok) {
        setAddError(data.message ?? data.error ?? "Failed to add member.");
        return;
      }
      setMembers((prev) => [...prev, { userId: data.user!.id, role: data.role!, user: data.user! }]);
      setForm({ email: "", name: "", role: "client" });
      setShowAdd(false);
    } catch {
      setAddError("Network error — please try again.");
    } finally {
      setAddLoading(false);
    }
  }

  async function handleRoleChange(userId: string, role: MemberRole) {
    setRoleLoading(userId);
    try {
      await fetch(`/api/projects/${projectId}/members/${userId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role }),
      });
      setMembers((prev) => prev.map((m) => (m.userId === userId ? { ...m, role } : m)));
    } finally {
      setRoleLoading(null);
    }
  }

  async function handleRemove(userId: string) {
    setRemoveLoading(userId);
    try {
      await fetch(`/api/projects/${projectId}/members/${userId}`, { method: "DELETE" });
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
    } finally {
      setRemoveLoading(null);
    }
  }

  return (
    <div className="rounded-lg border bg-white">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold text-brand-navy">Team members</h3>
        <Button size="sm" variant="outline" onClick={() => { setShowAdd(!showAdd); setAddError(null); }}>
          <IconPlus size={14} />
          Add member
        </Button>
      </div>

      {showAdd && (
        <div className="border-b bg-muted/20 p-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="mb-1 block text-xs text-muted-foreground">Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && !addLoading && void handleAdd()}
                placeholder="user@example.com"
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs text-muted-foreground">
                Name <span className="text-muted-foreground/60">(new clients only)</span>
              </Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Full name"
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs text-muted-foreground">Role</Label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as MemberRole })}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>
          {addError && <p className="mt-2 text-xs text-red-600">{addError}</p>}
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => void handleAdd()} disabled={addLoading || !form.email.trim()}>
              {addLoading && <IconLoader2 size={13} className="animate-spin" />}
              Add
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setShowAdd(false); setAddError(null); setForm({ email: "", name: "", role: "client" }); }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <table className="w-full text-sm">
        <thead className="border-b bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Email</th>
            <th className="px-4 py-2">Type</th>
            <th className="px-4 py-2">Role</th>
            <th className="px-4 py-2 w-10"></th>
          </tr>
        </thead>
        <tbody>
          {members.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                No team members yet. Add one above.
              </td>
            </tr>
          ) : (
            members.map((m) => (
              <tr key={m.userId} className="border-b last:border-b-0">
                <td className="px-4 py-3 font-medium">{m.user.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{m.user.email}</td>
                <td className="px-4 py-3">
                  <Badge variant="muted">{m.user.userType}</Badge>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={m.role}
                    disabled={roleLoading === m.userId}
                    onChange={(e) => void handleRoleChange(m.userId, e.target.value as MemberRole)}
                    className={ROLE_SELECT_CLASS}
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => void handleRemove(m.userId)}
                    disabled={removeLoading === m.userId}
                    className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                    title="Remove from project"
                  >
                    {removeLoading === m.userId
                      ? <IconLoader2 size={14} className="animate-spin" />
                      : <IconTrash size={14} />}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
