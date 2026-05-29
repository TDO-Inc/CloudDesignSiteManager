/**
 * POST /api/ai/chat
 *
 * AI assistant for the client portal. Searches the knowledge base for
 * relevant articles and injects them into the system prompt before calling
 * Claude. Requires ANTHROPIC_API_KEY; returns a graceful message if unset.
 */

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { getCurrentClient, getCurrentStaff } from "@/lib/auth/current-user";
import { searchKb, formatKbContext } from "@/lib/ai/kb-search";

export const runtime = "nodejs";

const schema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(20),
});

const BASE_SYSTEM_PROMPT = `You are a friendly AI assistant built into the TDO Software Client Portal. You help dental and endodontic office clients gather and organize content for their new website.

Your role:
- Help clients understand what content they need to provide (copy, photos, bios, etc.)
- Help them write or improve their content — office descriptions, doctor bios, service descriptions, taglines
- Guide them to the right section when they're not sure where something belongs
- Answer questions about the website process in plain language
- Be encouraging and patient — many clients aren't sure what to provide

Keep responses concise and practical. Use plain language, not technical jargon. If a client shares draft content, help them refine it rather than rewriting it completely. When suggesting edits, explain why briefly.

When knowledge base articles are provided below, draw on them to give accurate, TDO-specific answers.`;

export async function POST(req: Request) {
  const client = await getCurrentClient();
  const staff = await getCurrentStaff();
  if (!client && !staff) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      content:
        "The AI assistant isn't configured yet — ask your TDO team to add the API key. In the meantime, feel free to use the content sections and reach out to your project manager directly.",
    });
  }

  // Use the last user message as the KB search query.
  const lastUserMessage = [...parsed.data.messages]
    .reverse()
    .find((m) => m.role === "user")?.content ?? "";

  const kbArticles = await searchKb(lastUserMessage, 4);
  const kbContext = formatKbContext(kbArticles);
  const systemPrompt = BASE_SYSTEM_PROMPT + kbContext;

  try {
    const anthropic = new Anthropic({ apiKey });
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      system: systemPrompt,
      messages: parsed.data.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const content =
      message.content[0]?.type === "text"
        ? message.content[0].text
        : "Sorry, something went wrong. Please try again.";

    return NextResponse.json({ content });
  } catch (err) {
    console.error("[ai/chat]", err);
    return NextResponse.json(
      { content: "Something went wrong. Please try again in a moment." },
      { status: 500 },
    );
  }
}
