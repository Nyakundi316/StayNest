import Link from "next/link";
import Button from "./Button";

export default function HostCTA() {
  return (
    <section className="container-px py-20">
      <div
        className="relative overflow-hidden rounded-3xl p-8 sm:p-12 lg:p-16 text-white"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(17,21,28,0.75), rgba(17,21,28,0.4)), url(https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=2000)",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        <div className="max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-brand-300 mb-3">
            For property owners
          </div>
          <h2 className="h-display text-3xl sm:text-4xl lg:text-5xl leading-tight">
            Have a property? Let StayNest fill your calendar.
          </h2>
          <p className="mt-4 text-white/85 max-w-xl">
            We handle bookings, guest communication and pricing strategy. You set
            your base rate — we take care of the rest and pay out automatically.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button href="/admin/add-property" size="lg">List a property</Button>
            <Link
              href="/about"
              className="btn btn-secondary px-6 py-3 text-base bg-white/15 backdrop-blur border-white/30 text-white hover:bg-white/25"
            >
              Learn how it works
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
