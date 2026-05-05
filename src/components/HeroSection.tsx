"use client";

import { motion } from "framer-motion";
import SearchBar from "./SearchBar";

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-end overflow-hidden">
      {/* Background image */}
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
            ✨ Hand-picked stays across Kenya
          </span>
          <h1 className="h-display text-4xl sm:text-5xl lg:text-6xl leading-[1.05]">
            Find a place that feels <em className="not-italic text-brand-300">like home</em>.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-white/85 max-w-xl">
            Cosy studios, beachfront villas and quiet getaways — all verified by StayNest.
            Book in minutes, stay with confidence.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mt-8"
        >
          <SearchBar />
        </motion.div>
      </div>
    </section>
  );
}
