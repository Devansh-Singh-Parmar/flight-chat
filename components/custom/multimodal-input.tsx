"use client";

import type { Attachment } from "ai";
import { PaperclipIcon, ArrowUpIcon, StopCircleIcon } from "lucide-react";
import { type ChangeEvent, type FormEvent, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function MultimodalInput({
  input,
  setInput,
  handleSubmit,
  isLoading,
  stop,
  attachments,
  setAttachments,
  messages,
  append,
}: {
  input: string;
  setInput: (value: string) => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  stop: () => void;
  attachments: Array<Attachment>;
  setAttachments: (attachments: Array<Attachment>) => void;
  messages: Array<{ id: string; role: string; content: string }>;
  append: (message: { role: "user"; content: string }) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    const newAttachments = files.map((file) => ({
      name: file.name,
      contentType: file.type || "application/octet-stream",
      url: URL.createObjectURL(file),
    }));

    setAttachments([...attachments, ...newAttachments]);
    event.target.value = "";
  };

  return (
    <div className="w-full rounded-2xl border border-border bg-background p-2 shadow-sm">
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

      <div className="flex items-center gap-2">
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
          <Button
            type="button"
            size="icon"
            onClick={() => {
              const value = input.trim();
              if (!value) return;
              append({ role: "user", content: value });
              setInput("");
            }}
          >
            <ArrowUpIcon className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
