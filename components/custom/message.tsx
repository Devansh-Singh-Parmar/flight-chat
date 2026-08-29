import type { Attachment, ToolInvocation } from "ai";

import { cn } from "@/lib/utils";

export function Message({
  chatId,
  role,
  content,
  attachments,
  toolInvocations,
}: {
  chatId: string;
  role: "user" | "assistant" | "system" | "tool" | "function" | "data";
  content: string;
  attachments?: Array<Attachment>;
  toolInvocations?: Array<ToolInvocation>;
}) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "w-full max-w-[720px] px-4 md:px-0",
        isUser ? "flex justify-end" : "flex justify-start",
      )}
    >
      <div
        className={cn(
          "rounded-2xl border px-4 py-3 text-sm shadow-sm",
          isUser
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-muted/70 text-foreground border-border",
        )}
      >
        {attachments && attachments.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachments.map((attachment, index) => (
              <div
                key={`${attachment.name ?? "file"}-${index}`}
                className="rounded-md border border-border bg-background/50 px-2 py-1 text-xs"
              >
                {attachment.name ?? "attachment"}
              </div>
            ))}
          </div>
        ) : null}

        {toolInvocations && toolInvocations.length > 0 ? (
          <div className="mb-2 space-y-1 text-xs opacity-80">
            {toolInvocations.map((toolInvocation, index) => (
              <div key={`${toolInvocation.toolCallId ?? "tool"}-${index}`}>
                {toolInvocation.toolName}: {toolInvocation.state}
              </div>
            ))}
          </div>
        ) : null}

        <div className="whitespace-pre-wrap break-words">{content}</div>
      </div>
    </div>
  );
}
