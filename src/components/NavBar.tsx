"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Me = {
  user: { id: string; email: string; fullName: string } | null;
  profile?: { id: string; displayName: string; role: string } | null;
};

export default function NavBar() {
  const [me, setMe] = useState<Me | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then(setMe)
      .catch(() => setMe({ user: null }));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setMe({ user: null });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-white">P</span>
          <span>Pick Me</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          <Link href="/map" className="hover:text-slate-900">Map</Link>
          {me?.profile && (
            <>
              <Link href="/post/request" className="hover:text-slate-900">Post a Request</Link>
              <Link href="/post/offer" className="hover:text-slate-900">Post an Offer</Link>
              <Link href="/messages" className="hover:text-slate-900">Messages</Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {me === null ? null : me.user ? (
            <>
              {!me.profile && (
                <Link
                  href="/onboarding"
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Finish profile
                </Link>
              )}
              <span className="hidden text-sm text-slate-500 sm:inline">{me.user.fullName}</span>
              <button
                onClick={logout}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-slate-700 hover:text-slate-900">
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
