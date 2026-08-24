import { motion } from "framer-motion";
import Link from "next/link";

export const Overview = () => {
  return (
    <motion.div
      key="overview"
      className="max-w-[500px] mt-20 mx-4 md:mx-0"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="border-none bg-muted/50 rounded-2xl p-6 flex flex-col gap-4 text-zinc-500 text-sm dark:text-zinc-400 dark:border-zinc-700">
        <p>
          A fun project that demonstrates how to build a chatbot using the
          Google Gemini model and the AI SDK by Vercel. It uses the{" "}
          <code className="rounded-sm bg-muted-foreground/15 px-1.5 py-0.5">
            streamText
          </code>{" "}
          function in the server and the{" "}
          <code className="rounded-sm bg-muted-foreground/15 px-1.5 py-0.5">
            useChat
          </code>{" "}
          hook on the client to create a seamless chat experience.
        </p>
        <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
          Chat responses are currently limited by the Gemini provider quota. If
          the assistant does not reply, the model is likely rate-limited and the
          request needs to be retried later or a new API quota/source is needed.
        </p>
      </div>
    </motion.div>
  );
};
