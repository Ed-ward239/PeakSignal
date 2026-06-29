"use client";

import { useState } from "react";
import { Github, Mail } from "lucide-react";
import { PageShell } from "@/components/ui/PageShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

/**
 * Sign-in (spec §5 — NextAuth.js + GitHub OAuth + magic link). UI scaffold;
 * wire to NextAuth providers in app/api/auth to activate. The demo does not
 * gate the app behind auth.
 */
export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <PageShell mode="planning">
      <div className="mx-auto max-w-sm py-16">
        <h1 className="text-center text-2xl font-semibold tracking-tighter2">Welcome to Peak Signal</h1>
        <p className="ps-muted mt-1.5 text-center text-[15px]">No passwords. Sign in and start tracking.</p>
        <Card className="mt-8 space-y-3">
          <Button variant="secondary" className="w-full"><Github size={17} /> Continue with GitHub</Button>
          <div className="flex items-center gap-3 py-1">
            <span className="ps-hairline h-px flex-1 border-t" />
            <span className="ps-muted text-[12px]">or</span>
            <span className="ps-hairline h-px flex-1 border-t" />
          </div>
          {sent ? (
            <p className="ps-muted py-2 text-center text-[14px]">Check {email} for a magic link.</p>
          ) : (
            <>
              <input className="ps-field w-full" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Button className="w-full" onClick={() => email && setSent(true)}><Mail size={16} /> Email me a magic link</Button>
            </>
          )}
        </Card>
        <p className="ps-muted mt-4 text-center text-[12px]">Demo build — auth is illustrative.</p>
      </div>
    </PageShell>
  );
}
