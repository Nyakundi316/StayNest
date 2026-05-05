"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Sparkles, Wallet, Headphones } from "lucide-react";

const items = [
  {
    icon: <ShieldCheck size={22} />,
    title: "Verified stays",
    body: "Every property is reviewed by our team before it goes live."
  },
  {
    icon: <Sparkles size={22} />,
    title: "Hand-picked quality",
    body: "We only work with hosts who care about the details."
  },
  {
    icon: <Wallet size={22} />,
    title: "Fair, simple pricing",
    body: "No hidden fees. The price you see is the price you pay."
  },
  {
    icon: <Headphones size={22} />,
    title: "Always-on support",
    body: "Reach a real person any day of the week, before and after your stay."
  }
];

export default function WhyChoose() {
  return (
    <section className="bg-white border-y border-ink-100">
      <div className="container-px py-20">
        <div className="max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-brand-600 mb-2">
            Why StayNest
          </div>
          <h2 className="h-display text-3xl sm:text-4xl">
            A smoother way to find your next stay.
          </h2>
        </div>
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((it, i) => (
            <motion.div
              key={it.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="p-6 rounded-3xl bg-cream"
            >
              <div className="w-11 h-11 rounded-2xl grid place-items-center bg-brand-500 text-white mb-4">
                {it.icon}
              </div>
              <div className="font-semibold mb-1">{it.title}</div>
              <p className="text-sm text-ink-500 leading-relaxed">{it.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
