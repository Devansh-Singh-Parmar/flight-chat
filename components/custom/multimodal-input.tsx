"use client";

import type {
  Attachment,
  ChatRequestOptions,
  CreateMessage,
  Message,
} from "ai";
import { PaperclipIcon, ArrowUpIcon, StopCircleIcon } from "lucide-react";
import {
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
  useRef,
} from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const suggestedActions = [
  {
    title: "Help me book a flight",
    label: "from San Francisco to London",
    action: "Help me book a flight from San Francisco to London",
  },
  {
    title: "What is the status",
    label: "of flight BA142 flying tomorrow?",
    action: "What is the status of flight BA142 flying tomorrow?",
  },
];

export function MultimodalInput({
  input,
  setInput,
  isLoading,
  stop,
  attachments,
  setAttachments,
  messages,
  append,
}: {
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  stop: () => void;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  messages: Array<Message>;
  append: (
    message: Message | CreateMessage,
    options?: ChatRequestOptions,
  ) => Promise<string | null | undefined>;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    const uploaded: Array<Attachment | undefined> = await Promise.all(
      files.map(async (file): Promise<Attachment | undefined> => {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("/api/files/upload", {
          method: "POST",
          body: formData,
        });
        if (!response.ok) return undefined;
        const { url, pathname, contentType } = await response.json();
        return { url, name: pathname, contentType };
      }),
    );
    setAttachments((current) => [
      ...current,
      ...uploaded.filter((item): item is Attachment => item !== undefined),
    ]);
  };

  return (
    <div className="w-full">
      {messages.length === 0 && attachments.length === 0 && (
        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          {suggestedActions.map((suggestedAction) => (
            <button
              key={suggestedAction.title}
              type="button"
              className="rounded-lg border border-zinc-200 bg-muted/50 p-3 text-left text-sm text-zinc-800 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
              onClick={() =>
                append({ role: "user", content: suggestedAction.action })
              }
            >
              <span className="block font-medium">{suggestedAction.title}</span>
              <span className="text-zinc-500 dark:text-zinc-400">
                {suggestedAction.label}
              </span>
            </button>
          ))}
        </div>
      )}
      <div className="rounded-2xl border border-border bg-background p-2 shadow-sm">
        {attachments.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachments.map((attachment, index) => (
              <div
                key={`${attachment.name ?? "attachment"}-${index}`}
                className="rounded-md border border-border bg-muted px-2 py-1 text-xs"
              >
                {attachment.name ?? "attachment"}
              </div>
            ))}
          </div>
        ) : null}

        <form
          className="flex items-center gap-2"
          onSubmit={async (event) => {
            event.preventDefault();
            const value = input.trim();
            if (!value || isLoading) return;

            await append(
              { role: "user", content: value },
              { experimental_attachments: attachments },
            );
            setInput("");
            setAttachments([]);
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            onChange={onFileChange}
          />

          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach files"
          >
            <PaperclipIcon className="h-4 w-4" />
          </Button>

          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Send a message"
            className="border-0 bg-transparent shadow-none focus-visible:ring-0"
          />

          {isLoading ? (
            <Button type="button" variant="outline" onClick={stop}>
              <StopCircleIcon className="mr-2 h-4 w-4" />
              Stop
            </Button>
          ) : (
            <Button type="submit" size="icon">
              <ArrowUpIcon className="h-4 w-4" />
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}
