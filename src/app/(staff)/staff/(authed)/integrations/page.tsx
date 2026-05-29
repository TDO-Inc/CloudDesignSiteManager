import { IconPlug } from "@tabler/icons-react";

const PLANNED = [
  {
    name: "HubSpot",
    description:
      'When a Web Design deal is marked Closed-Won in HubSpot, automatically create a portal project, assign your team, and send the client invite.',
    status: "Phase 2",
  },
  {
    name: "monday.com",
    description:
      "Sync project milestone changes from the portal to your Web Design board on monday.com — keep project managers in the loop without manual updates.",
    status: "Phase 2",
  },
  {
    name: "Slack",
    description:
      "Receive Slack notifications when a client submits a content brief, uploads files, or sends a message.",
    status: "Phase 2",
  },
];

export default function IntegrationsPage() {
  return (
    <div className="px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl text-brand-navy">Integrations</h1>
        <p className="text-sm text-muted-foreground">
          Connect the portal to your existing tools
        </p>
      </div>

      <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Integrations are planned for Phase 2. Webhook endpoints are already built into the portal
        and ready for Zapier/Make to connect to.
      </div>

      <div className="space-y-3">
        {PLANNED.map((integration) => (
          <div
            key={integration.name}
            className="flex items-start gap-4 rounded-lg border bg-white p-4"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
              <IconPlug size={18} className="text-muted-foreground" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-brand-navy">{integration.name}</p>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {integration.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{integration.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
