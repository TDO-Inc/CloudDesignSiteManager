"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconPlus, IconKey, IconUserCheck, IconUserOff, IconShieldCheck, IconShieldOff } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface StaffUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  active: boolean;
  hasPassword: boolean;
  lastLoginAt: string | null;
}

interface Props {
  initialUsers: StaffUser[];
}

export function StaffUsersManager({ initialUsers }: Props) {
  const router = useRouter();
  const [users, setUsers] = useState<StaffUser[]>(initialUsers);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    isAdmin: false,
  });

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/staff/users", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(
        body?.error === "email_exists"
          ? "A user with that email already exists."
          : body?.error ?? "Failed to create user.",
      );
      return;
    }
    setForm({ name: "", email: "", password: "", isAdmin: false });
    setAdding(false);
    router.refresh();
  }

  async function patch(userId: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/staff/users/${userId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => null);
      setError(errBody?.error ?? "Action failed.");
      return false;
    }
    return true;
  }

  async function toggleActive(u: StaffUser) {
    const ok = await patch(u.id, { active: !u.active });
    if (ok) setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, active: !x.active } : x)));
  }

  async function toggleAdmin(u: StaffUser) {
    const ok = await patch(u.id, { isAdmin: !u.isAdmin });
    if (ok) setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, isAdmin: !x.isAdmin } : x)));
  }

  async function resetPassword(u: StaffUser) {
    const next = prompt(`New password for ${u.email}? (min 8 characters)`);
    if (!next) return;
    if (next.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    const ok = await patch(u.id, { password: next });
    if (ok) {
      setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, hasPassword: true } : x)));
      alert("Password updated.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="text-brand-navy">{users.length} staff users</h2>
          <Button size="sm" onClick={() => setAdding((v) => !v)}>
            <IconPlus size={14} /> {adding ? "Cancel" : "Add staff user"}
          </Button>
        </div>

        {adding && (
          <form onSubmit={createUser} className="space-y-3 border-b bg-muted/20 p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="new-name">Name</Label>
                <Input id="new-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Smith" />
              </div>
              <div>
                <Label htmlFor="new-email">Email</Label>
                <Input id="new-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@tdo4endo.com" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="new-password">Temporary password</Label>
                <Input id="new-password" type="text" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" />
                <p className="mt-1 text-xs text-muted-foreground">Share this securely. The user should change it after first sign-in.</p>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.isAdmin} onChange={(e) => setForm({ ...form, isAdmin: e.target.checked })} />
                  Grant admin (can add &amp; manage other staff)
                </label>
              </div>
            </div>
            {error && <p className="text-sm text-brand-coral">{error}</p>}
            <div className="flex justify-end">
              <Button type="submit">Create user</Button>
            </div>
          </form>
        )}

        {!adding && error && (
          <p className="border-b bg-brand-coral/10 px-5 py-2 text-sm text-brand-coral">{error}</p>
        )}

        <table className="w-full text-sm">
          <thead className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-2">Name</th>
              <th className="px-5 py-2">Email</th>
              <th className="px-5 py-2">Role</th>
              <th className="px-5 py-2">Status</th>
              <th className="px-5 py-2">Last sign-in</th>
              <th className="px-5 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-muted-foreground">
                  No staff users yet.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b last:border-b-0">
                  <td className="px-5 py-3 font-medium">{u.name}</td>
                  <td className="px-5 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-5 py-3">
                    {u.isAdmin ? <Badge variant="info">Admin</Badge> : <Badge variant="muted">Staff</Badge>}
                  </td>
                  <td className="px-5 py-3">
                    {u.active ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="muted">Deactivated</Badge>
                    )}
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "never"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => resetPassword(u)} title="Reset password">
                        <IconKey size={14} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleAdmin(u)} title={u.isAdmin ? "Revoke admin" : "Grant admin"}>
                        {u.isAdmin ? <IconShieldOff size={14} /> : <IconShieldCheck size={14} />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleActive(u)} title={u.active ? "Deactivate" : "Reactivate"}>
                        {u.active ? <IconUserOff size={14} /> : <IconUserCheck size={14} />}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
