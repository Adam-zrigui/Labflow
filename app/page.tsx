import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken } from "@/lib/session";

export default async function LandingPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");
  if (sessionCookie?.value) {
    try {
      await verifySessionToken(sessionCookie.value);
      redirect("/samples");
    } catch {
      // invalid token — show landing
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <span className="text-[15px] font-semibold tracking-tight font-[family-name:var(--font-space-grotesk)]">
            LabFlow
          </span>
          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="border border-primary bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl font-[family-name:var(--font-space-grotesk)]">
          Track samples. Prove every step.
        </h1>
        <p className="mt-4 max-w-lg text-lg text-muted-foreground">
          Configurable lab workflows with a full, immutable audit trail — built
          for teams that need to prove what happened.
        </p>
        <div className="mt-8">
          <Link
            href="/signup"
            className="border border-primary bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Get started &rarr;
          </Link>
        </div>

        {/* Feature bullets */}
        <div className="mt-16 flex flex-col items-start gap-2 text-sm text-muted-foreground">
          <span>⚬ Configurable workflows</span>
          <span>⚬ Immutable audit trail</span>
          <span>⚬ Role-based approvals</span>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        <div className="flex items-center justify-center gap-3">
          <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          <span className="text-muted-foreground/40">·</span>
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <span className="text-muted-foreground/40">·</span>
          <Link href="/impressum" className="hover:text-foreground transition-colors">Impressum</Link>
        </div>
      </footer>
    </div>
  );
}
