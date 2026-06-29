import { PageShell } from "@/components/ui/PageShell";

export default function OfflinePage() {
  return (
    <PageShell mode="planning">
      <div className="mx-auto max-w-md py-24 text-center">
        <h1 className="text-2xl font-semibold tracking-tighter2">You&rsquo;re offline</h1>
        <p className="ps-muted mt-2 text-[15px]">
          Peak Signal cached your last itinerary for airplane mode. Reconnect to refresh live prices.
        </p>
      </div>
    </PageShell>
  );
}
