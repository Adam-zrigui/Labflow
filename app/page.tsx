import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken } from "@/lib/session";
import { FlaskConical, TestTubeDiagonal, FileStack, ShieldCheck } from "lucide-react";

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
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm shadow-primary/20">
              <FlaskConical className="size-4.5" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight">
              LabFlow
            </span>
          </div>
          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground shadow-sm shadow-primary/20 transition-colors hover:bg-primary/90"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6">
          <FlaskConical className="size-7" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Lab workflow management
        </h1>
        <p className="mt-4 max-w-lg text-lg text-muted-foreground">
          Track specimens from receipt to report. Manage templates, samples, and
          approvals — all in one place.
        </p>
        <div className="mt-8 flex items-center gap-3">
          <Link
            href="/signup"
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm shadow-primary/20 transition-colors hover:bg-primary/90"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="rounded-lg border px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Log in
          </Link>
        </div>

        {/* Feature bullets */}
        <div className="mt-16 grid max-w-2xl gap-6 sm:grid-cols-3">
          <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-5 text-center shadow-xs">
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <FileStack className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Workflow templates</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Define multi-stage processes with role-based gates
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-5 text-center shadow-xs">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <TestTubeDiagonal className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Sample tracking</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Register specimens and advance them through each stage
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-5 text-center shadow-xs">
            <div className="flex size-10 items-center justify-center rounded-lg bg-green-50 text-green-600 dark:bg-green-950/50 dark:text-green-400">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Role-based access</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Control who can register, approve, and manage samples
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
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
