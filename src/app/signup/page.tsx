"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error?.formErrors?.[0] || data.error || "Something went wrong");
      return;
    }
    router.push("/onboarding");
    router.refresh();
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
      <p className="mt-1 text-sm text-slate-600">
        Set up your profile to appear on the map and start connecting.
      </p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700">Full name</label>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Email</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Password</label>
          <input
            required
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          disabled={loading}
          className="mt-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-indigo-600 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
