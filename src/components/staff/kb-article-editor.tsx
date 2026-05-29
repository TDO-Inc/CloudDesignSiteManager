"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconLoader2, IconTrash } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const CATEGORIES = [
  { value: "process", label: "Process & milestones" },
  { value: "content_requirements", label: "Content requirements" },
  { value: "photo_guidelines", label: "Photo & file guidelines" },
  { value: "faq", label: "Client FAQs" },
  { value: "general", label: "General" },
] as const;

interface KbArticleEditorProps {
  article?: {
    id: string;
    title: string;
    content: string;
    category: string;
    tags: string[] | null;
    active: boolean;
  };
  onClose: () => void;
}

export function KbArticleEditor({ article, onClose }: KbArticleEditorProps) {
  const router = useRouter();
  const isEdit = !!article;

  const [title, setTitle] = useState(article?.title ?? "");
  const [content, setContent] = useState(article?.content ?? "");
  const [category, setCategory] = useState(article?.category ?? "general");
  const [active, setActive] = useState(article?.active ?? true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const url = isEdit ? `/api/staff/kb/${article.id}` : "/api/staff/kb";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, content, category, active }),
      });
      if (!res.ok) throw new Error("Save failed");
      router.refresh();
      onClose();
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteArticle() {
    if (!article || !confirm("Delete this article? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await fetch(`/api/staff/kb/${article.id}`, { method: "DELETE" });
      router.refresh();
      onClose();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4 rounded-lg border bg-white p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-brand-navy">
          {isEdit ? "Edit article" : "New article"}
        </h3>
        <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">
          Cancel
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="kb-title">Title</Label>
          <Input
            id="kb-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. What to include in a doctor bio"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="kb-category">Category</Label>
          <select
            id="kb-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-end gap-2">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            Active (visible to AI assistant)
          </label>
        </div>
      </div>

      <div>
        <Label htmlFor="kb-content">Content</Label>
        <Textarea
          id="kb-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          placeholder="Write the knowledge base article content here. Be specific and practical — this content will be injected into the AI assistant when relevant."
          className="mt-1 font-mono text-sm"
        />
        <p className="mt-1 text-xs text-muted-foreground">{content.length} characters</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-between">
        {isEdit ? (
          <Button
            variant="ghost"
            onClick={deleteArticle}
            disabled={deleting}
            className="gap-1.5 text-red-600 hover:text-red-700"
          >
            {deleting ? <IconLoader2 size={14} className="animate-spin" /> : <IconTrash size={14} />}
            Delete
          </Button>
        ) : (
          <div />
        )}
        <Button onClick={save} disabled={saving} className="gap-1.5">
          {saving && <IconLoader2 size={14} className="animate-spin" />}
          {isEdit ? "Save changes" : "Create article"}
        </Button>
      </div>
    </div>
  );
}
