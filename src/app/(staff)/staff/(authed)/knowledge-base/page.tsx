import { db } from "@/lib/db";
import { kbArticles } from "@/lib/db/schema";
import { requireStaff } from "@/lib/auth/current-user";
import { desc } from "drizzle-orm";
import { KbPageClient } from "./page-client";

export const metadata = { title: "Knowledge base · TDO Staff Portal" };

export default async function KnowledgeBasePage() {
  await requireStaff();

  const articles = await db
    .select()
    .from(kbArticles)
    .orderBy(desc(kbArticles.updatedAt))
    .catch(() => []);

  return <KbPageClient articles={articles} />;
}
