import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase-server";
import { mapProperty } from "@/lib/data";
import { clientPriceFor } from "@/lib/pricing";

type RouteParams = Promise<{ id: string }>;

async function fetchProperty(id: string) {
  const db = createServerClient();
  const { data } = await db
    .from("properties_public")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ? mapProperty(data) : null;
}

export async function generateMetadata(
  { params }: { params: RouteParams }
): Promise<Metadata> {
  const { id } = await params;
  const property = await fetchProperty(id);
  if (!property) return { title: "Listing not found — StayNest" };

  const price = clientPriceFor(property);
  const title = `${property.name} — ${property.location} | StayNest`;
  const description =
    property.description?.slice(0, 155) ||
    `${property.bedrooms}-bed ${property.type.toLowerCase()} in ${property.location}, from KSH ${price.amount.toLocaleString("en-KE")}${price.unit}.`;
  const ogImage = property.images?.[0];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: ogImage ? [{ url: ogImage, alt: property.name }] : undefined
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : undefined
    }
  };
}

export default async function ListingLayout({
  children, params
}: { children: React.ReactNode; params: RouteParams }) {
  const { id } = await params;
  const property = await fetchProperty(id);

  return (
    <>
      {property && <JsonLd property={property} />}
      {children}
    </>
  );
}

function JsonLd({ property }: { property: ReturnType<typeof mapProperty> }) {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const url = `${base}/listings/${property.id}`;
  const price = clientPriceFor(property);

  // Short stays are best modelled as LodgingBusiness for Google's rich
  // results. Sale and lease listings are real-estate transactions, so we
  // model them as a generic Product with an Offer.
  const json =
    property.listingType === "short_stay"
      ? lodgingBusiness(property, url, price.amount)
      : realEstateProduct(property, url, price);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}

function lodgingBusiness(
  property: ReturnType<typeof mapProperty>,
  url: string,
  pricePerNight: number
) {
  return {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: property.name,
    description: property.description,
    url,
    image: property.images,
    address: {
      "@type": "PostalAddress",
      addressLocality: property.city,
      addressCountry: "KE",
      streetAddress: property.location
    },
    priceRange: `KSH ${pricePerNight.toLocaleString("en-KE")}+ / night`,
    numberOfRooms: property.bedrooms,
    petsAllowed: property.rules?.some((r) => /pet/i.test(r) && !/no pet/i.test(r)) ?? false,
    amenityFeature: (property.amenities ?? []).map((a) => ({
      "@type": "LocationFeatureSpecification",
      name: a,
      value: true
    })),
    aggregateRating:
      property.reviews > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: property.rating,
            reviewCount: property.reviews
          }
        : undefined
  };
}

function realEstateProduct(
  property: ReturnType<typeof mapProperty>,
  url: string,
  price: { amount: number; unit: string }
) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: property.name,
    description: property.description,
    url,
    image: property.images,
    category: property.listingType === "sale" ? "Real estate sale" : "Real estate lease",
    offers: {
      "@type": "Offer",
      price: price.amount,
      priceCurrency: "KES",
      url,
      availability: property.available
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      priceSpecification:
        property.listingType === "lease"
          ? {
              "@type": "UnitPriceSpecification",
              price: price.amount,
              priceCurrency: "KES",
              referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "MON" }
            }
          : undefined
    }
  };
}
