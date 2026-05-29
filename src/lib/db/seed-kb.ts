/**
 * Knowledge base seed — initial articles for the AI assistant.
 *
 * Run with: npm run db:seed-kb
 *
 * Idempotent: articles with the same title are skipped (updated instead).
 * Safe to re-run after editing articles below.
 */

import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { kbArticles, users } from "./schema";

// ---------------------------------------------------------------------------
// Articles
// ---------------------------------------------------------------------------

interface ArticleDef {
  title: string;
  category: string;
  tags: string[];
  content: string;
}

const ARTICLES: ArticleDef[] = [
  // ─── TDO Process & Milestones ───────────────────────────────────────────
  {
    title: "How the Website Project Works — Overview",
    category: "process",
    tags: ["milestones", "overview", "timeline", "process"],
    content: `
# How Your Website Project Works

Your TDO website project moves through a series of milestones. Here's the typical flow:

1. **Kickoff** — Your TDO project manager introduces the portal and what you'll need to provide. You'll get access to this client portal where you'll submit all your content.

2. **Content Collection** — This is where you spend most of your time. You'll fill in content briefs for each page of your site and upload photos. You can work on sections in any order — there's no required sequence.

3. **Design & Build** — Once we have enough content, your TDO designer starts building your site. You don't need to wait until everything is submitted — we can start with what you have.

4. **Review** — Your project manager will share a preview link here in the portal. You review the site and send feedback.

5. **Revisions** — TDO makes revisions based on your feedback.

6. **Launch** — Your site goes live!

**How long does it take?** The biggest factor is how quickly you can get us content. Most projects take 6–12 weeks total, but clients who submit content promptly often finish faster.

**Questions?** Use the AI assistant (sparkles icon in the top bar) or message your project manager directly.
`.trim(),
  },

  {
    title: "What Happens After You Submit a Content Section",
    category: "process",
    tags: ["review", "submission", "workflow", "status"],
    content: `
# What Happens After You Submit Content

When you mark a content section as "submitted":

1. **Your TDO project manager is notified.** They'll review what you sent within 1–2 business days.

2. **Status changes.** The section status updates from "in progress" to "submitted." Once reviewed, it becomes "complete" (approved) or "needs revision" (feedback sent).

3. **We start building.** We don't wait for every section before beginning. As soon as core sections are in, design work starts.

**What if I want to change something I already submitted?**
Go back into the section and edit it — you can update content at any time before launch. Just re-submit when you're done.

**What if a section needs revision?**
Your project manager will leave a note explaining what's needed. Update the content and re-submit.
`.trim(),
  },

  {
    title: "Your Project Manager — Who to Contact and When",
    category: "process",
    tags: ["contact", "project manager", "questions", "support"],
    content: `
# Your Project Manager

Your TDO project manager is your main point of contact throughout the website project.

**Contact them when:**
- You have questions about the project timeline
- You're unsure what to include in a specific section
- You have design feedback or special requests
- Something isn't working in the portal

**How to reach them:**
- Use the Messages section in the left navigation
- Email them directly (they'll share their contact info at kickoff)

**Response time:** Business days, typically within 24 hours.

**The AI assistant** (sparkles icon, top bar) can answer many common questions instantly — great for "what should I write here?" or "what photos do I need?" type questions. For project-specific decisions, message your PM.
`.trim(),
  },

  // ─── Content Requirements ────────────────────────────────────────────────
  {
    title: "Homepage Content — What to Provide",
    category: "content_requirements",
    tags: ["homepage", "hero", "tagline", "intro", "services"],
    content: `
# Homepage Content Requirements

The homepage is your most important page. Here's what we need:

## Practice Name & Tagline
Your official practice name and a short tagline (1–2 sentences) that describes what makes your practice special. Example: "Advanced endodontic care with a gentle touch."

## Hero Section
A short headline (5–10 words) and 1–2 sentences of supporting text. Think of it as your first impression — what do you want new patients to feel when they land on your site?

## Welcome / Introduction
2–4 paragraphs introducing your practice. Cover:
- Who you are and what you specialize in
- The experience you provide patients
- Why patients choose you

## Services Overview
A brief list of the main services you offer (just names — the detail goes on the Services page). Most endodontic practices include: root canal therapy, retreatment, apicoectomy, dental trauma, and emergency care.

## Call to Action
What do you want visitors to do? (Schedule an appointment, call us, request a consultation, etc.)

## Social Proof (optional but recommended)
2–3 short patient testimonials or a note about how many patients you've treated.
`.trim(),
  },

  {
    title: "About / Meet the Doctor — What to Provide",
    category: "content_requirements",
    tags: ["about", "doctor bio", "biography", "team", "credentials"],
    content: `
# About Page & Doctor Bio Requirements

## Doctor Bio
Each doctor should provide:

- **Full name and credentials** (e.g., Dr. Sarah Chen, DMD, MS)
- **Dental school and graduation year**
- **Specialty training / residency** (where, what program, year)
- **Board certifications** (if applicable)
- **Professional memberships** (AAE, ADA, state dental association, etc.)
- **Years in practice / years at this practice**
- **Special interests or focus areas** within endodontics
- **A personal note** — hobbies, family, what you love about your work. Patients connect with doctors who feel human. Even 2–3 sentences helps.

**Length:** 150–400 words per doctor. Shorter is fine — we can help expand.

## Practice History (optional)
When was the practice founded? Any milestones or history worth sharing?

## Mission Statement (optional)
1–3 sentences about your practice philosophy or patient care approach.

## Team Section (optional)
If you'd like to feature your team, provide: team member names, titles, and a brief sentence or two about each.
`.trim(),
  },

  {
    title: "Services Pages — What to Provide",
    category: "content_requirements",
    tags: ["services", "root canal", "procedures", "treatments"],
    content: `
# Services Page Content Requirements

For each service page, provide:

## Service Name
Use the patient-friendly name (e.g., "Root Canal Treatment" not "endodontic therapy").

## What Is It? (1–2 paragraphs)
Explain the procedure in plain language. Avoid heavy jargon. Think: how would you explain this to a nervous patient?

## Why Is It Needed? (1 paragraph)
What conditions or symptoms lead to this treatment?

## What to Expect (optional but helpful)
A short description of what the procedure is like, or a step-by-step overview. Helps reduce patient anxiety.

## Recovery / Aftercare (1–2 sentences)
What can patients expect afterward?

## Common services for endodontic practices:**
- Root Canal Treatment
- Root Canal Retreatment
- Apicoectomy / Endodontic Surgery
- Cracked Tooth Treatment
- Dental Trauma Care
- Emergency Endodontic Care
- Dental Implant Placement (if applicable)

You don't need to write every service from scratch — provide bullet points or notes and the AI assistant can help you draft full descriptions.
`.trim(),
  },

  {
    title: "Contact Page — What to Provide",
    category: "content_requirements",
    tags: ["contact", "address", "phone", "hours", "location", "map"],
    content: `
# Contact Page Content Requirements

## Practice Contact Information
- **Practice name** (as it should appear publicly)
- **Phone number(s)** — main line, after-hours if different
- **Fax number** (if applicable)
- **Email address** (for patient inquiries, if you want it public)
- **Physical address** (full street address, city, state, zip)
- **Suite or floor number** (if in a multi-tenant building)

## Office Hours
Provide your full weekly schedule including:
- Days open
- Hours for each day
- Any lunch closures or half-days
- Holiday hours or exceptions (can be noted as "hours may vary on holidays")

## Additional Locations
If you have multiple offices, provide the above for each location.

## Parking / Directions (optional)
Any helpful notes for patients finding you — parking availability, building entrance, landmarks.

## Referring Doctors Contact (optional)
If you have a separate referral line or email, include it here.

## Emergency Contact
Most endodontic practices list an after-hours emergency number. Include if applicable.
`.trim(),
  },

  {
    title: "Patient Information / New Patients Page — What to Provide",
    category: "content_requirements",
    tags: ["new patients", "insurance", "forms", "referrals", "first visit"],
    content: `
# New Patient / Patient Information Content

## First Visit
What should new patients expect? A brief overview of check-in, exam, and next steps helps reduce first-visit anxiety.

## Referrals
Do you see patients by referral only, or do you accept self-referrals? How does the referral process work?

## Insurance
- What insurance plans do you accept? (List them, or note "we accept most major dental insurance plans")
- Do you file claims on behalf of patients?
- Do you offer payment plans or financing? (CareCredit, etc.)

## Patient Forms
If you have digital patient intake forms, provide the URL or let us know you want a link here. If you still use paper forms, you can upload PDFs in the Files section.

## What to Bring
A brief checklist for first-time patients: insurance card, ID, referral info, list of medications, etc.

## Privacy Policy / HIPAA Notice (optional)
Some practices link their privacy notice here. If you have one, upload it in the Files section.
`.trim(),
  },

  // ─── Photo Guidelines ────────────────────────────────────────────────────
  {
    title: "Photo Requirements — Complete Guide",
    category: "photo_guidelines",
    tags: ["photos", "images", "photography", "headshot", "office photos"],
    content: `
# Photo Requirements for Your Website

Great photos make a huge difference. Here's what we need and tips for getting them right.

## Doctor Headshots (Required)
- **Format:** JPEG or PNG
- **Minimum size:** 800×800 pixels (larger is always better)
- **Background:** Solid color or clean office background
- **Attire:** Professional — white coat or business professional
- **Expression:** Friendly, approachable smile
- **Quantity:** 1–3 photos per doctor
- **Tips:** Natural light near a window works great. Avoid heavy filters.

## Office / Practice Photos (Recommended)
Photos of your physical space help patients feel comfortable before they arrive.
- Reception / waiting area
- Treatment room(s)
- Front desk area
- Exterior / building signage
- **Quantity:** 5–15 photos
- **Tips:** Shoot during daylight if possible. Clean up before shooting.

## Team Photos (Optional)
A photo of your team together, or individual photos of key staff members.

## Equipment / Technology Photos (Optional)
If you have notable technology (CBCT, microscopes, laser equipment), photos help differentiate you.

## Logo / Brand Assets (Required)
- Your practice logo in PNG format (transparent background preferred)
- Any brand colors or fonts you want us to match

## Stock Photos
If you don't have enough photos, we can supplement with licensed stock photography. Just let us know.

## What NOT to Send
- Blurry or pixelated images
- Photos taken in poor lighting
- Images with visible watermarks
- Screenshots of photos from another website
`.trim(),
  },

  {
    title: "How to Submit Photos and Files",
    category: "photo_guidelines",
    tags: ["upload", "files", "photos", "how to", "submit"],
    content: `
# How to Upload Photos and Files

Use the **Photos & Files** section in the left navigation to upload everything.

## File Categories
Files are organized into categories:
- **Doctor Photos** — headshots and professional photos of doctors
- **Office Photos** — interior and exterior photos of your practice
- **Logo & Branding** — your logo files, brand guide, color swatches
- **Patient Forms** — PDFs of intake forms, consent forms, etc.
- **Other / Miscellaneous** — anything else we might need

## Uploading Files
1. Click on the relevant category
2. Click "Upload files" and select your files
3. Files upload directly and securely

## File Size Limits
- Photos: up to 20 MB each
- PDFs: up to 10 MB each
- If a file is too large, try compressing it or contact your project manager

## Accepted Formats
- Photos: JPG, PNG, HEIC, WebP
- Documents: PDF, DOCX
- Logos: PNG, SVG, AI, EPS

## Sending Multiple Files
You can select multiple files at once. For large batches (20+ photos), it may be easiest to send them to your project manager via email or a shared Google Drive folder.

## After Uploading
Your project manager is notified automatically. You don't need to do anything else.
`.trim(),
  },

  // ─── Client FAQs ────────────────────────────────────────────────────────
  {
    title: "FAQ — How Long Will My Website Take?",
    category: "faq",
    tags: ["timeline", "timeline", "how long", "launch date", "schedule"],
    content: `
# How Long Will My Website Take?

The timeline depends primarily on **how quickly you can provide content**.

## Typical Timeline
- **6–8 weeks** if content is submitted promptly within the first 2–3 weeks
- **10–14 weeks** for the average project
- **16+ weeks** if content submission is delayed

## What You Control
The biggest factor is you. Projects stall most often when:
- Doctor bio and headshots aren't ready
- Content briefs sit unfinished for weeks
- Back-and-forth on revisions takes longer than expected

## What TDO Controls
Once we have your content, design and build typically takes 2–4 weeks. We start as soon as we have core sections — we don't wait for everything.

## How to Move Faster
- **Prioritize the homepage and About page** — those unblock design
- **Use the AI assistant** to help write content quickly (sparkles icon, top bar)
- **Photos matter most** — send them as early as possible
- **Don't aim for perfect** — rough notes are fine, we can help refine

## Setting a Target Launch Date
If you have a specific date in mind (grand opening, office anniversary, etc.), tell your project manager right away — they'll adjust priorities to hit it.
`.trim(),
  },

  {
    title: "FAQ — What If I Don't Know What to Write?",
    category: "faq",
    tags: ["writing", "content", "help", "tips", "writer's block", "ai assistant"],
    content: `
# What If I Don't Know What to Write?

You're not alone — most clients find writing website content harder than expected. Here's how to get unstuck.

## Use the AI Assistant
The AI assistant (sparkles icon, top bar) is built specifically to help you with this. Try:
- "Help me write a bio for Dr. Patel who graduated from UCLA and specializes in trauma cases"
- "What should I say on my homepage hero section?"
- "Can you help me describe root canal treatment in patient-friendly language?"

The AI will ask follow-up questions or draft content for you to edit.

## Start with Bullet Points
You don't need to write in paragraphs. Just jot down:
- The key facts
- What you want patients to know
- What makes your practice different

We (and the AI) can turn bullet points into polished copy.

## Repurpose What You Already Have
Check if you have:
- An existing website (we can reference it for content)
- A practice brochure or handout
- A bio you've used for referral directories
- A script you use to introduce the practice to patients

## Talk It Out
Some people find it easier to record a voice memo or video answering questions about their practice, then transcribe it. It comes out much more natural.

## Ask Your Team
Your front desk staff often knows exactly what patients ask and what matters to them. Great source for FAQ content and testimonials.
`.trim(),
  },

  {
    title: "FAQ — Do I Need to Complete Everything Before the Site Can Launch?",
    category: "faq",
    tags: ["launch", "minimum", "required", "optional", "sections"],
    content: `
# Do I Need to Complete Everything Before Launch?

No — you don't need every section complete to launch your site.

## What's Required for Launch
At minimum, we need:
- **Homepage** — headline, intro text, call to action
- **About / Doctor bio** — at least one doctor bio
- **Contact information** — address, phone, hours
- **Logo** — your practice logo

## What Can Come After Launch
Many sections can be added or improved after launch:
- Additional service pages
- Team bios
- Patient forms
- Blog posts
- Testimonials

We can launch with placeholder pages and fill them in later.

## Recommended (Not Required)
- Services pages — helps SEO and patient education
- New patient information — reduces front-desk calls
- Photo gallery

## The Goal
Launch a solid site on time, then improve it. A live site is always better than a perfect site that's still "in progress."

If you're close to ready but missing a few things, talk to your project manager — they can often work around gaps.
`.trim(),
  },

  {
    title: "FAQ — Can I See My Site Before It Goes Live?",
    category: "faq",
    tags: ["preview", "review", "staging", "approve", "sign off"],
    content: `
# Can I See My Site Before It Goes Live?

Yes — absolutely.

## The Preview Link
Once your TDO designer has a draft ready, your project manager will add a preview link to your portal. You'll find it under **Preview Site** in the left navigation.

The preview shows your site exactly as it will look when live. You can click around, check all pages, and view it on your phone.

## How to Give Feedback
When you review the preview:
1. Make notes of anything you want changed
2. Go to the relevant content section and update it, or
3. Use the Messages section to send feedback to your project manager
4. You can also ask the AI assistant to help you draft revision notes

## What Can Be Changed at Preview Stage
Almost anything — copy, photos, layout requests, color adjustments. We want you to be happy with the result.

## Sign-Off
Before launching, your project manager will ask you to confirm the site is ready. Once you give the go-ahead, we schedule the launch.

## After Launch
Minor edits can still be made after launch — TDO manages your site content as part of your service.
`.trim(),
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("Seeding knowledge base articles…\n");

  // Find any staff user to use as the author
  const adminUser = await db.query.users.findFirst({
    where: eq(users.userType, "staff"),
  });

  if (!adminUser) {
    console.error("No staff user found — run npm run db:seed first.");
    process.exit(1);
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const article of ARTICLES) {
    const existing = await db.query.kbArticles.findFirst({
      where: eq(kbArticles.title, article.title),
    });

    if (existing) {
      // Update content in case it changed
      await db
        .update(kbArticles)
        .set({
          content: article.content,
          category: article.category,
          tags: article.tags,
          active: true,
          updatedAt: new Date(),
        })
        .where(eq(kbArticles.id, existing.id));
      console.log(`  ↺ updated: "${article.title}"`);
      updated++;
    } else {
      await db.insert(kbArticles).values({
        title: article.title,
        content: article.content,
        category: article.category,
        tags: article.tags,
        active: true,
        createdByUserId: adminUser.id,
      });
      console.log(`  + created: "${article.title}"`);
      created++;
    }
  }

  console.log(`\nDone. ${created} created, ${updated} updated, ${skipped} skipped.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
