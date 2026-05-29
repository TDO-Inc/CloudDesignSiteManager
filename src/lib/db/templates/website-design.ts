/**
 * Website Design service-type templates — milestones, file categories, and
 * brief structures sourced directly from `website-templates.md`.
 *
 * Two templates ship in V1:
 *   - "Basic"     — 5-page site, mostly boilerplate, minimal client content
 *   - "Standard"  — fully customized, all sections, full photo shoot
 */

import type {
  BriefStructure,
  FileCategoryConfig,
  MilestoneConfig,
  TemplateDefaultSettings,
} from "../schema";

/* ----------------------------- Milestones ---------------------------- */

export const websiteMilestones: MilestoneConfig = {
  milestones: [
    {
      slug: "kickoff",
      label: "Kickoff",
      description:
        "Contract won, initial setup complete. Kickoff call scheduled, domain request form submitted, content collection begins.",
      order: 1,
      badge_color: "#EEEDFE", // purple
    },
    {
      slug: "content_collection",
      label: "Content collection",
      description:
        "Office provides photos, copy, and brand assets. Content briefs filled out, logos and photos uploaded.",
      order: 2,
      badge_color: "#FAEEDA", // amber
    },
    {
      slug: "round_1_review",
      label: "Round 1 review",
      description:
        "Full site built, presented to office. Staff reviews with office, collects feedback, identifies missing content.",
      order: 3,
      badge_color: "#E6F1FB", // blue
    },
    {
      slug: "revisions",
      label: "Revisions",
      description:
        "Changes applied based on Round 1 feedback. Round 2 review if needed, firm launch date set.",
      order: 4,
      badge_color: "#FBEAF0", // pink
    },
    {
      slug: "pre_launch_setup",
      label: "Pre-launch setup",
      description:
        "SEO setup (RankMath), ADA compliance review, Google Analytics, Hotjar, privacy policy.",
      order: 5,
      badge_color: "#E1F5EE", // light green
    },
    {
      slug: "training_and_approval",
      label: "Training & approval",
      description:
        "Office trained on Beaver Builder, analytics overview, SEO basics. Written launch approval received.",
      order: 6,
      badge_color: "#E1F5EE",
    },
    {
      slug: "launch",
      label: "Launch",
      description:
        "Site goes live. Domain pointed, developer pushes live, launch email sent, 6-month follow-up scheduled.",
      order: 7,
      badge_color: "#1A9E75",
    },
  ],
};

/* --------------------------- File categories ------------------------- */

export const websiteFileCategories: FileCategoryConfig = {
  categories: [
    {
      slug: "logo_branding",
      label: "Logo & branding",
      description: "Office logo files, brand colors, fonts, brand guidelines.",
      accept: ["image/*", "application/pdf", ".ai", ".eps", ".psd"],
      multiple: true,
    },
    {
      slug: "doctor_photos",
      label: "Doctor photos",
      description:
        "Individual headshots of each doctor. Portrait orientation, professional.",
      accept: ["image/*"],
      multiple: true,
    },
    {
      slug: "staff_photos",
      label: "Staff photos",
      description:
        "Individual and group staff photos. Portrait for individuals, landscape for groups.",
      accept: ["image/*"],
      multiple: true,
    },
    {
      slug: "office_exterior",
      label: "Office photos — exterior",
      description: "Outside of the office — so patients recognize the building.",
      accept: ["image/*"],
      multiple: true,
    },
    {
      slug: "office_waiting_room",
      label: "Office photos — waiting room",
      description:
        "Patient waiting area. Empty AND with doctor/staff greeting a patient.",
      accept: ["image/*"],
      multiple: true,
    },
    {
      slug: "office_front_desk",
      label: "Office photos — front desk",
      description: "Front desk area. Empty AND with smiling front office staff.",
      accept: ["image/*"],
      multiple: true,
    },
    {
      slug: "office_hallways",
      label: "Office photos — hallways",
      description:
        "Hallway / corridor shots, used as background images on the site.",
      accept: ["image/*"],
      multiple: true,
    },
    {
      slug: "office_operatory",
      label: "Office photos — operatory",
      description:
        "Treatment room photos. Empty operatory, doctor at microscope, in-treatment photo.",
      accept: ["image/*"],
      multiple: true,
    },
    {
      slug: "equipment_photos",
      label: "Equipment photos",
      description:
        "Close-ups of technology / equipment (CBCT, ASI cart, microscope, GentleWave, etc.).",
      accept: ["image/*"],
      multiple: true,
    },
    {
      slug: "other_photos",
      label: "Other photos",
      description: "Community involvement, office events, etc.",
      accept: ["image/*"],
      multiple: true,
    },
    {
      slug: "documents",
      label: "Documents",
      description:
        "Insurance list, fee schedules, post-op instructions, privacy policy.",
      accept: ["application/pdf", ".doc", ".docx", ".txt"],
      multiple: true,
    },
  ],
};

/* --------------------------- Default settings ------------------------ */

export const websiteDefaultSettings: TemplateDefaultSettings = {
  links: [
    { key: "staging_url", label: "Staging URL" },
    { key: "production_url", label: "Production URL" },
    { key: "domain_request_url", label: "Domain request form" },
  ],
  reminderDays: 7,
};

/* ----------------------------- Brief fields -------------------------- */

import type { BriefSection } from "../schema";

/** Shared "Office details" section — used by both templates. */
const officeDetailsSection: BriefSection = {
  slug: "office_details",
  label: "Office details",
  description: "Name, address, phone, hours, email.",
  icon: "building",
  required: true,
  fields: [
    { key: "office_name", label: "Office name", type: "short_text", required: true },
    { key: "address_street", label: "Street address", type: "short_text", required: true },
    { key: "address_city", label: "City", type: "short_text", required: true },
    { key: "address_state", label: "State", type: "short_text", required: true },
    { key: "address_zip", label: "ZIP code", type: "short_text", required: true },
    { key: "phone", label: "Phone", type: "phone", required: true },
    { key: "fax", label: "Fax", type: "phone" },
    { key: "email", label: "Office email", type: "email", required: true },
    {
      key: "hours",
      label: "Office hours",
      type: "long_text",
      help: "One line per day (e.g., Mon 8:00–5:00).",
    },
    {
      key: "after_hours_emergency",
      label: "After-hours / emergency info",
      type: "long_text",
    },
    {
      key: "map_notes",
      label: "Map / directions notes",
      type: "long_text",
      help: "Optional landmarks, parking notes, etc.",
    },
    {
      key: "contact_form_prefs",
      label: "Contact form preferences",
      type: "long_text",
    },
  ],
};

const homePageSection: BriefSection = {
  slug: "home",
  label: "Home page",
  description: "Tagline, welcome message, key differentiators, primary CTA.",
  icon: "home",
  required: true,
  fields: [
    { key: "tagline", label: "Practice tagline / headline", type: "short_text" },
    { key: "welcome_message", label: "Welcome message", type: "long_text" },
    {
      key: "differentiators",
      label: "Key differentiators (3–4 bullet points)",
      type: "long_text",
      help: "What sets the practice apart? One bullet per line.",
    },
    { key: "primary_cta", label: "Preferred call-to-action", type: "short_text" },
  ],
};

const doctorBiosSection: BriefSection = {
  slug: "doctor_bios",
  label: "Doctor bios",
  description: "Name, credentials, bio, education, memberships, headshot.",
  icon: "stethoscope",
  required: true,
  fields: [
    {
      key: "doctors",
      label: "Doctors",
      type: "structured_list",
      help: "Add a row for each doctor.",
      itemSchema: [
        { key: "full_name", label: "Full name", type: "short_text", required: true },
        { key: "credentials", label: "Credentials / degrees", type: "short_text" },
        { key: "bio", label: "Bio", type: "long_text" },
        { key: "education", label: "Education", type: "long_text" },
        { key: "memberships", label: "Professional memberships", type: "long_text" },
        { key: "specialties", label: "Specialties", type: "long_text" },
        { key: "personal_interests", label: "Personal interests", type: "long_text" },
      ],
    },
  ],
};

const teamSection: BriefSection = {
  slug: "team",
  label: "Meet the team",
  description: "Names, roles, optional bios and photos.",
  icon: "users",
  fields: [
    {
      key: "team_members",
      label: "Team members",
      type: "structured_list",
      itemSchema: [
        { key: "name", label: "Name", type: "short_text", required: true },
        { key: "role", label: "Role / title", type: "short_text", required: true },
        { key: "bio", label: "Bio (optional)", type: "long_text" },
      ],
    },
  ],
};

const aboutOfficeSection: BriefSection = {
  slug: "about_office",
  label: "About our office",
  description: "Office history, mission, what makes you different.",
  icon: "info-circle",
  fields: [
    { key: "history", label: "Office history / story", type: "long_text" },
    { key: "mission", label: "Mission statement", type: "long_text" },
    { key: "differentiators", label: "What makes us different", type: "long_text" },
    { key: "year_established", label: "Year established", type: "short_text" },
    { key: "community", label: "Community involvement", type: "long_text" },
  ],
};

const officeTourSection: BriefSection = {
  slug: "office_tour",
  label: "Office tour",
  description: "Captions for office areas — photos do most of the work.",
  icon: "camera",
  fields: [
    {
      key: "captions",
      label: "Captions / descriptions for office areas",
      type: "long_text",
    },
  ],
};

const patientFinancialSection: BriefSection = {
  slug: "financial_policies",
  label: "Financial policies & fees",
  description: "Payment methods, financing options, fee schedule notes.",
  icon: "credit-card",
  fields: [
    { key: "payment_methods", label: "Payment methods accepted", type: "long_text" },
    { key: "financing_options", label: "Financing options", type: "long_text" },
    { key: "fee_schedule_notes", label: "Fee schedule notes", type: "long_text" },
  ],
};

const insuranceSection: BriefSection = {
  slug: "insurance",
  label: "Insurance information",
  description: "Accepted plans, out-of-network policy, FAQ.",
  icon: "shield-check",
  fields: [
    { key: "accepted_plans", label: "Accepted insurance plans", type: "long_text" },
    { key: "out_of_network", label: "Out-of-network policy", type: "long_text" },
    { key: "insurance_faq", label: "Insurance FAQ", type: "long_text" },
  ],
};

const firstVisitSection: BriefSection = {
  slug: "first_visit",
  label: "What to expect — first visit",
  description: "Step-by-step visit description, what to bring, instructions.",
  icon: "clipboard-check",
  fields: [
    { key: "description", label: "Step-by-step first visit description", type: "long_text" },
    { key: "what_to_bring", label: "What to bring", type: "long_text" },
    { key: "estimated_duration", label: "Estimated visit duration", type: "short_text" },
    { key: "pre_visit_instructions", label: "Pre-visit instructions", type: "long_text" },
  ],
};

const comfortMenuSection: BriefSection = {
  slug: "comfort_menu",
  label: "Patient comfort menu",
  description: "Comfort options offered (headphones, blankets, sedation, etc.).",
  icon: "heart",
  fields: [
    {
      key: "comfort_options",
      label: "Comfort options offered",
      type: "long_text",
      help: "One per line.",
    },
  ],
};

const postTreatmentSection: BriefSection = {
  slug: "post_treatment",
  label: "Post-treatment instructions",
  description: "Post-op care by procedure type, emergency contact info.",
  icon: "first-aid-kit",
  fields: [
    { key: "instructions_by_procedure", label: "Post-op care by procedure type", type: "long_text" },
    { key: "emergency_contact", label: "Emergency contact info", type: "long_text" },
  ],
};

const servicesSection: BriefSection = {
  slug: "services",
  label: "Endodontic services",
  description: "Root canal, retreatment, apicoectomy, cracked teeth — and any custom services.",
  icon: "tooth",
  fields: [
    {
      key: "standard_services",
      label: "Standard services to include",
      type: "checkbox_list",
      options: [
        "Root canal treatment",
        "Root canal retreatment",
        "Apicoectomy",
        "Cracked teeth",
      ],
    },
    { key: "root_canal_notes", label: "Root canal — custom notes (or use boilerplate)", type: "long_text" },
    { key: "retreatment_notes", label: "Retreatment — custom notes", type: "long_text" },
    { key: "apicoectomy_notes", label: "Apicoectomy — custom notes", type: "long_text" },
    { key: "cracked_teeth_notes", label: "Cracked teeth — custom notes", type: "long_text" },
    {
      key: "custom_services",
      label: "Additional services beyond the standard four",
      type: "structured_list",
      itemSchema: [
        { key: "title", label: "Service name", type: "short_text", required: true },
        { key: "description", label: "Description", type: "long_text", required: true },
      ],
    },
  ],
};

const technologySection: BriefSection = {
  slug: "technology",
  label: "Technology",
  description: "Selected technology and equipment featured on the site.",
  icon: "device-desktop",
  fields: [
    {
      key: "technologies",
      label: "Technologies to feature",
      type: "checkbox_list",
      options: [
        "Digital radiography",
        "CBCT (Cone Beam CT)",
        "Surgical operating microscope",
        "TDO Software",
        "GentleWave",
        "EdgePro Laser",
      ],
    },
    {
      key: "tech_notes",
      label: "Custom notes per technology (or use boilerplate)",
      type: "long_text",
    },
    {
      key: "custom_technologies",
      label: "Custom / unlisted technology",
      type: "structured_list",
      itemSchema: [
        { key: "name", label: "Technology name", type: "short_text", required: true },
        { key: "description", label: "Description", type: "long_text", required: true },
      ],
    },
  ],
};

const testimonialsSection: BriefSection = {
  slug: "testimonials",
  label: "Testimonials & reviews",
  description: "Review links and selected quotes (with patient permission).",
  icon: "star",
  fields: [
    { key: "google_reviews_url", label: "Google reviews link", type: "url" },
    { key: "yelp_reviews_url", label: "Yelp reviews link", type: "url" },
    {
      key: "selected_quotes",
      label: "Selected testimonial quotes",
      type: "long_text",
      help: "Confirm patient permission to publish each quote.",
    },
    { key: "platform_prefs", label: "Review platform preferences", type: "long_text" },
  ],
};

/** Logo / branding info that's not a file upload (colors, fonts). */
const brandingSection: BriefSection = {
  slug: "branding",
  label: "Logo & branding",
  description: "Brand colors, fonts, style notes. Upload logo files separately under Photos & Files.",
  icon: "palette",
  required: true,
  fields: [
    { key: "brand_colors", label: "Brand colors", type: "long_text", help: "Hex codes if you have them." },
    { key: "brand_fonts", label: "Brand fonts", type: "long_text" },
    { key: "style_notes", label: "Style notes / must-include items", type: "long_text" },
  ],
};

/* ----------------------------- Templates ----------------------------- */

/**
 * BASIC — Office stays close to the standard template.
 * Boilerplate text + stock imagery for most pages. Office provides only the
 * essentials.
 */
export const basicBriefStructure: BriefStructure = {
  sections: [
    officeDetailsSection,
    brandingSection,
    {
      ...doctorBiosSection,
      description:
        "Name, credentials, headshot, short bio per doctor. Bio can be short — boilerplate fills in the rest.",
    },
    homePageSection,
    {
      slug: "must_include",
      label: "Messaging preferences",
      description: "Any specific messaging or 'must include' items.",
      icon: "message-circle",
      fields: [
        {
          key: "must_include",
          label: "Anything we must mention",
          type: "long_text",
        },
        {
          key: "tone",
          label: "Preferred tone (warm, clinical, modern, etc.)",
          type: "short_text",
        },
      ],
    },
    {
      ...technologySection,
      description: "Check the technologies you have — we'll use boilerplate descriptions unless you supply your own.",
    },
  ],
};

/**
 * STANDARD — Fully customized site, all sections, custom content for each.
 */
export const standardBriefStructure: BriefStructure = {
  sections: [
    officeDetailsSection,
    brandingSection,
    homePageSection,
    aboutOfficeSection,
    doctorBiosSection,
    teamSection,
    officeTourSection,
    patientFinancialSection,
    insuranceSection,
    firstVisitSection,
    comfortMenuSection,
    postTreatmentSection,
    servicesSection,
    technologySection,
    testimonialsSection,
  ],
};

export const websiteTemplates = [
  {
    name: "Basic",
    description:
      "Office stays close to the standard template. Uses TDO boilerplate text and stock imagery for most pages. Office provides only essential custom content (default pages: Home, About Our Office, Meet the Doctor(s), Root Canal Treatment, Technology, Contact).",
    briefStructure: basicBriefStructure,
  },
  {
    name: "Standard",
    description:
      "Fully customized site. Office selects pages and provides custom content for each. Full photo shoot recommended.",
    briefStructure: standardBriefStructure,
  },
] as const;
