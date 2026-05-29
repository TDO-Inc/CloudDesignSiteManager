import { cn } from "@/lib/utils/cn";

interface MilestoneBarProps {
  milestones: Array<{ slug: string; label: string; order: number }>;
  currentIndex: number;
}

export function MilestoneBar({ milestones, currentIndex }: MilestoneBarProps) {
  return (
    <div className="w-full">
      <div className="flex w-full overflow-hidden rounded-md border bg-white">
        {milestones.map((m, i) => {
          const state = i < currentIndex ? "done" : i === currentIndex ? "current" : "future";
          return (
            <div
              key={m.slug}
              className={cn(
                "flex flex-1 items-center justify-center border-r px-2 py-2 text-xs font-medium last:border-r-0",
                state === "done" && "bg-brand-green text-white",
                state === "current" && "bg-brand-green/20 text-brand-navy",
                state === "future" && "bg-white text-muted-foreground",
              )}
            >
              <span className="truncate">{m.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
