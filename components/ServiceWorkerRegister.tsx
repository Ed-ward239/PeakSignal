"use client";

import { useEffect } from "react";

/**
 * Registers the service worker for offline resilience (spec §4.3) — production
 * only. In development it actively UNREGISTERS any service worker and clears
 * its caches: a SW left behind by a previous production run (`npm start`) on
 * the same origin would otherwise keep serving stale /_next chunks to the dev
 * server ("module factory is not available" errors).
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations()
        .then((regs) => Promise.all(regs.map((r) => r.unregister())))
        .then((unregistered) => {
          if (unregistered.some(Boolean)) console.info("[sw] unregistered stale service worker (dev)");
        })
        .catch(() => {});
      if ("caches" in window) {
        caches.keys().then((keys) => keys.forEach((k) => caches.delete(k))).catch(() => {});
      }
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* registration is best-effort */
    });
  }, []);
  return null;
}
