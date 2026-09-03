"use client";

import {
  Attachment,
  ChatRequestOptions,
  CreateMessage,
  Message as AIMessage,
  ToolInvocation,
} from "ai";
import { motion } from "framer-motion";
import { ReactNode } from "react";
import { Streamdown } from "streamdown";

import { BotIcon, UserIcon } from "./icons";
import { PreviewAttachment } from "./preview-attachment";
import { Weather } from "./weather";
import { AuthorizePayment } from "../flights/authorize-payment";
import { DisplayBoardingPass } from "../flights/boarding-pass";
import { CreateReservation } from "../flights/create-reservation";
import { FlightStatus } from "../flights/flight-status";
import { ListFlights } from "../flights/list-flights";
import { SelectSeats } from "../flights/select-seats";
import { VerifyPayment } from "../flights/verify-payment";

export const Message = ({
  chatId,
  role,
  content,
  toolInvocations,
  attachments,
  append,
}: {
  chatId: string;
  role: string;
  content: string | ReactNode;
  toolInvocations: Array<ToolInvocation> | undefined;
  attachments?: Array<Attachment>;
  append: (
    message: AIMessage | CreateMessage,
    options?: ChatRequestOptions,
  ) => Promise<string | null | undefined>;
}) => (
  <motion.div
    className="flex flex-row gap-4 px-4 w-full md:w-[500px] md:px-0 first-of-type:pt-20"
    initial={{ y: 5, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
  >
    <div className="size-[24px] border rounded-sm p-1 flex flex-col justify-center items-center shrink-0 text-zinc-500">
      {role === "assistant" ? <BotIcon /> : <UserIcon />}
    </div>
    <div className="flex flex-col gap-2 w-full">
      {content && typeof content === "string" && (
        <div className="text-zinc-800 dark:text-zinc-300 flex flex-col gap-4">
          <Streamdown>{content}</Streamdown>
        </div>
      )}
      {toolInvocations && (
        <div className="flex flex-col gap-4">
          {toolInvocations.map((toolInvocation) => {
            const { toolName, toolCallId, state } = toolInvocation;
            if (state === "result") {
              const { result } = toolInvocation;
              return (
                <div key={toolCallId}>
                  {toolName === "getWeather" ? (
                    <Weather weatherAtLocation={result} />
                  ) : toolName === "displayFlightStatus" ? (
                    <FlightStatus flightStatus={result} />
                  ) : toolName === "searchFlights" ? (
                    <ListFlights
                      chatId={chatId}
                      results={result}
                      append={append}
                    />
                  ) : toolName === "selectSeats" ? (
                    <SelectSeats
                      chatId={chatId}
                      availability={result}
                      append={append}
                    />
                  ) : toolName === "createReservation" ? (
                    Object.keys(result).includes("error") ? null : (
                      <CreateReservation reservation={result} />
                    )
                  ) : toolName === "authorizePayment" ? (
                    <AuthorizePayment intent={result} />
                  ) : toolName === "displayBoardingPass" ? (
                    <DisplayBoardingPass boardingPass={result} />
                  ) : toolName === "verifyPayment" ? (
                    <VerifyPayment result={result} />
                  ) : (
                    <div>{JSON.stringify(result, null, 2)}</div>
                  )}
                </div>
              );
            }
            return (
              <div key={toolCallId} className="skeleton">
                {toolName === "getWeather" ? (
                  <Weather />
                ) : toolName === "displayFlightStatus" ? (
                  <FlightStatus />
                ) : toolName === "searchFlights" ? (
                  <div className="skeleton rounded-lg bg-muted h-24 w-full" />
                ) : toolName === "selectSeats" ? (
                  <div className="skeleton rounded-lg bg-muted h-64 w-full" />
                ) : toolName === "createReservation" ? (
                  <CreateReservation />
                ) : toolName === "authorizePayment" ? (
                  <AuthorizePayment />
                ) : toolName === "displayBoardingPass" ? (
                  <DisplayBoardingPass />
                ) : null}
              </div>
            );
          })}
        </div>
      )}
      {attachments && (
        <div className="flex flex-row gap-2">
          {attachments.map((attachment) => (
            <PreviewAttachment key={attachment.url} attachment={attachment} />
          ))}
        </div>
      )}
    </div>
  </motion.div>
);
