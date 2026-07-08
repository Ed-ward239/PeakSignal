"use client";

import { useEffect, useRef, useState } from "react";
import { PageShell } from "@/components/ui/PageShell";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Segmented } from "@/components/ui/Segmented";
import { authClient } from "@/lib/auth/client";
import { cn } from "@/lib/cn";
import { getTheme, setTheme, type Theme } from "@/lib/theme";
import { DEFAULT_SETTINGS, type AlertFrequency, type NotificationSettings } from "@/lib/types";

const SETTINGS_KEY = "peaksignal.settings.v1";

/** iOS-style switch, styled to match the app's atoms (no existing switch atom).
 *  The knob is anchored at left-[2px] and slides via transform — the track keeps
 *  a border in both states so its size never shifts. */
function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full border transition-colors",
        on ? "border-transparent bg-accent" : "bg-[var(--surface-2)] ps-hairline",
      )}
    >
      <span
        className={cn(
          "absolute left-[2px] top-[2px] h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform",
          on ? "translate-x-[20px]" : "translate-x-0",
        )}
      />
    </button>
  );
}

const TYPES: { key: keyof Omit<NotificationSettings, "frequency">; title: string; desc: string }[] = [
  { key: "emailPriceDrop", title: "Price-drop alerts", desc: "When a watched trip falls below your target price." },
  { key: "emailBuySignal", title: "Buy-signal alerts", desc: "When the verdict for a trip flips to BUY." },
  { key: "weeklyDigest", title: "Weekly digest", desc: "A Monday summary of every watched trip." },
];

/**
 * Notification settings (email via Resend — the app's only channel). Signed in →
 * persisted to Postgres through /api/settings so the cron poller can honour
 * them; guest → localStorage, same dual-mode rule as the trips store.
 */
export default function SettingsPage() {
  const { data, isPending } = authClient.useSession();
  const signedIn = Boolean(data?.user);

  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [theme, setThemeState] = useState<Theme>("dark");
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flashSaved = () => {
    setSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), 1600);
  };

  // Theme is device-level (localStorage in both auth modes); applied instantly.
  useEffect(() => setThemeState(getTheme()), []);
  const changeTheme = (t: Theme) => {
    setThemeState(t);
    setTheme(t);
    flashSaved();
  };

  // Load: API when signed in, localStorage otherwise.
  useEffect(() => {
    if (isPending) return;
    let active = true;
    const loadLocal = () => {
      try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        setSettings(raw ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<NotificationSettings>) } : DEFAULT_SETTINGS);
      } catch {
        setSettings(DEFAULT_SETTINGS);
      }
    };
    (async () => {
      if (signedIn) {
        try {
          const r = await fetch("/api/settings");
          if (r.ok) {
            const s = (await r.json()) as NotificationSettings;
            if (active) setSettings({ ...DEFAULT_SETTINGS, ...s });
            return;
          }
        } catch {
          /* fall through to local */
        }
      }
      if (active) loadLocal();
    })();
    return () => { active = false; };
  }, [isPending, signedIn]);

  const update = (patch: Partial<NotificationSettings>) => {
    setSettings((s) => {
      if (!s) return s;
      const next = { ...s, ...patch };
      // Persist optimistically: DB when signed in, localStorage otherwise.
      if (signedIn) {
        fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next),
        }).catch(() => {});
      } else {
        try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      }
      return next;
    });
    flashSaved();
  };

  return (
    <PageShell mode="planning">
      <div className="mx-auto max-w-lg animate-fade-up space-y-4 py-6">
        <div className="flex items-baseline justify-between">
          <h1 className="text-2xl font-semibold tracking-tighter2">Settings</h1>
          <span className={cn("text-[12px] text-accent transition-opacity", saved ? "opacity-100" : "opacity-0")}>
            Saved
          </span>
        </div>

        <Card>
          <SectionTitle>Appearance</SectionTitle>
          <p className="ps-muted mt-1.5 text-[13px]">Applies on this device, signed in or not.</p>
          <Segmented<Theme>
            className="mt-3"
            value={theme}
            onChange={changeTheme}
            options={[
              { value: "dark", label: "Dark" },
              { value: "light", label: "Light" },
            ]}
          />
        </Card>

        {!settings ? (
          <div className="h-64 animate-pulse rounded-2xl bg-[var(--surface-2)]" />
        ) : (
          <>
            <Card>
              <SectionTitle>Notification types</SectionTitle>
              <div className="mt-3 space-y-4">
                {TYPES.map(({ key, title, desc }) => (
                  <div key={key} className="flex items-center gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-medium">{title}</p>
                      <p className="ps-muted text-[13px]">{desc}</p>
                    </div>
                    <Toggle on={settings[key]} onChange={(v) => update({ [key]: v })} label={title} />
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <SectionTitle>Frequency</SectionTitle>
              <p className="ps-muted mt-1.5 text-[13px]">How often alert emails are sent.</p>
              <Segmented<AlertFrequency>
                className="mt-3"
                value={settings.frequency}
                onChange={(frequency) => update({ frequency })}
                options={[
                  { value: "instant", label: "Instant" },
                  { value: "daily", label: "Daily" },
                  { value: "weekly", label: "Weekly" },
                ]}
              />
            </Card>

            {!signedIn && (
              <p className="ps-muted text-center text-[13px]">
                You&rsquo;re not signed in — settings are saved on this device only, and email
                alerts require an account.
              </p>
            )}
          </>
        )}
      </div>
    </PageShell>
  );
}
