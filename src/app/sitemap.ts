import type { MetadataRoute } from "next";
import { createServerClient } from "@/lib/supabase-server";

const STATIC_ROUTES = [
  { path: "/", changeFrequency: "weekly" as const, priority: 1 },
  { path: "/listings", changeFrequency: "daily" as const, priority: 0.9 },
  { path: "/listings?listingType=sale", changeFrequency: "weekly" as const, priority: 0.8 },
  { path: "/listings?listingType=lease", changeFrequency: "weekly" as const, priority: 0.8 },
  { path: "/about", changeFrequency: "monthly" as const, priority: 0.5 },
  { path: "/contact", changeFrequency: "monthly" as const, priority: 0.5 },
  { path: "/booking/find", changeFrequency: "monthly" as const, priority: 0.3 }
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

  const db = createServerClient();
  const { data } = await db
    .from("properties_public")
    .select("id, created_at")
    .order("created_at", { ascending: false });

  const propertyUrls: MetadataRoute.Sitemap = (data ?? []).map((p) => ({
    url: `${base}/listings/${p.id}`,
    lastModified: p.created_at ? new Date(p.created_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.7
  }));

  return [
    ...STATIC_ROUTES.map((r) => ({
      url: `${base}${r.path}`,
      lastModified: new Date(),
      changeFrequency: r.changeFrequency,
      priority: r.priority
    })),
    ...propertyUrls
  ];
}
