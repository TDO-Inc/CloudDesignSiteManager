import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, desc, asc } from "drizzle-orm";
import { IconArrowLeft, IconFile } from "@tabler/icons-react";
import { db } from "@/lib/db";
import { files, projectMessages, users } from "@/lib/db/schema";
import { getProjectDetail, getProjectActivity, getProjectNotes, computeProjectProgress } from "@/lib/projects/queries";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { MilestoneBar } from "@/components/client/milestone-bar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { InternalNoteForm } from "@/components/staff/internal-note-form";
import { MilestoneSelect } from "@/components/staff/milestone-select";
import { ProjectLinksForm } from "@/components/staff/project-links-form";
import { InviteClientButton } from "@/components/staff/invite-client-button";
import { BriefRevisionCell } from "@/components/staff/brief-revision-cell";
import { StaffMessageForm } from "@/components/staff/staff-message-form";
import { TeamManager } from "@/components/staff/team-manager";
import { ProjectMetaForm } from "@/components/staff/project-meta-form";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export default async function StaffProjectDetailPage({ params }: PageProps) {
  const { projectId } = await params;
  const project = await getProjectDetail(projectId).catch(() => null);
  if (!project) notFound();

  const projectFiles = await db
    .select()
    .from(files)
    .where(eq(files.projectId, project.id))
    .orderBy(desc(files.createdAt))
    .catch(() => []);

  const activity = await getProjectActivity(project.id, 25).catch(() => []);
  const notes = await getProjectNotes(project.id).catch(() => []);

  const messages = await db
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

  const progress = computeProjectProgress({
    templateSnapshot: project.templateSnapshot,
    briefs: project.briefs,
    currentMilestoneSlug: project.currentMilestoneSlug,
  });

  const milestones = project.templateSnapshot.milestoneConfig.milestones;
  const sections = project.templateSnapshot.briefStructure.sections;
  const categories = project.templateSnapshot.fileCategories.categories;
  const clientCount = project.members.filter((m) => m.user.userType === "client").length;

  return (
    <div className="px-6 py-6">
      <Link href="/staff?tab=projects" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-brand-green">
        <IconArrowLeft size={16} /> All projects
      </Link>

      <header className="mb-6 flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl text-brand-navy">{project.name}</h1>
          <p className="text-sm text-muted-foreground">
            {project.organization.name} · {project.office.name} · {project.templateSnapshot.templateName} template
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={project.status === "active" ? "success" : "muted"}>{project.status}</Badge>
          <MilestoneSelect
            projectId={project.id}
            milestones={milestones}
            current={project.currentMilestoneSlug ?? milestones[0]?.slug ?? ""}
          />
          <InviteClientButton projectId={project.id} clientCount={clientCount} />
        </div>
      </header>

      <div className="mb-4">
        <ProjectMetaForm
          projectId={project.id}
          initialTheme={project.websiteTheme ?? null}
          initialMondayItemId={project.mondayItemId ?? null}
        />
      </div>

      <div className="mb-6">
        <MilestoneBar milestones={milestones} currentIndex={progress.currentMilestoneIndex} />
        <div className="mt-3 flex items-center gap-3">
          <Progress value={progress.percent} className="h-2 flex-1" />
          <span className="text-sm font-semibold text-brand-green">{progress.percent}%</span>
        </div>
      </div>

      <div className="mb-6">
        <ProjectLinksForm
          projectId={project.id}
          initialLinks={(project.links as Record<string, string>) ?? {}}
        />
      </div>

      <Tabs defaultValue="briefs">
        <TabsList>
          <TabsTrigger value="briefs">Content briefs</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="notes">Internal notes</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="briefs" className="mt-4">
          <div className="rounded-lg border bg-white">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Section</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Updated</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sections.map((s) => {
                  const brief = project.briefs.find((b) => b.sectionSlug === s.slug);
                  return (
                    <tr key={s.slug} className="border-b last:border-b-0">
                      <td className="px-4 py-3 font-medium">{s.label}</td>
                      <td className="px-4 py-3">
                        <Badge variant={brief?.status === "submitted" || brief?.status === "complete" ? "success" : brief ? "warning" : "muted"}>
                          {brief?.status ?? "not_started"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {brief?.updatedAt ? new Date(brief.updatedAt).toLocaleString() : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {brief?.status === "submitted" && (
                          <BriefRevisionCell
                            projectId={project.id}
                            sectionSlug={s.slug}
                            sectionLabel={s.label}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="messages" className="mt-4">
          <div className="flex flex-col gap-4">
            <div className="rounded-lg border bg-white">
              {messages.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">No messages yet. Use the form below to start a conversation with your client.</p>
              ) : (
                <ul className="divide-y p-4 space-y-3">
                  {messages.map((msg) => (
                    <li
                      key={msg.id}
                      className={`flex flex-col gap-1 ${msg.isFromStaff ? "items-end" : "items-start"}`}
                    >
                      <span className="text-xs text-muted-foreground">
                        {msg.senderName} · {new Date(msg.createdAt).toLocaleString()}
                      </span>
                      <div
                        className={`max-w-[75%] rounded-lg px-4 py-2 text-sm ${
                          msg.isFromStaff
                            ? "bg-brand-navy text-white"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.body}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <StaffMessageForm projectId={project.id} />
          </div>
        </TabsContent>

        <TabsContent value="files" className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">{projectFiles.length} files</p>
            <Button variant="outline" asChild>
              <a href={`/api/projects/${project.id}/export` as never}>
                <IconFile size={14} /> Download zip export
              </a>
            </Button>
          </div>
          <div className="space-y-4">
            {categories.map((cat) => {
              const catFiles = projectFiles.filter((f) => f.category === cat.slug);
              if (catFiles.length === 0) return null;
              return (
                <div key={cat.slug} className="rounded-lg border bg-white">
                  <div className="border-b px-4 py-2 text-sm font-medium">
                    {cat.label} ({catFiles.length})
                  </div>
                  <ul className="divide-y text-sm">
                    {catFiles.map((f) => (
                      <li key={f.id} className="flex items-center justify-between gap-3 px-4 py-2">
                        <span className="truncate">{f.filename}</span>
                        <span className="flex items-center gap-2 text-xs text-muted-foreground">
                          {(f.sizeBytes / 1024).toFixed(0)} KB
                          <Badge variant={f.scanStatus === "clean" ? "success" : "warning"}>{f.scanStatus}</Badge>
                          <a href={`/api/projects/${project.id}/files/${f.id}/download` as never} className="text-brand-green hover:underline">
                            Download
                          </a>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <InternalNoteForm projectId={project.id} />
          <ul className="mt-4 space-y-2">
            {notes.length === 0 ? (
              <li className="rounded-md border bg-white p-4 text-sm text-muted-foreground">No internal notes yet.</li>
            ) : (
              notes.map((n) => (
                <li key={n.id} className="rounded-md border bg-white p-4 text-sm">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-medium">{n.authorName}</span>
                    <span className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-muted-foreground">{n.body}</p>
                </li>
              ))
            )}
          </ul>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <ul className="space-y-1 rounded-lg border bg-white p-2 text-sm">
            {activity.length === 0 ? (
              <li className="p-3 text-muted-foreground">No activity yet.</li>
            ) : (
              activity.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 rounded-md px-3 py-2 hover:bg-muted/40">
                  <div className="flex-1">
                    <span className="font-medium">{a.userName ?? "System"}</span>
                    <span className="ml-2 text-muted-foreground">{a.action.replace(/[._]/g, " ")}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</span>
                </li>
              ))
            )}
          </ul>
        </TabsContent>

        <TabsContent value="team" className="mt-4">
          <TeamManager
            projectId={project.id}
            initialMembers={project.members.map((m) => ({
              userId: m.userId,
              role: m.role as "owner" | "pm" | "designer" | "developer" | "client",
              user: {
                id: m.user.id,
                name: m.user.name,
                email: m.user.email,
                userType: m.user.userType as "staff" | "client",
              },
            }))}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
