import { generateObject } from "ai";
import { z } from "zod";

import { geminiFlashModel } from ".";

const airportSchema = z.object({
  cityName: z.string(),
  airportCode: z.string().length(3),
  airportName: z.string(),
  timestamp: z.string(),
  terminal: z.string(),
  gate: z.string(),
});

export async function generateSampleFlightStatus({
  flightNumber,
  date,
}: {
  flightNumber: string;
  date: string;
}) {
  const { object } = await generateObject({
    model: geminiFlashModel,
    prompt: `Return realistic flight status data for flight ${flightNumber} on ${date}. Use the requested flight number exactly. Return only data matching the schema.`,
    schema: z.object({
      flightNumber: z.string(),
      departure: airportSchema,
      arrival: airportSchema,
      totalDistanceInMiles: z.number().positive(),
    }),
  });

  return { ...object, flightNumber };
}

export async function generateSampleFlightSearchResults({
  origin,
  destination,
}: {
  origin: string;
  destination: string;
}) {
  const { object } = await generateObject({
    model: geminiFlashModel,
    prompt: `Generate exactly 4 realistic flight search results from ${origin} to ${destination}. Every result must include a real-looking airline flight number such as BA142 or DL401. Do not use internal IDs like result_1. Use ISO timestamps and IATA airport codes.`,
    output: "array",
    schema: z.object({
      id: z.string().describe("Internal unique result ID"),
      flightNumber: z
        .string()
        .regex(/^[A-Z]{2,3}[0-9]{1,4}$/)
        .describe("Airline flight number, never result_1 or similar"),
      departure: z.object({
        cityName: z.string(),
        airportCode: z.string().length(3),
        timestamp: z.string(),
      }),
      arrival: z.object({
        cityName: z.string(),
        airportCode: z.string().length(3),
        timestamp: z.string(),
      }),
      airlines: z.array(z.string()).min(1),
      priceInUSD: z.number().positive(),
      numberOfStops: z.number().int().min(0).max(3),
    }),
  });

  return {
    flights: object.map((flight, index) => ({
      ...flight,
      id: flight.id.startsWith("result_") ? `flight_${index + 1}` : flight.id,
    })),
  };
}

export async function generateSampleSeatSelection({
  flightNumber,
}: {
  flightNumber: string;
}) {
  const { object } = await generateObject({
    model: geminiFlashModel,
    prompt: `Generate exactly 30 seat availability records for flight ${flightNumber}: rows 1 through 5, seats A through F. Include realistic prices and availability. Return only the array.`,
    output: "array",
    schema: z.object({
      seatNumber: z.string().regex(/^[1-5][A-F]$/),
      priceInUSD: z.number().positive().max(99),
      isAvailable: z.boolean(),
    }),
  });

  const rows = Array.from({ length: 5 }, (_, rowIndex) =>
    object
      .filter((seat) => seat.seatNumber.startsWith(String(rowIndex + 1)))
      .sort((a, b) => a.seatNumber.localeCompare(b.seatNumber)),
  );

  return { flightNumber, seats: rows };
}

export async function generateReservationPrice(props: {
  seats: string[];
  flightNumber: string;
  departure: {
    cityName: string;
    airportCode: string;
    timestamp: string;
    gate: string;
    terminal: string;
  };
  arrival: {
    cityName: string;
    airportCode: string;
    timestamp: string;
    gate: string;
    terminal: string;
  };
  passengerName: string;
}) {
  const { object } = await generateObject({
    model: geminiFlashModel,
    prompt: `Calculate a realistic total price in USD for this flight reservation. Use the exact flight number ${props.flightNumber} and selected seats ${props.seats.join(", ")}. Return only the total price.`,
    schema: z.object({
      totalPriceInUSD: z.number().positive(),
    }),
  });

  return object;
}
