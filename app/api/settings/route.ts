import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_SETTINGS, type AlertFrequency, type NotificationSettings } from "@/lib/types";

/**
 * Per-user notification settings (Settings page). Requires a Neon Auth session;
 * guests keep their settings in localStorage and never call this. The cron
 * poller reads the same table to decide which alert emails to send.
 */

const FREQUENCIES: AlertFrequency[] = ["instant", "daily", "weekly"];

function toClient(s: {
  emailPriceDrop: boolean; emailBuySignal: boolean; weeklyDigest: boolean; frequency: string;
}): NotificationSettings {
  return {
    emailPriceDrop: s.emailPriceDrop,
    emailBuySignal: s.emailBuySignal,
    weeklyDigest: s.weeklyDigest,
    frequency: FREQUENCIES.includes(s.frequency as AlertFrequency)
      ? (s.frequency as AlertFrequency)
      : "instant",
  };
}

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const row = await prisma.userSettings.findUnique({ where: { userId: session.user.id } });
  return NextResponse.json(row ? toClient(row) : DEFAULT_SETTINGS);
}

export async function PUT(req: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const b = (await req.json()) as Partial<NotificationSettings>;
  const data = {
    emailPriceDrop: Boolean(b.emailPriceDrop ?? DEFAULT_SETTINGS.emailPriceDrop),
    emailBuySignal: Boolean(b.emailBuySignal ?? DEFAULT_SETTINGS.emailBuySignal),
    weeklyDigest: Boolean(b.weeklyDigest ?? DEFAULT_SETTINGS.weeklyDigest),
    frequency: FREQUENCIES.includes(b.frequency as AlertFrequency)
      ? (b.frequency as AlertFrequency)
      : DEFAULT_SETTINGS.frequency,
  };

  const row = await prisma.userSettings.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, ...data },
    update: data,
  });
  return NextResponse.json(toClient(row));
}
