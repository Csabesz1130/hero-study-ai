import { NextResponse } from "next/server";
import { db } from "@/db/production";
import { analyticsEvents } from "@/db/schema";
import { Configuration, OpenAIApi } from "openai";

const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
}));

export async function POST(request: Request) {
  const { userId } = await request.json();
  if (!userId) {
    return NextResponse.json({ error: "userId kötelező!" }, { status: 400 });
  }

  // Lekérjük az analitikai eseményeket
  const events = await db.select().from(analyticsEvents).where(analyticsEvents.userId.eq(userId));

  // Az eseményekből szöveges promptot készítünk
  const eventText = events.map(e => `Típus: ${e.type}, Adat: ${JSON.stringify(e.data)}, Idő: ${e.timestamp}`).join("\n");

  const prompt = `Tanulói analitika események:\n${eventText}\n\nAzonosítsd, hogy a tanulónál milyen tudáshiány vagy elakadás várható, és milyen beavatkozás lenne hasznos. Válaszolj JSON formátumban, pl.: [{\"gapType\":\"quiz_mistake\",\"confidence\":0.8,\"suggestion\":\"Ismétlő kvíz ajánlása\"}]`;

  // OpenAI GPT hívás
  const completion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: "Te egy tanulási analitika AI vagy." },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
    max_tokens: 400,
  });

  // Válasz feldolgozása
  const text = completion.data.choices[0].message?.content || "[]";
  let predictedGaps = [];
  try {
    predictedGaps = JSON.parse(text);
  } catch {
    predictedGaps = [{ gapType: "parse_error", confidence: 0, suggestion: text }];
  }

  return NextResponse.json({ predictedGaps });
} 