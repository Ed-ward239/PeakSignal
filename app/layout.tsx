import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "@/components/store";
import { AuthProvider } from "@/components/AuthProvider";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "Peak Signal — Time your trip right",
  description:
    "We track flight and hotel prices, tell you when to book, and plan your days once you do.",
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

/**
 * Applies the stored theme (Settings → Appearance) to <html> before first paint
 * so there's no light/dark flash. Dark is the default. Kept inline & tiny; must
 * mirror lib/theme.ts (THEME_KEY).
 */
const themeScript = `try{if((localStorage.getItem("peaksignal.theme.v1")||"dark")==="dark")document.documentElement.classList.add("dark")}catch(e){document.documentElement.classList.add("dark")}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans antialiased">
        <AuthProvider>
          <StoreProvider>{children}</StoreProvider>
        </AuthProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
