"use client";

import { useState } from "react";
import { IconPlus, IconPencil, IconCircleCheck, IconCircleX } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KbArticleEditor } from "@/components/staff/kb-article-editor";

const CATEGORY_LABELS: Record<string, string> = {
  process: "Process & milestones",
  content_requirements: "Content requirements",
  photo_guidelines: "Photo & file guidelines",
  faq: "Client FAQs",
  general: "General",
};

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[] | null;
  active: boolean;
  updatedAt: Date;
}

export function KbPageClient({ articles }: { articles: Article[] }) {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="px-6 py-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-brand-navy">Knowledge base</h1>
          <p className="text-sm text-muted-foreground">
            Articles the AI assistant draws from when answering client questions.
          </p>
        </div>
        <Button onClick={() => { setCreating(true); setEditingId(null); }} className="gap-1.5">
          <IconPlus size={15} />
          New article
        </Button>
      </header>

      {creating && (
        <div className="mb-6">
          <KbArticleEditor onClose={() => setCreating(false)} />
        </div>
      )}

      <div className="space-y-2">
        {articles.length === 0 && !creating && (
          <div className="rounded-lg border bg-white p-8 text-center text-muted-foreground text-sm">
            No articles yet. Create your first one to give the AI assistant context about TDO&apos;s process.
          </div>
        )}

        {articles.map((article) => (
          <div key={article.id}>
            {editingId === article.id ? (
              <KbArticleEditor
                article={article}
                onClose={() => setEditingId(null)}
              />
            ) : (
              <div className="flex items-start gap-3 rounded-lg border bg-white p-4">
                <div className="mt-0.5">
                  {article.active
                    ? <IconCircleCheck size={16} className="text-brand-green" />
                    : <IconCircleX size={16} className="text-muted-foreground" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-brand-navy text-sm">{article.title}</span>
                    <Badge variant="muted" className="text-xs">
                      {CATEGORY_LABELS[article.category] ?? article.category}
                    </Badge>
                    {!article.active && (
                      <Badge variant="outline" className="text-xs text-muted-foreground">Inactive</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{article.content}</p>
                </div>
                <button
                  onClick={() => { setEditingId(article.id); setCreating(false); }}
                  className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Edit article"
                >
                  <IconPencil size={15} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
