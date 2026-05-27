"use client";

import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import { motion } from "framer-motion";
import { Star, MapPin, BedDouble, Bath, Users } from "lucide-react";
import { getProperty, similarProperties } from "@/lib/data";
import AmenityBadge from "@/components/AmenityBadge";
import BookingCard from "@/components/BookingCard";
import InquiryCard from "@/components/InquiryCard";
import PropertyCard from "@/components/PropertyCard";
import RecentlyViewed from "@/components/RecentlyViewed";
import RestockNotify from "@/components/RestockNotify";
import SectionHeader from "@/components/SectionHeader";
import SocialShare from "@/components/SocialShare";
import type { Property, Review } from "@/lib/types";

export default function PropertyPage() {
  const params = useParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null | undefined>(undefined);
  const [similar, setSimilar] = useState<Property[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const p = await getProperty(params.id);
      if (!alive) return;
      setProperty(p);
      if (p) {
        const [sim, revRes] = await Promise.allSettled([
          similarProperties(p.id),
          fetch(`/api/reviews/${p.id}`).then((r) => r.json())
        ]);
        if (!alive) return;
        if (sim.status === "fulfilled") setSimilar(sim.value);
        if (revRes.status === "fulfilled") setReviews(revRes.value.reviews ?? []);
      }
    })();
    return () => {
      alive = false;
    };
  }, [params.id]);

  if (property === undefined) {
    return (
      <div className="pt-32 container-px">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-ink-100 rounded w-1/2" />
          <div className="aspect-[16/9] bg-ink-100 rounded-3xl" />
          <div className="h-4 bg-ink-100 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (property === null) return notFound();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const shareUrl = appUrl ? `${appUrl}/listings/${property.id}` : undefined;

  return (
    <div className="pt-24 pb-16">
      <div className="container-px">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="h-display text-3xl sm:text-4xl">{property.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-600">
            {!property.available && (
              <span className="rounded-full bg-ink-900 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-white">
                Currently unavailable
              </span>
            )}
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

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_22rem] gap-10 mt-10">
          <div>
            <div className="flex flex-wrap gap-3 pb-6 border-b border-ink-100">
              <Stat icon={<BedDouble size={16} />} label={`${property.bedrooms} bed${property.bedrooms > 1 ? "s" : ""}`} />
              <Stat icon={<Bath size={16} />} label={`${property.bathrooms} bath${property.bathrooms > 1 ? "s" : ""}`} />
              {property.listingType === "short_stay" && property.guests > 0 && (
                <Stat icon={<Users size={16} />} label={`Up to ${property.guests} guest${property.guests > 1 ? "s" : ""}`} />
              )}
              {property.listingType === "lease" && property.leaseTermMonths && (
                <Stat label={`${property.leaseTermMonths}-month lease`} />
              )}
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

            {reviews.length > 0 && (
              <section className="py-6 border-b border-ink-100">
                <div className="flex items-baseline gap-3 mb-5">
                  <h2 className="text-xl font-semibold">Reviews</h2>
                  <span className="flex items-center gap-1 text-sm text-ink-500">
                    <Star size={13} className="fill-brand-400 text-brand-400" />
                    {property.rating.toFixed(1)} &middot; {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="space-y-5">
                  {reviews.map((rv) => (
                    <ReviewCard key={rv.id} review={rv} />
                  ))}
                </div>
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
            <div className="space-y-4">
              {property.available ? (
                property.listingType === "short_stay" ? (
                  <BookingCard property={property} />
                ) : (
                  <InquiryCard property={property} />
                )
              ) : (
                <RestockNotify propertyId={property.id} propertyName={property.name} />
              )}
              <SocialShare
                title={property.name}
                image={property.images[0]}
                url={shareUrl}
              />
            </div>
          </div>
        </div>

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

        <RecentlyViewed currentPropertyId={property.id} />
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

function ReviewCard({ review }: { review: Review }) {
  const initials = review.guestName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const date = new Date(review.createdAt).toLocaleDateString("en-KE", { month: "short", year: "numeric" });
  return (
    <div className="flex gap-4">
      <div className="w-10 h-10 rounded-full bg-ink-100 grid place-items-center text-xs font-semibold text-ink-600 shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-sm">{review.guestName}</span>
          <span className="text-xs text-ink-400">{date}</span>
        </div>
        <div className="flex gap-0.5 mt-1 mb-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              size={12}
              className={s <= review.rating ? "fill-brand-400 text-brand-400" : "fill-ink-100 text-ink-100"}
            />
          ))}
        </div>
        {review.comment && (
          <p className="text-sm text-ink-600 leading-relaxed">{review.comment}</p>
        )}
      </div>
    </div>
  );
}
