import OpenAI from "openai";
import { NextRequest } from "next/server";

export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ANALYZE_PROMPT = `You are an expert nutritionist analyzing a photo of a meal.

Identify every food item visible in the image and provide a detailed nutritional breakdown.

Format your response EXACTLY like this:

## Identified Foods
List each food item you can see.

## Nutritional Breakdown

| Item | Calories | Protein | Carbs | Fat |
|------|----------|---------|-------|-----|
| (each item) | kcal | g | g | g |
| **TOTAL** | **kcal** | **g** | **g** | **g** |

## Portion Notes
Brief notes on the estimated portion sizes and any assumptions you made.

## Verdict
One sentence: is this meal aligned with a fat-loss / lean-gain goal? What would you change?

Be concise. Use realistic portion estimates. If you cannot identify a food clearly, state your best guess and flag the uncertainty.`;

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();

    if (!image) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const stream = await openai.chat.completions.create({
      model: "gpt-5.4",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: ANALYZE_PROMPT },
            { type: "image_url", image_url: { url: image, detail: "low" } },
          ],
        },
      ],
      stream: true,
      temperature: 0.3,
      max_completion_tokens: 1500,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content;
          if (text) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Analysis failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
