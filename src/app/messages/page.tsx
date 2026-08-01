"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Convo = {
  id: string;
  updatedAt: string;
  otherDisplayName: string | null;
  lastMessage: string | null;
};

export default function MessagesPage() {
  const [convos, setConvos] = useState<Convo[] | null>(null);

  useEffect(() => {
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((d) => setConvos(d.conversations ?? []));
  }, []);

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Messages</h1>

      {convos === null && <p className="mt-4 text-sm text-slate-500">Loading...</p>}
      {convos?.length === 0 && (
        <p className="mt-4 text-sm text-slate-500">
          No conversations yet. Find someone on the{" "}
          <Link href="/map" className="text-indigo-600 hover:underline">
            map
          </Link>{" "}
          and send them a message.
        </p>
      )}

      <div className="mt-6 flex flex-col divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
        {convos?.map((c) => (
          <Link key={c.id} href={`/messages/${c.id}`} className="flex flex-col gap-1 px-4 py-3 hover:bg-slate-50">
            <span className="text-sm font-medium text-slate-900">{c.otherDisplayName ?? "Unknown"}</span>
            <span className="truncate text-sm text-slate-500">{c.lastMessage}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
