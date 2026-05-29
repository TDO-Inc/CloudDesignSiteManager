import { eq, asc } from "drizzle-orm";
import { requireClient } from "@/lib/auth/current-user";
import { getPrimaryClientProject } from "@/lib/projects/queries";
import { db } from "@/lib/db";
import { projectMessages, users } from "@/lib/db/schema";
import { MessagesClient, type MessageRow } from "./messages-client";

export const metadata = { title: "Messages · TDO Client Portal" };

export default async function MessagesPage() {
  const user = await requireClient();
  const project = await getPrimaryClientProject(user.id).catch(() => null);

  if (!project) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="mb-2 text-2xl text-brand-navy">Messages</h1>
        <div className="rounded-lg border bg-white p-8 text-center text-sm text-muted-foreground">
          No active project yet. Messages will be available once your TDO team creates your project.
        </div>
      </div>
    );
  }

  const rows = await db
    .select({
      id: projectMessages.id,
      body: projectMessages.body,
      isFromStaff: projectMessages.isFromStaff,
      createdAt: projectMessages.createdAt,
      senderName: users.name,
    })
    .from(projectMessages)
    .innerJoin(users, eq(users.id, projectMessages.userId))
    .where(eq(projectMessages.projectId, project.id))
    .orderBy(asc(projectMessages.createdAt))
    .catch(() => []);

  const messages: MessageRow[] = rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="mb-1 text-2xl text-brand-navy">Messages</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Chat directly with your TDO project manager. We typically respond within one business day.
      </p>
      <div className="rounded-lg border bg-white overflow-hidden">
        <MessagesClient projectId={project.id} initialMessages={messages} />
      </div>
    </div>
  );
}
