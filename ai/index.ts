import { createGeminiModel } from "./google";

const defaultModelId =
  process.env.GOOGLE_GENERATIVE_AI_MODEL ?? "gemini-3.5-flash";

export const geminiProModel = createGeminiModel(defaultModelId);
export const geminiFlashModel = createGeminiModel(defaultModelId);
