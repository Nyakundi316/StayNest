"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { popularLocations } from "@/lib/data";
import SectionHeader from "./SectionHeader";

export default function PopularLocations() {
  return (
    <section className="container-px py-20">
      <SectionHeader
        eyebrow="Popular"
        title="Where guests are heading"
        subtitle="From bustling Nairobi to the quiet shores of Diani — pick your vibe."
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {popularLocations.map((loc, i) => (
          <motion.div
            key={loc.name}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
          >
            <Link
              href={`/listings?location=${encodeURIComponent(loc.name)}`}
              className="block group"
            >
              <div className="relative aspect-square overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={loc.image}
                  alt={loc.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-900/70 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <div className="font-semibold">{loc.name}</div>
                  <div className="text-xs text-white/80">{loc.count} stays</div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
