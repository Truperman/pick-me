"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

type Message = { id: string; senderId: string; body: string; createdAt: string };

export default function ConversationPage() {
  const params = useParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function load() {
    const [meRes, msgRes] = await Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch(`/api/conversations/${params.id}/messages`).then((r) => r.json()),
    ]);
    setUserId(meRes.user?.id ?? null);
    setMessages(msgRes.messages ?? []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!draft.trim()) return;
    setSending(true);
    const res = await fetch(`/api/conversations/${params.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: draft }),
    });
    setSending(false);
    if (res.ok) {
      const data = await res.json();
      setMessages((m) => [...m, data.message]);
      setDraft("");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-8">
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
              m.senderId === userId ? "self-end bg-indigo-600 text-white" : "self-start bg-slate-100 text-slate-800"
            }`}
          >
            {m.body}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="mt-4 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type a message..."
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />
        <button
          onClick={send}
          disabled={sending || !draft.trim()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
