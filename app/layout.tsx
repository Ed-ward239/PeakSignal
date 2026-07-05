import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "@/components/store";
import { AuthProvider } from "@/components/AuthProvider";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "Peak Signal — Know when to buy. Know what to do when you get there.",
  description:
    "Travel intelligence: honest flight, hotel & Airbnb price tracking with a data-driven buy/wait verdict, plus a per-trip AI itinerary planner.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Peak Signal" },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAFA" },
    { media: "(prefers-color-scheme: dark)", color: "#0D1117" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AuthProvider>
          <StoreProvider>{children}</StoreProvider>
        </AuthProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
