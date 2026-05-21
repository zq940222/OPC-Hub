"use client";

import { useActionState, useEffect, useState } from "react";
import type { MessageState } from "@/actions/messages";

type ThreadMessage = {
  id: string;
  fromId: string;
  toId: string;
  content: string;
  createdAt: string;
};

type MessageThreadProps = {
  currentUserId: string;
  initialMessages: ThreadMessage[];
  action: (state: MessageState, formData: FormData) => Promise<MessageState>;
  apiPath: string;
};

export function MessageThread({ currentUserId, initialMessages, action, apiPath }: MessageThreadProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [state, formAction, pending] = useActionState(action, {});

  useEffect(() => {
    const timer = window.setInterval(async () => {
      const response = await fetch(apiPath);
      if (response.ok) {
        const data = (await response.json()) as { messages: ThreadMessage[] };
        setMessages(data.messages);
      }
    }, 5000);
    return () => window.clearInterval(timer);
  }, [apiPath]);

  return (
    <section className="grid gap-4">
      <div className="grid max-h-[520px] gap-3 overflow-y-auto rounded-lg border border-slate-200 bg-white p-4">
        {messages.map((message) => {
          const mine = message.fromId === currentUserId;
          return (
            <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm leading-6 ${mine ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-700"}`}>
                <p>{message.content}</p>
                <p className={`mt-1 text-[11px] ${mine ? "text-blue-100" : "text-slate-500"}`}>{new Date(message.createdAt).toLocaleString("zh-CN")}</p>
              </div>
            </div>
          );
        })}
        {messages.length === 0 ? <p className="text-sm text-slate-500">No messages yet.</p> : null}
      </div>
      <form action={formAction} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4">
        {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
        <textarea name="content" required rows={3} className="focus-ring resize-y rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <button disabled={pending} className="focus-ring rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
          {pending ? "Sending..." : "Send"}
        </button>
      </form>
    </section>
  );
}
