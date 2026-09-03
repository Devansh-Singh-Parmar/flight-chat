export async function generateSampleFlightStatus({
  flightNumber,
  date,
}: {
  flightNumber: string;
  date: string;
}) {
  return {
    flightNumber,
    date,
    departure: {
      cityName: "London",
      airportCode: "LHR",
      airportName: "London Heathrow Airport",
      timestamp: "2026-09-05T18:30:00Z",
      terminal: "5",
      gate: "A10",
    },
    arrival: {
      cityName: "New York",
      airportCode: "JFK",
      airportName: "John F. Kennedy International Airport",
      timestamp: "2026-09-06T07:30:00Z",
      terminal: "7",
      gate: "B22",
    },
    totalDistanceInMiles: 3450,
  };
}

export async function generateSampleFlightSearchResults({
  origin,
  destination,
}: {
  origin: string;
  destination: string;
}) {
  const departure = origin.trim() || "San Francisco";
  const arrival = destination.trim() || "London";
  const options = [
    ["result_1", "UA184", ["United Airlines", "Lufthansa"], 1200.5, 1],
    ["result_2", "BA142", ["British Airways"], 1350, 0],
    ["result_3", "DL401", ["Delta Air Lines", "Air France"], 1150.75, 1],
    ["result_4", "AA207", ["American Airlines", "Iberia"], 1250.25, 1],
  ] as const;

  return {
    flights: options.map(
      ([id, flightNumber, airlines, priceInUSD, numberOfStops], index) => ({
        id,
        flightNumber,
        departure: {
          cityName: departure,
          airportCode: "DEP",
          timestamp: `2026-09-${String(10 + index).padStart(2, "0")}T16:30:00Z`,
        },
        arrival: {
          cityName: arrival,
          airportCode: "DST",
          timestamp: `2026-09-${String(11 + index).padStart(2, "0")}T13:50:00Z`,
        },
        airlines,
        priceInUSD,
        numberOfStops,
      }),
    ),
  };
}

export async function generateSampleSeatSelection({
  flightNumber,
}: {
  flightNumber: string;
}) {
  const seats = Array.from({ length: 5 }, (_, rowIndex) =>
    Array.from({ length: 6 }, (_, seatIndex) => {
      const row = rowIndex + 1;
      const column = String.fromCharCode(65 + seatIndex);

      return {
        seatNumber: `${row}${column}`,
        priceInUSD: row === 1 ? 55 : 25,
        isAvailable: (rowIndex * 6 + seatIndex) % 5 !== 0,
      };
    }),
  );

  return { flightNumber, seats };
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
  return {
    totalPriceInUSD: 450 + props.seats.length * 25,
  };
}
