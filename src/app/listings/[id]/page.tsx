"use client";

import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Star, MapPin, BedDouble, Bath, Users } from "lucide-react";
import { getProperty, similarProperties } from "@/lib/data";
import { notFound } from "next/navigation";
import AmenityBadge from "@/components/AmenityBadge";
import BookingCard from "@/components/BookingCard";
import PropertyCard from "@/components/PropertyCard";
import SectionHeader from "@/components/SectionHeader";

export default function PropertyPage() {
  const params = useParams<{ id: string }>();
  const property = getProperty(params.id);
  if (!property) return notFound();

  const similar = similarProperties(property.id);

  return (
    <div className="pt-24 pb-16">
      <div className="container-px">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="h-display text-3xl sm:text-4xl">{property.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-600">
            <span className="flex items-center gap-1">
              <Star size={14} className="fill-brand-500 text-brand-500" />
              <span className="font-medium">{property.rating.toFixed(2)}</span>
              <span className="text-ink-500">({property.reviews} reviews)</span>
            </span>
            <span className="flex items-center gap-1">
              <MapPin size={14} className="text-ink-400" />
              {property.location}
            </span>
          </div>
        </motion.div>

        {/* Gallery */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-3 rounded-3xl overflow-hidden">
          <div className="md:col-span-2 md:row-span-2 aspect-[4/3] md:aspect-auto md:h-[480px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={property.images[0]} alt="" className="w-full h-full object-cover" />
          </div>
          {property.images.slice(1, 5).map((src, i) => (
            <div key={i} className="hidden md:block aspect-[4/3] h-[235px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_22rem] gap-10 mt-10">
          <div>
            <div className="flex flex-wrap gap-3 pb-6 border-b border-ink-100">
              <Stat icon={<BedDouble size={16} />} label={`${property.bedrooms} bed${property.bedrooms > 1 ? "s" : ""}`} />
              <Stat icon={<Bath size={16} />} label={`${property.bathrooms} bath${property.bathrooms > 1 ? "s" : ""}`} />
              <Stat icon={<Users size={16} />} label={`Up to ${property.guests} guest${property.guests > 1 ? "s" : ""}`} />
              <Stat label={property.type} />
            </div>

            <section className="py-6 border-b border-ink-100">
              <h2 className="text-xl font-semibold mb-2">About this stay</h2>
              <p className="text-ink-600 leading-relaxed whitespace-pre-line">{property.description}</p>
            </section>

            <section className="py-6 border-b border-ink-100">
              <h2 className="text-xl font-semibold mb-4">What this place offers</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {property.amenities.map((a) => (
                  <AmenityBadge key={a} name={a} />
                ))}
              </div>
            </section>

            {property.rules && property.rules.length > 0 && (
              <section className="py-6 border-b border-ink-100">
                <h2 className="text-xl font-semibold mb-3">House rules</h2>
                <ul className="space-y-1.5 text-ink-600">
                  {property.rules.map((r) => (
                    <li key={r} className="flex items-start gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-brand-500 shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="py-6">
              <h2 className="text-xl font-semibold mb-3">Hosted by StayNest</h2>
              <p className="text-ink-600 leading-relaxed">
                StayNest manages this stay end-to-end on behalf of the property owner.
                Our team verifies the listing, handles your booking, and is on hand
                throughout your stay.
              </p>
              <div className="mt-4 flex items-center gap-3 text-sm text-ink-700">
                <div className="w-12 h-12 rounded-full bg-brand-500 grid place-items-center text-white font-semibold">
                  SN
                </div>
                <div>
                  <div className="font-semibold">StayNest team</div>
                  <div className="text-ink-500">Typically responds within 1 hour</div>
                </div>
              </div>
            </section>
          </div>

          <div>
            <BookingCard property={property} />
          </div>
        </div>

        {/* Similar */}
        {similar.length > 0 && (
          <section className="mt-20">
            <SectionHeader
              eyebrow="You might also like"
              title="Similar stays"
              ctaHref="/listings"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {similar.map((p, i) => (
                <PropertyCard key={p.id} property={p} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function Stat({ icon, label }: { icon?: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-ink-50 text-sm text-ink-700">
      {icon && <span className="text-brand-500">{icon}</span>}
      {label}
    </div>
  );
}
