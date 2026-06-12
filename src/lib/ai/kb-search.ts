/**
 * Knowledge base full-text search.
 *
 * Uses SQL Server's CONTAINSTABLE for fast, accurate retrieval
 * of knowledge base articles relevant to a user's query. Falls back to an
 * empty array if the DB is unavailable or the query is empty.
 *
 * Requires a full-text catalog and index on kb_articles table.
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
      SELECT TOP (${limit}) k.id, k.title, k.content, k.category
      FROM kb_articles k
      INNER JOIN CONTAINSTABLE(kb_articles, (title, content), ${q}) ct ON k.id = ct.[KEY]
      WHERE k.active = 1
      ORDER BY ct.[RANK] DESC
    `);
    return (rows.recordset as unknown as KbArticle[]) || [];
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
