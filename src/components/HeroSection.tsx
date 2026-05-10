"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import SearchBar from "./SearchBar";
import { ListingType } from "@/lib/types";

const TABS: { value: ListingType; label: string }[] = [
  { value: "short_stay", label: "Stay" },
  { value: "sale",       label: "Buy" },
  { value: "lease",      label: "Lease" }
];

export default function HeroSection() {
  const [tab, setTab] = useState<ListingType>("short_stay");

  return (
    <section className="relative min-h-[90vh] flex items-end overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=2000)"
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-900/85 via-ink-900/45 to-ink-900/30" />

      <div className="relative container-px pb-12 pt-32 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-white max-w-3xl"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-medium tracking-wide mb-5">
            ✨ Stay, buy or lease — all on StayNest
          </span>
          <h1 className="h-display text-4xl sm:text-5xl lg:text-6xl leading-[1.05]">
            Find a place that feels{" "}
            <em className="not-italic text-brand-300">like home</em>.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-white/85 max-w-xl">
            Cosy short stays, homes for sale and properties to lease — all
            verified by StayNest.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mt-8"
        >
          {/* Tab picker */}
          <div className="inline-flex bg-white/15 backdrop-blur rounded-full p-1 mb-3">
            {TABS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTab(t.value)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  tab === t.value
                    ? "bg-white text-ink-900"
                    : "text-white/90 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <SearchBar activeListingType={tab} />
        </motion.div>
      </div>
    </section>
  );
}
