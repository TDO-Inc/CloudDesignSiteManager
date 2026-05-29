"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface DashboardTabsProps {
  defaultTab?: string;
  summaryContent: React.ReactNode;
  projectsContent: React.ReactNode;
}

const TRIGGER_CLASS =
  "rounded-none border-b-2 border-transparent px-0 pb-3 pt-0 text-sm font-normal text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:border-brand-green data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-brand-navy data-[state=active]:shadow-none";

export function DashboardTabs({
  defaultTab = "summary",
  summaryContent,
  projectsContent,
}: DashboardTabsProps) {
  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList className="mb-6 h-auto w-full justify-start gap-6 rounded-none border-b bg-transparent p-0">
        <TabsTrigger value="summary" className={TRIGGER_CLASS}>
          Summary
        </TabsTrigger>
        <TabsTrigger value="projects" className={TRIGGER_CLASS}>
          Projects
        </TabsTrigger>
        {["Clients", "Tasks", "Reports"].map((label) => (
          <span
            key={label}
            title="Coming in Phase 2"
            className="cursor-not-allowed pb-3 text-sm text-muted-foreground/50 select-none"
          >
            {label}
          </span>
        ))}
      </TabsList>
      <TabsContent value="summary" className="mt-0">
        {summaryContent}
      </TabsContent>
      <TabsContent value="projects" className="mt-0">
        {projectsContent}
      </TabsContent>
    </Tabs>
  );
}
