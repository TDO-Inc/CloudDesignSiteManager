/**
 * Knowledge base full-text search.
 *
 * Uses PostgreSQL's built-in tsvector/tsquery for fast, accurate retrieval
 * of knowledge base articles relevant to a user's query. Falls back to an
 * empty array if the DB is unavailable or the query is empty.
 */

import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export type KbArticle = {
  id: string;
  title: string;
  content: string;
  category: string;
};

/**
 * Search the knowledge base for articles relevant to `query`.
 * Returns up to `limit` articles ranked by full-text relevance.
 */
export async function searchKb(query: string, limit = 4): Promise<KbArticle[]> {
  const q = query.trim();
  if (!q) return [];

  try {
    const rows = await db.execute(sql`
      SELECT id, title, content, category
      FROM kb_articles
      WHERE active = true
        AND to_tsvector('english', title || ' ' || content)
              @@ plainto_tsquery('english', ${q})
      ORDER BY
        ts_rank(
          to_tsvector('english', title || ' ' || content),
          plainto_tsquery('english', ${q})
        ) DESC
      LIMIT ${limit}
    `);
    return Array.from(rows) as KbArticle[];
  } catch (err) {
    console.warn("[kb-search] search failed", err);
    return [];
  }
}

/** Format KB articles for injection into the Claude system prompt. */
export function formatKbContext(articles: KbArticle[]): string {
  if (articles.length === 0) return "";
  const sections = articles
    .map((a) => `### ${a.title}\n${a.content}`)
    .join("\n\n");
  return `\n\n---\n## Relevant knowledge base articles\n\n${sections}`;
}
