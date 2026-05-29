import Link from "next/link";
import {
  IconSparkles,
  IconBook,
  IconMessageCircle,
  IconHelpCircle,
  IconExternalLink,
  IconClock,
  IconEdit,
  IconPhoto,
  IconUser,
} from "@tabler/icons-react";

export const metadata = { title: "Help center · TDO Client Portal" };

const faqs = [
  {
    q: "How long will my project take?",
    a: "Most website projects take 6–12 weeks from start to launch. The biggest factor is how quickly content gets submitted — the faster you fill out the sections, the sooner your site goes live.",
    icon: IconClock,
  },
  {
    q: "What if I don't know what to write?",
    a: "Use the AI assistant (the sparkles button in the top bar) — describe what you do in plain language and it can help you shape it into polished copy. You can also send rough notes or bullet points; your PM can work with whatever you have.",
    icon: IconEdit,
  },
  {
    q: "Can I change something I already submitted?",
    a: "Yes — go back to any section and edit it at any time. Your changes save automatically as you type. Re-submit when you're happy with the updated content.",
    icon: IconEdit,
  },
  {
    q: "What photos do I need?",
    a: "At minimum: professional headshots of each doctor/provider, interior and exterior office photos, and your practice logo (vector format preferred). Check the Photos & Files section for a full list of categories.",
    icon: IconPhoto,
  },
  {
    q: "Who should I contact if something is wrong?",
    a: "Use the Messages section to reach your TDO project manager directly. We typically respond within one business day. For urgent matters, reply to any email you've received from us.",
    icon: IconUser,
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <header className="mb-8">
        <h1 className="text-2xl text-brand-navy">Help center</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything you need to get the most out of your TDO Client Portal.
        </p>
      </header>

      <div className="space-y-6">
        {/* AI Assistant */}
        <div className="rounded-lg border bg-white p-6">
          <div className="mb-3 flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-brand-green/10 text-brand-green">
              <IconSparkles size={20} />
            </div>
            <h2 className="text-base font-semibold text-brand-navy">AI assistant</h2>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            The <strong>AI assistant</strong> button (sparkles icon) in the top bar opens a chat panel
            that can help you write content, answer questions about the portal, and guide you through
            the submission process.
          </p>
          <p className="mb-2 text-sm font-medium text-brand-navy">Try asking it:</p>
          <ul className="space-y-1.5">
            {[
              "Help me write a bio for Dr. Smith",
              "What photos do I need to upload?",
              "What should I write for the services section?",
              "How do I describe our office culture?",
            ].map((prompt) => (
              <li key={prompt} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-green" />
                &ldquo;{prompt}&rdquo;
              </li>
            ))}
          </ul>
        </div>

        {/* Training */}
        <div className="rounded-lg border bg-white p-6">
          <div className="mb-3 flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-brand-green/10 text-brand-green">
              <IconBook size={20} />
            </div>
            <h2 className="text-base font-semibold text-brand-navy">Training videos</h2>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            Watch our step-by-step training course to learn how the portal works and how to get the
            most out of your website project.
          </p>
          <a
            href="https://lms.tdos.dental/courses/8"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-white hover:bg-brand-green/90"
          >
            Open training course
            <IconExternalLink size={14} />
          </a>
        </div>

        {/* Contact PM */}
        <div className="rounded-lg border bg-white p-6">
          <div className="mb-3 flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-brand-green/10 text-brand-green">
              <IconMessageCircle size={20} />
            </div>
            <h2 className="text-base font-semibold text-brand-navy">Contact your project manager</h2>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            Your TDO project manager is your primary point of contact throughout the project. Use
            the Messages section to ask questions, share notes, or get feedback.
          </p>
          <Link
            href={"/dashboard/messages" as never}
            className="inline-flex items-center gap-1.5 rounded-md border border-brand-green px-4 py-2 text-sm font-medium text-brand-green hover:bg-brand-green/5"
          >
            <IconMessageCircle size={14} />
            Open Messages
          </Link>
        </div>

        {/* FAQs */}
        <div className="rounded-lg border bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-brand-green/10 text-brand-green">
              <IconHelpCircle size={20} />
            </div>
            <h2 className="text-base font-semibold text-brand-navy">Common questions</h2>
          </div>
          <div className="space-y-5">
            {faqs.map(({ q, a, icon: Icon }) => (
              <div key={q}>
                <div className="mb-1.5 flex items-start gap-2">
                  <Icon size={16} className="mt-0.5 shrink-0 text-brand-green" />
                  <p className="text-sm font-semibold text-brand-navy">{q}</p>
                </div>
                <p className="pl-6 text-sm text-muted-foreground">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
