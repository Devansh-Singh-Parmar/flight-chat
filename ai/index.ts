import { google } from "@ai-sdk/google";
import { experimental_wrapLanguageModel as wrapLanguageModel } from "ai";

import { customMiddleware } from "./custom-middleware";

export const geminiProModel = wrapLanguageModel({
  model: google(process.env.GOOGLE_GENERATIVE_AI_MODEL ?? "gemini-3.8-flash"),
  middleware: customMiddleware,
});

export const geminiFlashModel = wrapLanguageModel({
  model: google(process.env.GOOGLE_GENERATIVE_AI_MODEL ?? "gemini-3.8-flash"),
  middleware: customMiddleware,
});
