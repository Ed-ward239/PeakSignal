import type { MetadataRoute } from "next";

/** PWA manifest (spec: installable web app). Served at /manifest.webmanifest. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Peak Signal — Travel Intelligence",
    short_name: "Peak Signal",
    description:
      "We track flight and hotel prices, tell you when to book, and plan your days once you do.",
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
