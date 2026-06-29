import type { MetadataRoute } from "next";

/** PWA manifest (spec: installable web app). Served at /manifest.webmanifest. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Peak Signal — Travel Intelligence",
    short_name: "Peak Signal",
    description:
      "Honest travel price tracking with a buy/wait verdict, plus a per-trip AI itinerary planner.",
    start_url: "/",
    display: "standalone",
    background_color: "#0D1117",
    theme_color: "#0D1117",
    orientation: "portrait-primary",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
