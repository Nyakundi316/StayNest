import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/host",
          "/host/",
          "/account",
          "/account/",
          "/api/",
          "/booking/find",
          // Private magic-link routes — no need for these in the index.
          "/booking/*/manage",
          "/booking/*/manage/"
        ]
      }
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base
  };
}
