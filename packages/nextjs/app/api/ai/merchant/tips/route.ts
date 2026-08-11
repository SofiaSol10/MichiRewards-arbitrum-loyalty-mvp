import { NextResponse } from "next/server";
import { MissingGeminiKeyError, generateStructuredJson } from "~~/services/ai/geminiClient";
import { MERCHANT_SYSTEM_PROMPT, buildMerchantTipsPrompt } from "~~/services/ai/prompts";
import { TIPS_SCHEMA } from "~~/services/ai/schemas";
import type { AiTip, MerchantAiContext } from "~~/services/ai/types";

export async function POST(request: Request) {
  const body = (await request.json()) as { context?: MerchantAiContext };

  if (!body.context) {
    return NextResponse.json({ error: "Falta el contexto." }, { status: 400 });
  }

  try {
    const tips = await generateStructuredJson<AiTip[]>(
      MERCHANT_SYSTEM_PROMPT,
      buildMerchantTipsPrompt(body.context),
      TIPS_SCHEMA,
    );
    return NextResponse.json({ tips: tips.slice(0, 2) });
  } catch (e) {
    if (e instanceof MissingGeminiKeyError) {
      return NextResponse.json(
        { error: "Don Michi no está disponible: falta configurar la clave de IA en el servidor." },
        { status: 502 },
      );
    }
    console.error("Error en /api/ai/merchant/tips:", e);
    return NextResponse.json({ error: "Don Michi no pudo generar tips." }, { status: 500 });
  }
}
