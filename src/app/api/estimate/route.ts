import OpenAI from "openai";
import { NextRequest } from "next/server";

export const maxDuration = 30;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const PROMPT = `You are a nutrition calculator. The user describes a meal in plain text. Return ONLY a JSON object with these fields — nothing else, no markdown, no explanation:
{"label":"short name","calories":number,"protein":number,"carbs":number,"fat":number}
Use realistic estimates for typical portion sizes. All numbers should be integers or one-decimal floats.`;

export async function POST(req: NextRequest) {
  try {
    const { description } = await req.json();
    if (!description) {
      return new Response(JSON.stringify({ error: "No description" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const res = await openai.chat.completions.create({
      model: "gpt-5.4",
      messages: [
        { role: "system", content: PROMPT },
        { role: "user", content: description },
      ],
      temperature: 0.2,
      max_completion_tokens: 200,
    });

    const raw = res.choices[0]?.message?.content?.trim() ?? "";
    const json = JSON.parse(raw);
    return new Response(JSON.stringify(json), { headers: { "Content-Type": "application/json" } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Estimation failed";
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
