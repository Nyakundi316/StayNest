import { getProperties } from "@/lib/data";
import PropertyCard from "./PropertyCard";
import SectionHeader from "./SectionHeader";
import { ListingType } from "@/lib/types";

interface Props {
  listingType?: ListingType;
  title?: string;
  subtitle?: string;
  ctaHref?: string;
  ctaLabel?: string;
  eyebrow?: string;
  limit?: number;
}

export default async function FeaturedStays({
  listingType = "short_stay",
  title = "Stays our guests love",
  subtitle = "Carefully picked homes with consistently glowing reviews.",
  eyebrow = "Featured",
  ctaHref,
  ctaLabel,
  limit = 4
}: Props) {
  let featured: Awaited<ReturnType<typeof getProperties>> = [];
  try {
    const all = await getProperties({ listingType });
    featured = all.slice(0, limit);
  } catch {
    featured = [];
  }

  const href = ctaHref ?? `/listings?listingType=${listingType}`;
  const label = ctaLabel ?? (listingType === "sale" ? "See all for sale" : listingType === "lease" ? "See all to lease" : "Browse all stays");

  return (
    <section className="container-px py-20">
      <SectionHeader
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        ctaHref={href}
        ctaLabel={label}
      />
      {featured.length === 0 ? (
        <div className="card p-10 text-center text-ink-500">
          Nothing here yet — add a listing in the admin dashboard.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((p, i) => (
            <PropertyCard key={p.id} property={p} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}
