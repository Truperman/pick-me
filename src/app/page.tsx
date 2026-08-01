import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
        <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
          Business marketplace, on a map
        </span>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Find the right business. Find the right client. Right near you.
        </h1>
        <p className="max-w-2xl text-lg text-slate-600">
          Pick Me is a live map of buyers and sellers. Post what you need, post what you
          offer, see who&apos;s nearby, and message them directly — no cold outreach, no
          guessing who&apos;s actually looking.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <Link
            href="/signup"
            className="rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Create your profile
          </Link>
          <Link
            href="/map"
            className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Browse the map
          </Link>
        </div>

        <div className="mt-16 grid w-full grid-cols-1 gap-4 text-left sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold text-slate-900">Post what you need</h3>
            <p className="mt-1 text-sm text-slate-600">
              Buyers publish requests — a contractor, a supplier, an investor — as pins
              on the map so nearby sellers can respond.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold text-slate-900">Post what you offer</h3>
            <p className="mt-1 text-sm text-slate-600">
              Sellers publish products, services, and available capacity so buyers can
              find them by location and category.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold text-slate-900">Message directly</h3>
            <p className="mt-1 text-sm text-slate-600">
              Click a pin, view the profile, and start a conversation — right from the
              map.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
