import { NextResponse } from "next/server";
import { MissingGeminiKeyError, generateChatReply } from "~~/services/ai/geminiClient";
import { MERCHANT_SYSTEM_PROMPT, buildMerchantContextMessage } from "~~/services/ai/prompts";
import type { ChatMessage, MerchantAiContext } from "~~/services/ai/types";

export async function POST(request: Request) {
  const body = (await request.json()) as { message?: string; history?: ChatMessage[]; context?: MerchantAiContext };

  if (!body.message?.trim() || !body.context) {
    return NextResponse.json({ error: "Falta el mensaje o el contexto." }, { status: 400 });
  }

  try {
    const reply = await generateChatReply(
      MERCHANT_SYSTEM_PROMPT,
      body.history ?? [],
      buildMerchantContextMessage(body.context, body.message),
    );
    return NextResponse.json({ reply });
  } catch (e) {
    if (e instanceof MissingGeminiKeyError) {
      return NextResponse.json(
        { error: "Don Michi no está disponible: falta configurar la clave de IA en el servidor." },
        { status: 502 },
      );
    }
    console.error("Error en /api/ai/merchant/chat:", e);
    return NextResponse.json({ error: "Don Michi no pudo responder. Intenta de nuevo." }, { status: 500 });
  }
}
