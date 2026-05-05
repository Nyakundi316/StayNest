import { properties } from "@/lib/data";
import PropertyCard from "./PropertyCard";
import SectionHeader from "./SectionHeader";

export default function FeaturedStays() {
  const featured = properties.slice(0, 4);
  return (
    <section className="container-px py-20">
      <SectionHeader
        eyebrow="Featured"
        title="Stays our guests love"
        subtitle="Carefully picked homes with consistently glowing reviews."
        ctaHref="/listings"
        ctaLabel="Browse all stays"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {featured.map((p, i) => (
          <PropertyCard key={p.id} property={p} index={i} />
        ))}
      </div>
    </section>
  );
}
