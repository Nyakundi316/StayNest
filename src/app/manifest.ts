import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "StayNest",
    short_name: "StayNest",
    description: "Find trusted BnBs, homes for sale, and lease listings across Kenya.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fbf7f2",
    theme_color: "#ef6a2b",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any"
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable"
      }
    ]
  };
}
