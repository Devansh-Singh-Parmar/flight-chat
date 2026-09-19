import { generateObject } from "ai";
import { z } from "zod";

import { withGeminiModelFallback } from "./google";

const airportSchema = z.object({
  cityName: z.string(),
  airportCode: z.string().length(3),
  airportName: z.string(),
  timestamp: z.string(),
  terminal: z.string(),
  gate: z.string(),
});

const flightResultSchema = z.object({
  id: z.string(),
  flightNumber: z.string(),
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
});

function airportCodeFrom(place: string, fallback: string) {
  const match = place.toUpperCase().match(/\b[A-Z]{3}\b/);
  if (match) return match[0];
  const compact = place.replace(/[^a-z]/gi, "").toUpperCase();
  return (compact.slice(0, 3) || fallback).padEnd(3, "X");
}

function isoAt(date: string | undefined, hour: number, minute: number) {
  const base = date && /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? date
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return `${base}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
}

function localFlightResults({
  origin,
  destination,
  departureDate,
}: {
  origin: string;
  destination: string;
  departureDate?: string;
}) {
  const originCode = airportCodeFrom(origin, "SFO");
  const destinationCode = airportCodeFrom(destination, "LHR");
  const carriers = [
    { flightNumber: "BA287", airlines: ["British Airways"], hour: 8, duration: 10, stops: 0, price: 742 },
    { flightNumber: "UA930", airlines: ["United Airlines"], hour: 11, duration: 11, stops: 0, price: 689 },
    { flightNumber: "VS42", airlines: ["Virgin Atlantic"], hour: 16, duration: 10, stops: 0, price: 715 },
    { flightNumber: "DL4", airlines: ["Delta Air Lines"], hour: 19, duration: 13, stops: 1, price: 598 },
  ];

  return {
    flights: carriers.map((carrier, index) => ({
      id: `flight_${index + 1}`,
      flightNumber: carrier.flightNumber,
      departure: {
        cityName: origin,
        airportCode: originCode,
        timestamp: isoAt(departureDate, carrier.hour, 15 * index),
      },
      arrival: {
        cityName: destination,
        airportCode: destinationCode,
        timestamp: isoAt(
          departureDate,
          carrier.hour + carrier.duration,
          15 * index + 20,
        ),
      },
      airlines: carrier.airlines,
      priceInUSD: carrier.price,
      numberOfStops: carrier.stops,
    })),
  };
}

export async function generateSampleFlightStatus({
  flightNumber,
  date,
}: {
  flightNumber: string;
  date: string;
}) {
  try {
    const { object } = await withGeminiModelFallback((model) =>
      generateObject({
        model,
        maxRetries: 0,
        prompt: `Return realistic flight status data for flight ${flightNumber} on ${date}. Use the requested flight number exactly. Return only data matching the schema.`,
        schema: z.object({
          flightNumber: z.string(),
          departure: airportSchema,
          arrival: airportSchema,
          totalDistanceInMiles: z.number().positive(),
        }),
      }),
    );

    return { ...object, flightNumber, available: true as const };
  } catch {
    return {
      available: true as const,
      flightNumber,
      departure: {
        cityName: "San Francisco",
        airportCode: "SFO",
        airportName: "San Francisco International Airport",
        timestamp: isoAt(date, 9, 10),
        terminal: "I",
        gate: "A7",
      },
      arrival: {
        cityName: "London",
        airportCode: "LHR",
        airportName: "London Heathrow Airport",
        timestamp: isoAt(date, 17, 45),
        terminal: "5",
        gate: "B12",
      },
      totalDistanceInMiles: 5364,
    };
  }
}

export async function generateSampleFlightSearchResults({
  origin,
  destination,
  departureDate,
}: {
  origin: string;
  destination: string;
  departureDate?: string;
}) {
  try {
    const { object } = await withGeminiModelFallback((model) =>
      generateObject({
        model,
        maxRetries: 0,
        prompt: `Generate exactly 4 realistic flight search results from ${origin} to ${destination}${departureDate ? ` on ${departureDate}` : ""}. Every result must include a real-looking airline flight number such as BA142 or DL401. Do not use internal IDs like result_1. Use ISO timestamps and IATA airport codes.`,
        output: "array",
        schema: flightResultSchema,
      }),
    );

    return {
      flights: object.map((flight, index) => ({
        ...flight,
        id: flight.id.startsWith("result_") ? `flight_${index + 1}` : flight.id,
      })),
    };
  } catch {
    return localFlightResults({ origin, destination, departureDate });
  }
}

export async function generateSampleSeatSelection({
  flightNumber,
}: {
  flightNumber: string;
}) {
  try {
    const { object } = await withGeminiModelFallback((model) =>
      generateObject({
        model,
        maxRetries: 0,
        prompt: `Generate exactly 30 seat availability records for flight ${flightNumber}: rows 1 through 5, seats A through F. Include realistic prices and availability. Return only the array.`,
        output: "array",
        schema: z.object({
          seatNumber: z.string().regex(/^[1-5][A-F]$/),
          priceInUSD: z.number().positive().max(99),
          isAvailable: z.boolean(),
        }),
      }),
    );

    const rows = Array.from({ length: 5 }, (_, rowIndex) =>
      object
        .filter((seat) => seat.seatNumber.startsWith(String(rowIndex + 1)))
        .sort((a, b) => a.seatNumber.localeCompare(b.seatNumber)),
    );

    return { flightNumber, seats: rows };
  } catch {
    const columns = ["A", "B", "C", "D", "E", "F"];
    return {
      flightNumber,
      seats: Array.from({ length: 5 }, (_, row) =>
        columns.map((column, columnIndex) => ({
          seatNumber: `${row + 1}${column}`,
          priceInUSD: 45 + row * 8 + columnIndex,
          isAvailable: !(row === 0 && columnIndex < 2),
        })),
      ),
    };
  }
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
  try {
    const { object } = await withGeminiModelFallback((model) =>
      generateObject({
        model,
        maxRetries: 0,
        prompt: `Calculate a realistic total price in USD for this flight reservation. Use the exact flight number ${props.flightNumber} and selected seats ${props.seats.join(", ")}. Return only the total price.`,
        schema: z.object({
          totalPriceInUSD: z.number().positive(),
        }),
      }),
    );

    return object;
  } catch {
    return { totalPriceInUSD: 650 + props.seats.length * 55 };
  }
}

export async function searchFlights(params: {
  origin: string;
  destination: string;
  departureDate?: string;
}) {
  return generateSampleFlightSearchResults(params);
}

export async function getFlightStatus(params: {
  flightNumber: string;
  date: string;
}) {
  return generateSampleFlightStatus(params);
}
