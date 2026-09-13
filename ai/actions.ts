import { z } from "zod";

const airportSchema = z.object({
  cityName: z.string(),
  airportCode: z.string().length(3),
  airportName: z.string().optional(),
  timestamp: z.string().datetime(),
  terminal: z.string().optional(),
  gate: z.string().optional(),
});

const flightSchema = z.object({
  id: z.string(),
  flightNumber: z.string(),
  departure: airportSchema,
  arrival: airportSchema,
  airlines: z.array(z.string()).min(1),
  priceInUSD: z.number().positive(),
  numberOfStops: z.number().int().min(0),
});

const flightSearchSchema = z.object({ flights: z.array(flightSchema) });

const flightStatusSchema = z.object({
  available: z.literal(true),
  flightNumber: z.string(),
  departure: airportSchema.extend({
    airportName: z.string(),
    terminal: z.string(),
    gate: z.string(),
  }),
  arrival: airportSchema.extend({
    airportName: z.string(),
    terminal: z.string(),
    gate: z.string(),
  }),
  totalDistanceInMiles: z.number().positive(),
});

type GroundingSource = { title: string; uri: string };

function extractJson(text: string) {
  const fencedJson = text.match(/```json\s*([\s\S]*?)\s*```/i)?.[1];
  return JSON.parse(fencedJson ?? text);
}

async function searchWithGemini<T>(prompt: string, schema: z.ZodType<T>) {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not configured");

  const model = process.env.GOOGLE_GENERATIVE_AI_MODEL ?? "gemini-3.8-flash";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        tools: [{ google_search: {} }],
        generationConfig: { responseMimeType: "application/json", temperature: 0 },
      }),
    },
  );

  if (!response.ok) throw new Error(`Gemini flight search failed (${response.status})`);

  const payload = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
      groundingMetadata?: { groundingChunks?: Array<{ web?: GroundingSource }> };
    }>;
  };
  const candidate = payload.candidates?.[0];
  const text = candidate?.content?.parts?.map((part) => part.text ?? "").join("");
  if (!text) throw new Error("Gemini returned no flight data");

  return {
    data: schema.parse(extractJson(text)),
    sources:
      candidate?.groundingMetadata?.groundingChunks
        ?.flatMap((chunk) => (chunk.web ? [chunk.web] : []))
        .filter((source, index, sources) =>
          sources.findIndex((item) => item.uri === source.uri) === index,
        ) ?? [],
  };
}

export async function searchFlights({
  origin,
  destination,
  departureDate,
}: {
  origin: string;
  destination: string;
  departureDate: string;
}) {
  return searchWithGemini(
    `Use Google Search to find publicly listed, currently available flights from ${origin} to ${destination} on ${departureDate}. Return JSON only: {"flights":[...]}. Include a flight only when a source explicitly supports its airline, flight number, departure and arrival airport/city and time, number of stops, and current USD price. Do not estimate, infer, fabricate, or reuse stale values. If no complete, verifiable result is available, return {"flights":[]}. Each flight must have id, flightNumber, departure {cityName, airportCode, timestamp}, arrival {cityName, airportCode, timestamp}, airlines, priceInUSD, and numberOfStops. Timestamps must be ISO 8601 strings.`,
    flightSearchSchema,
  );
}

export async function getFlightStatus({
  flightNumber,
  date,
}: {
  flightNumber: string;
  date: string;
}) {
  return searchWithGemini(
    `Use Google Search to find the live or scheduled status of flight ${flightNumber} on ${date}. Return JSON only. Return {"available":true,"flightNumber":"...","departure":{"cityName":"...","airportCode":"...","airportName":"...","timestamp":"ISO-8601","terminal":"...","gate":"..."},"arrival":{"cityName":"...","airportCode":"...","airportName":"...","timestamp":"ISO-8601","terminal":"...","gate":"..."},"totalDistanceInMiles":number} only if each value is supported by a current source. Do not guess a gate, terminal, status, time, or route. If a complete verified record is unavailable, return {"available":false}.`,
    z.union([flightStatusSchema, z.object({ available: z.literal(false) })]),
  );
}
