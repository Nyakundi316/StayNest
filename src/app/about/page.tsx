import Link from "next/link";
import { ShieldCheck, HeartHandshake, Sparkles, Users } from "lucide-react";
import HostCTA from "@/components/HostCTA";

export default function AboutPage() {
  return (
    <div className="pt-24 pb-8">
      <section className="container-px max-w-4xl text-center">
        <div className="text-xs font-semibold uppercase tracking-wider text-brand-600 mb-3">
          About StayNest
        </div>
        <h1 className="h-display text-4xl sm:text-5xl">
          A simpler, warmer way to stay.
        </h1>
        <p className="mt-4 text-ink-600 text-lg max-w-2xl mx-auto">
          StayNest curates trusted homes across Kenya — from cosy studios in
          Nairobi to villas on the coast. We work directly with property owners
          so guests get fair prices and consistent quality.
        </p>
      </section>

      <section className="container-px mt-16 grid lg:grid-cols-2 gap-10 items-center">
        <div className="rounded-3xl overflow-hidden aspect-[4/3]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1600" alt="" className="w-full h-full object-cover" />
        </div>
        <div>
          <h2 className="h-display text-3xl mb-3">Our mission</h2>
          <p className="text-ink-600 leading-relaxed">
            Travel should feel effortless. We&apos;re building a network of carefully
            vetted homes and a service that takes care of guests and owners alike.
            Every booking supports a local property owner, and every guest gets a
            place that actually feels like home.
          </p>
          <ul className="mt-5 space-y-2 text-ink-700">
            <li>• Direct relationships with verified property owners</li>
            <li>• One simple price — no hidden fees</li>
            <li>• Local team available before, during and after every stay</li>
          </ul>
        </div>
      </section>

      <section className="container-px mt-20">
        <h2 className="h-display text-3xl text-center mb-2">Trust & safety</h2>
        <p className="text-center text-ink-500 max-w-2xl mx-auto">
          The principles we hold ourselves to on every listing.
        </p>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card icon={<ShieldCheck size={22} />} title="Verified hosts" body="Every owner is interviewed and every property visited before going live." />
          <Card icon={<Sparkles size={22} />} title="Quality standards" body="Cleanliness, comfort and safety checks performed for each listing." />
          <Card icon={<HeartHandshake size={22} />} title="Fair prices" body="The price you see is the price you pay. No surprises at checkout." />
          <Card icon={<Users size={22} />} title="Real support" body="A real human is one message away — any day of the week." />
        </div>
      </section>

      <HostCTA />

      <section className="container-px text-center mb-20">
        <p className="text-ink-500">
          Have a question?{" "}
          <Link href="/contact" className="text-brand-600 font-medium hover:underline">
            Talk to us →
          </Link>
        </p>
      </section>
    </div>
  );
}

function Card({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="card p-6">
      <div className="w-11 h-11 rounded-2xl grid place-items-center bg-brand-500 text-white mb-4">
        {icon}
      </div>
      <div className="font-semibold mb-1">{title}</div>
      <p className="text-sm text-ink-500 leading-relaxed">{body}</p>
    </div>
  );
}
