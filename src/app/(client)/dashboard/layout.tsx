import { redirect } from "next/navigation";
import { getCurrentClient } from "@/lib/auth/current-user";
import { getPrimaryClientProject, computeProjectProgress } from "@/lib/projects/queries";
import { ClientShell } from "@/components/client/client-shell";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentClient();
  if (!user) redirect("/sign-in");

  const project = await getPrimaryClientProject(user.id).catch(() => null);

  if (!project) {
    return (
      <ClientShell
        user={user}
        progressPercent={0}
        currentMilestoneLabel="No active project"
        currentMilestoneIndex={0}
        milestonesTotal={7}
      >
        <div className="mx-auto max-w-2xl p-10 text-center">
          <h1 className="mb-2 text-xl">No active project yet</h1>
          <p className="text-muted-foreground">
            Once your TDO team creates a project for you, it will show up here. Hang tight — they&apos;re working on it.
          </p>
        </div>
      </ClientShell>
    );
  }

  const progress = computeProjectProgress({
    templateSnapshot: project.templateSnapshot,
    briefs: project.briefs,
    currentMilestoneSlug: project.currentMilestoneSlug,
  });

  const milestones = project.templateSnapshot.milestoneConfig.milestones;
  const currentMilestone = milestones[progress.currentMilestoneIndex] ?? milestones[0];

  return (
    <ClientShell
      user={user}
      progressPercent={progress.percent}
      currentMilestoneLabel={currentMilestone?.label ?? "Kickoff"}
      currentMilestoneIndex={progress.currentMilestoneIndex}
      milestonesTotal={progress.milestonesTotal}
    >
      {children}
    </ClientShell>
  );
}
