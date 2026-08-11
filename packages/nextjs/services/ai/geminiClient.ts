import type { ChatMessage } from "./types";
import { GoogleGenerativeAI, type Schema } from "@google/generative-ai";

const DEFAULT_MODEL = "gemini-flash-latest";

export class MissingGeminiKeyError extends Error {}

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new MissingGeminiKeyError("GEMINI_API_KEY no está configurada en el servidor.");
  return new GoogleGenerativeAI(apiKey);
}

function getModelName() {
  return process.env.GEMINI_MODEL || DEFAULT_MODEL;
}

export async function generateChatReply(
  systemInstruction: string,
  history: ChatMessage[],
  contextMessage: string,
): Promise<string> {
  const client = getClient();
  const model = client.getGenerativeModel({ model: getModelName(), systemInstruction });

  const contents = [
    ...history.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
    { role: "user" as const, parts: [{ text: contextMessage }] },
  ];

  const result = await model.generateContent({ contents });
  return result.response.text();
}

export async function generateStructuredJson<T>(systemInstruction: string, prompt: string, schema: Schema): Promise<T> {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: getModelName(),
    systemInstruction,
    generationConfig: { responseMimeType: "application/json", responseSchema: schema },
  });

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text()) as T;
}
