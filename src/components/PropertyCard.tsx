"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Star, MapPin } from "lucide-react";
import { Property } from "@/lib/types";
import { clientPricePerNight, formatKsh } from "@/lib/pricing";

interface Props {
  property: Property;
  index?: number;
}

export default function PropertyCard({ property, index = 0 }: Props) {
  const price = clientPricePerNight(property);

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
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/95 text-xs font-medium text-ink-700">
            {property.type}
          </div>
          {!property.available && (
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-ink-900/85 text-xs font-medium text-white">
              Booked
            </div>
          )}
        </div>

        <div className="px-1 pt-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold text-ink-900 line-clamp-1">
              {property.name}
            </h3>
            <span className="flex items-center gap-1 text-sm shrink-0">
              <Star size={14} className="fill-brand-500 text-brand-500" />
              <span>{property.rating.toFixed(2)}</span>
            </span>
          </div>
          <div className="mt-1 text-sm text-ink-500 flex items-center gap-1">
            <MapPin size={12} /> {property.location}
          </div>
          <div className="mt-2 text-sm">
            <span className="font-semibold text-ink-900">{formatKsh(price)}</span>
            <span className="text-ink-500"> / night</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
