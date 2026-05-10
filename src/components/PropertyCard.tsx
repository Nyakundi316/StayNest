"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Star, MapPin } from "lucide-react";
import { Property } from "@/lib/types";
import { clientPriceFor, formatKsh, formatKshCompact } from "@/lib/pricing";

interface Props {
  property: Property;
  index?: number;
}

const LISTING_BADGE: Record<Property["listingType"], { label: string; cls: string }> = {
  short_stay: { label: "Short stay", cls: "bg-white/95 text-ink-700" },
  sale:       { label: "For sale",   cls: "bg-amber-100 text-amber-800" },
  lease:      { label: "For lease",  cls: "bg-emerald-100 text-emerald-800" }
};

export default function PropertyCard({ property, index = 0 }: Props) {
  const { amount, unit } = clientPriceFor(property);
  const badge = LISTING_BADGE[property.listingType];

  // Use compact format for big sale prices, exact for stays/leases
  const priceText = property.listingType === "sale"
    ? formatKshCompact(amount)
    : formatKsh(amount);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.05, 0.25) }}
      className="group"
    >
      <Link href={`/listings/${property.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-ink-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={property.images[0]}
            alt={property.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute top-3 left-3 flex gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${badge.cls}`}>
              {badge.label}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-white/95 text-ink-700 text-xs font-medium">
              {property.type}
            </span>
          </div>
          {!property.available && (
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-ink-900/85 text-xs font-medium text-white">
              Unavailable
            </div>
          )}
        </div>

        <div className="px-1 pt-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold text-ink-900 line-clamp-1">
              {property.name}
            </h3>
            {property.rating > 0 && (
              <span className="flex items-center gap-1 text-sm shrink-0">
                <Star size={14} className="fill-brand-500 text-brand-500" />
                <span>{property.rating.toFixed(2)}</span>
              </span>
            )}
          </div>
          <div className="mt-1 text-sm text-ink-500 flex items-center gap-1">
            <MapPin size={12} /> {property.location}
          </div>
          <div className="mt-2 text-sm">
            <span className="font-semibold text-ink-900">{priceText}</span>
            {unit && <span className="text-ink-500">{" "}{unit}</span>}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
