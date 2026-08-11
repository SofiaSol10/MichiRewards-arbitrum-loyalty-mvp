import { NextResponse } from "next/server";
import { MissingGeminiKeyError, generateStructuredJson } from "~~/services/ai/geminiClient";
import { CONSUMER_SYSTEM_PROMPT, buildConsumerRecommendationsPrompt } from "~~/services/ai/prompts";
import { RECOMMENDATION_SCHEMA } from "~~/services/ai/schemas";
import type { AiRecommendation, ConsumerAiContext } from "~~/services/ai/types";

export async function POST(request: Request) {
  const body = (await request.json()) as { context?: ConsumerAiContext };

  if (!body.context) {
    return NextResponse.json({ error: "Falta el contexto." }, { status: 400 });
  }

  try {
    const recommendations = await generateStructuredJson<AiRecommendation[]>(
      CONSUMER_SYSTEM_PROMPT,
      buildConsumerRecommendationsPrompt(body.context),
      RECOMMENDATION_SCHEMA,
    );
    return NextResponse.json({ recommendations: recommendations.slice(0, 3) });
  } catch (e) {
    if (e instanceof MissingGeminiKeyError) {
      return NextResponse.json(
        { error: "Michi Sabio no está disponible: falta configurar la clave de IA en el servidor." },
        { status: 502 },
      );
    }
    console.error("Error en /api/ai/consumer/recommendations:", e);
    return NextResponse.json({ error: "Michi Sabio no pudo generar recomendaciones." }, { status: 500 });
  }
}
