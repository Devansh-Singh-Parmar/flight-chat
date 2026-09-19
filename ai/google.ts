import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { experimental_wrapLanguageModel as wrapLanguageModel } from "ai";

import { customMiddleware } from "./custom-middleware";

const FALLBACK_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.6-flash",
  "gemini-3.7-flash",
  "gemini-flash-latest",
  "gemini-3.8-flash",
];

let cachedModelIds: string[] | null = null;
let cachedModelIdsAt = 0;

function unique(values: Array<string | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

export function getGoogleApiKey() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not configured");
  }
  return apiKey;
}

export async function listGeminiModels() {
  const apiKey = getGoogleApiKey();
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models",
    { headers: { "x-goog-api-key": apiKey } },
  );

  if (!response.ok) {
    throw new Error(`Failed to list Gemini models (${response.status})`);
  }

  const payload = (await response.json()) as {
    models?: Array<{ name?: string }>;
  };

  return (
    payload.models
      ?.map((model) => model.name?.replace(/^models\//, ""))
      .filter((name): name is string => Boolean(name)) ?? []
  );
}

export async function resolveGeminiModelIds() {
  if (cachedModelIds && Date.now() - cachedModelIdsAt < 5 * 60_000) {
    return cachedModelIds;
  }

  const preferred = process.env.GOOGLE_GENERATIVE_AI_MODEL;
  try {
    const available = new Set(await listGeminiModels());
    const ordered = unique([preferred, ...FALLBACK_MODELS]).filter((id) =>
      available.has(id),
    );
    cachedModelIds =
      ordered.length > 0 ? ordered : unique([preferred, ...FALLBACK_MODELS]);
  } catch {
    cachedModelIds = unique([preferred, ...FALLBACK_MODELS]);
  }

  cachedModelIdsAt = Date.now();
  return cachedModelIds;
}

async function fetchWithModelFallback(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  const originalUrl = String(input);
  const modelIds = originalUrl.includes("/models/")
    ? await resolveGeminiModelIds()
    : [];

  if (modelIds.length === 0) {
    return fetch(input, init);
  }

  let lastResponse: Response | undefined;
  for (const modelId of modelIds) {
    const url = originalUrl.replace(
      /\/models\/[^/:]+/,
      `/models/${modelId}`,
    );
    const response = await fetch(url, init);
    if (response.ok || (response.status !== 503 && response.status !== 429)) {
      return response;
    }
    lastResponse = response;
  }

  return lastResponse ?? fetch(input, init);
}

const google = createGoogleGenerativeAI({
  fetch: fetchWithModelFallback,
});

export function createGeminiModel(modelId: string) {
  return wrapLanguageModel({
    model: google(modelId),
    middleware: customMiddleware,
  });
}

export async function withGeminiModelFallback<T>(
  run: (model: ReturnType<typeof createGeminiModel>) => Promise<T>,
) {
  const errors: string[] = [];

  for (const modelId of await resolveGeminiModelIds()) {
    try {
      return await run(createGeminiModel(modelId));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${modelId}: ${message}`);
      if (!/503|429|quota|rate limit|high demand|unavailable/i.test(message)) {
        throw error;
      }
    }
  }

  throw new Error(`All Gemini models failed. ${errors.join(" | ")}`);
}
