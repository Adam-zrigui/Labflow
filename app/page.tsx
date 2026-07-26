import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LabFlow — Lab workflow management for operational teams",
  description:
    "Track specimens through your lab's pipeline with custom workflows, role-based approvals, instrument integrations, and append-only audit logs.",
};

const plans = [
  {
    name: "Starter",
    price: "Free",
    description: "For small labs getting started.",
    features: [
      "Up to 100 samples / month",
      "5 workflow templates",
      "3 team members",
    ],
    cta: { label: "Start free", href: "/signup" },
    featured: false,
  },
  {
    name: "Pro",
    price: "$99",
    period: "/month",
    description: "For growing labs that need more throughput.",
    features: [
      "Up to 1,000 samples / month",
      "20 workflow templates",
      "10 team members",
      "Instrument webhook integration",
    ],
    cta: { label: "Start free trial", href: "/signup" },
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For labs with high-volume or specialized needs.",
    features: [
      "Unlimited samples",
      "Unlimited workflow templates",
      "Unlimited team members",
      "Priority support",
      "On-premise deployment available",
    ],
    cta: { label: "Contact us", href: "/signup" },
    featured: false,
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-full flex-col">
      {/* Sticky header */}
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-sm font-semibold tracking-tight">LabFlow</span>
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-8 items-center justify-center rounded-lg bg-foreground px-3.5 text-sm font-medium text-background transition-all hover:opacity-90 active:scale-95"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* ───── Hero ───── */}
        <section className="relative mx-auto max-w-5xl px-6 pt-24 pb-20 text-center sm:pt-32 sm:pb-24 overflow-hidden">
          {/* Decorative background gradient */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
          >
            <div
              className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#c4c4c4] to-[#e0e0e0] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem] dark:from-[#3a3a3a] dark:to-[#1f1f1f]"
              style={{
                clipPath:
                  "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
              }}
            />
          </div>

          {/* Floating decorative dots */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-8 top-32 h-2 w-2 rounded-full bg-muted-foreground/20 animate-pulse sm:left-16"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute right-12 top-48 h-1.5 w-1.5 rounded-full bg-muted-foreground/15 animate-pulse [animation-delay:1s] sm:right-24"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/4 bottom-12 h-2.5 w-2.5 rounded-full bg-muted-foreground/10 animate-pulse [animation-delay:2s]"
          />

          {/* Eyebrow */}
          <p className="mb-4 inline-flex items-center rounded-full border bg-muted/50 px-3.5 py-1 text-xs font-medium text-muted-foreground">
            Built for compliance-ready laboratories
          </p>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Lab workflow management{" "}
            <span className="bg-gradient-to-r from-foreground via-foreground/80 to-muted-foreground bg-clip-text text-transparent">
              for operational teams
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            Track specimens through your lab&apos;s pipeline — from sample receipt to completed
            report. Define custom workflows, enforce role-based approvals, and stay
            audit-ready with every action recorded.
          </p>

          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-foreground px-5 text-sm font-medium text-background transition-all hover:opacity-90 active:scale-95"
            >
              Start free trial
            </Link>
            <Link
              href="/login"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-input bg-background px-5 text-sm font-medium transition-colors hover:bg-muted active:scale-95"
            >
              Sign in
            </Link>
          </div>

          {/* Stats row */}
          <div className="mx-auto mt-16 grid max-w-lg grid-cols-3 gap-8 sm:mt-20">
            <div>
              <p className="text-2xl font-bold tracking-tight">100%</p>
              <p className="text-xs text-muted-foreground mt-0.5">Audit trail</p>
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight">&lt;5s</p>
              <p className="text-xs text-muted-foreground mt-0.5">Stage transitions</p>
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight">SOC 2</p>
              <p className="text-xs text-muted-foreground mt-0.5">Compliant</p>
            </div>
          </div>
        </section>

        {/* ───── Features ───── */}
        <section className="mx-auto max-w-5xl px-6 pb-20 sm:pb-28">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Everything you need to run your lab
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              From sample intake to final report — one platform.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <div className="group rounded-xl border bg-card p-6 transition-all hover:shadow-sm hover:-translate-y-0.5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5 text-sm font-bold text-primary/60 group-hover:bg-primary/10 transition-colors">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold mb-1.5">Workflow templates</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Define multi-stage pipelines with role-based gates, automated background jobs, and
                per-stage approval controls.
              </p>
            </div>

            <div className="group rounded-xl border bg-card p-6 transition-all hover:shadow-sm hover:-translate-y-0.5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5 text-sm font-bold text-primary/60 group-hover:bg-primary/10 transition-colors">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold mb-1.5">Sample tracking</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Register samples, advance through stages, and view a complete timeline with audit
                logs for every transition.
              </p>
            </div>

            <div className="group rounded-xl border bg-card p-6 transition-all hover:shadow-sm hover:-translate-y-0.5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5 text-sm font-bold text-primary/60 group-hover:bg-primary/10 transition-colors">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold mb-1.5">Audit &amp; compliance</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every action is recorded in an append-only audit log. Stay inspection-ready with
                full traceability.
              </p>
            </div>
          </div>
        </section>

        {/* ───── Pricing ───── */}
        <section className="border-t bg-muted/20 px-6 py-20 sm:py-28">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 text-center">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Simple, transparent pricing
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Start free. Upgrade when you need more.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-3 items-start">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative rounded-xl border bg-card p-6 ${
                    plan.featured
                      ? "ring-2 ring-foreground shadow-sm -translate-y-1"
                      : ""
                  }`}
                >
                  {plan.featured && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-foreground px-3 py-0.5 text-[11px] font-medium text-background">
                      Most popular
                    </span>
                  )}

                  <h3 className="text-sm font-semibold mb-1">{plan.name}</h3>
                  <div className="mb-1">
                    <span className="text-3xl font-bold tracking-tight">{plan.price}</span>
                    {plan.period && (
                      <span className="text-sm text-muted-foreground ml-0.5">{plan.period}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-5">{plan.description}</p>

                  <ul className="mb-6 space-y-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <svg
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground/60"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={plan.cta.href}
                    className={`inline-flex h-9 w-full items-center justify-center rounded-lg text-sm font-medium transition-all active:scale-95 ${
                      plan.featured
                        ? "bg-foreground text-background hover:opacity-90"
                        : "border border-input bg-background hover:bg-muted"
                    }`}
                  >
                    {plan.cta.label}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} LabFlow
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
