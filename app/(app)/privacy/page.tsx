import { PageShell } from "@/components/ui/PageShell";
import { Card } from "@/components/ui/Card";

export const metadata = { title: "Privacy — Peak Signal" };

/**
 * Privacy notice (static). Written to match what the app actually does — no
 * boilerplate claims about data we don't collect or processing we don't do.
 */
export default function PrivacyPage() {
  return (
    <PageShell mode="planning">
      <div className="mx-auto max-w-lg animate-fade-up space-y-4 py-6">
        <h1 className="text-2xl font-semibold tracking-tighter2">Privacy</h1>
        <p className="ps-muted text-[14px]">
          Peak Signal tracks travel prices and plans trips. Here is exactly what it
          stores and shares — nothing more.
        </p>

        <Card>
          <div className="space-y-5 text-[14px] leading-relaxed">
            <section>
              <h2 className="font-semibold">Your account</h2>
              <p className="ps-muted mt-1">
                Signing in uses Google via Neon Auth. We receive your name, email
                address, and profile photo — nothing else from your Google account.
                Sessions are stored as secure cookies.
              </p>
            </section>

            <section>
              <h2 className="font-semibold">Your trips</h2>
              <p className="ps-muted mt-1">
                Signed in, your watchlist is stored in our database (Neon Postgres)
                so it syncs across devices. As a guest, trips live only in your
                browser&rsquo;s local storage and never leave your device. Itineraries
                and share links are kept in your browser in both modes.
              </p>
            </section>

            <section>
              <h2 className="font-semibold">Price data</h2>
              <p className="ps-muted mt-1">
                Flight, hotel, and Airbnb prices are fetched from third-party APIs
                (Booking.com and Airbnb via RapidAPI). Those requests contain only
                the route, dates, and traveller count — never your identity.
              </p>
            </section>

            <section>
              <h2 className="font-semibold">Emails</h2>
              <p className="ps-muted mt-1">
                Alert emails (via Resend) are sent only for the notification types
                and frequency you choose in Settings. Turn them all off any time.
              </p>
            </section>

            <section>
              <h2 className="font-semibold">What we don&rsquo;t do</h2>
              <p className="ps-muted mt-1">
                No ads, no selling or sharing of personal data, no tracking beyond
                what&rsquo;s described above, no commissions steering our buy/wait
                verdicts.
              </p>
            </section>

            <section>
              <h2 className="font-semibold">Deleting your data</h2>
              <p className="ps-muted mt-1">
                Delete trips from your watchlist at any time; guest data clears with
                your browser storage. To delete your account and everything tied to
                it, contact us and we&rsquo;ll remove it promptly.
              </p>
            </section>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
