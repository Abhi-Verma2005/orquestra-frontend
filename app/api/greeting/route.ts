import { generateObject } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

import { openaiFlashModel } from "../../../ai";

const QuerySchema = z.object({
  bucket: z.enum(["morning", "afternoon", "evening", "night"]).optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = QuerySchema.safeParse({ bucket: searchParams.get("bucket") || undefined });

    const hour = new Date().getHours();
    const timeBucket = parsed.success
      ? parsed.data.bucket
      : hour >= 5 && hour < 12
      ? "morning"
      : hour >= 12 && hour < 17
      ? "afternoon"
      : hour >= 17 && hour < 21
      ? "evening"
      : "night";

    const { object } = await generateObject({
      model: openaiFlashModel,
      schema: z.object({ 
        greeting: z.string(),
        subtitle: z.string()
      }),
      prompt: `You are crafting a compact hero heading for an AI-powered chat application.
Return two fields:
- greeting: a creative, brand-friendly THREE-WORD title (Title Case, no punctuation/emojis) tuned for time bucket ${timeBucket}, emphasizing "AI" and "Chat".
- subtitle: a concise 6-10 word supporting line that highlights AI-powered conversations and smart assistance.
Keep both friendly, welcoming, and clearly focused on AI assistance.`,
      temperature: 0.7,
    });

    let greeting = object.greeting.trim();
    let subtitle = (object.subtitle || "").trim();

    // Minimal guardrails
    if (greeting.split(/\s+/).length !== 3) {
      greeting =
        timeBucket === "morning"
          ? "Good Morning Chat"
          : timeBucket === "afternoon"
          ? "Afternoon Conversations"
          : timeBucket === "evening"
          ? "Evening Chat Time"
          : "Night Chat Session";
    }
    if (!subtitle || subtitle.length < 6) {
      subtitle = "Start a conversation and connect with others";
    }

    return NextResponse.json({ greeting, subtitle });
  } catch (error) {
    return NextResponse.json(
      { greeting: "Welcome To Chat", subtitle: "Start a conversation and connect with others" },
      { status: 200 }
    );
  }
}


