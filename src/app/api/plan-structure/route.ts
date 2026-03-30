import OpenAI from "openai";
import { NextRequest } from "next/server";

const SYSTEM_PROMPT = `Convert diet plan markdown into compact JSON for UI rendering.
Return JSON only with this exact shape:
{
  "intro": "string",
  "days": [
    {
      "day": "Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday",
      "title": "short day title",
      "summary": "1-2 sentence summary",
      "meals": ["meal item", "meal item"]
    }
  ]
}
Rules:
- Include only valid weekdays.
- Keep meal entries concise.
- If a day section is missing, omit that day.
- No markdown, no extra keys.`;

export async function POST(req: NextRequest) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const { content } = await req.json();

    if (!content || typeof content !== "string") {
      return new Response(JSON.stringify({ error: "Missing plan content." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const completion = await openai.chat.completions.create({
      model: "fpt-5.4-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content },
      ],
      temperature: 0.2,
      max_completion_tokens: 1200,
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content || "{}");

    return new Response(JSON.stringify(parsed), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to extract plan.";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
