"use client";

import type { ChatRequestOptions, CreateMessage, Message } from "ai";
import { differenceInHours, format } from "date-fns";

type FlightResults = {
  flights: Array<{
    id: string;
    flightNumber: string;
    departure: { airportCode: string; timestamp: string };
    arrival: { airportCode: string; timestamp: string };
    airlines: string[];
    priceInUSD: number;
    numberOfStops: number;
  }>;
};

export function ListFlights({
  chatId,
  results,
  append,
  isLoading,
}: {
  chatId: string;
  results: FlightResults;
  isLoading: boolean;
  append: (
    message: Message | CreateMessage,
    options?: ChatRequestOptions,
  ) => Promise<string | null | undefined>;
}) {
  return (
    <div className="rounded-lg bg-muted px-4 py-1.5 flex flex-col">
      {results.flights?.length === 0 ? (
        <p className="py-3 text-sm text-muted-foreground">
          No fully verified public fares were found for this route and date.
        </p>
      ) : null}
      {(results.flights ?? []).map((flight) => (
        <div
          key={flight.id}
          className="cursor-pointer flex flex-row border-b dark:border-zinc-700 py-2 last-of-type:border-none group"
          onClick={() => {
            if (isLoading) return;
            append({
              role: "user",
              content: `I would like to book flight ${flight.flightNumber} operated by ${flight.airlines.join(", ")}!`,
            });
          }}
        >
          <div className="flex flex-col w-full gap-0.5 justify-between">
            <div className="flex flex-row gap-0.5 text-base sm:text-base font-medium group-hover:underline">
              <div className="text">
                {format(new Date(flight.departure.timestamp), "h:mm a")}
              </div>
              <div className="no-skeleton">–</div>
              <div className="text">
                {format(new Date(flight.arrival.timestamp), "h:mm a")}
              </div>
            </div>
            <div className="text w-fit hidden sm:flex text-sm text-muted-foreground flex-row gap-2">
              <div>
                {flight.flightNumber} · {flight.airlines.join(", ")}
              </div>
            </div>
            <div className="text sm:hidden text-xs sm:text-sm text-muted-foreground flex flex-row gap-2">
              {flight.airlines.length} stops
            </div>
          </div>

          <div className="flex flex-col gap-0.5 justify-between">
            <div className="flex flex-row gap-2">
              <div className="text-base sm:text-base">
                {differenceInHours(
                  new Date(flight.arrival.timestamp),
                  new Date(flight.departure.timestamp),
                )}{" "}
                hr
              </div>
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground flex flex-row">
              <div>{flight.departure.airportCode}</div>
              <div>–</div>
              <div>{flight.arrival.airportCode}</div>
            </div>
          </div>

          <div className="flex flex-col w-32 items-end gap-0.5">
            <div className="flex flex-row gap-2">
              <div className="text-base sm:text-base text-emerald-600 dark:text-emerald-500">
                ${flight.priceInUSD}
              </div>
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground flex flex-row">
              Round Trip
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
