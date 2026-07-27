import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { FlaskConical, TestTubeDiagonal, FileStack, CreditCard, Settings, Users, Menu, X, ExternalLink } from "lucide-react";

const navItems = [
  { label: "Samples", href: "/samples", icon: TestTubeDiagonal },
  { label: "Templates", href: "/templates", icon: FileStack },
  { label: "Team", href: "/team", icon: Users },
  { label: "Billing", href: "/billing", icon: CreditCard },
  { label: "Settings", href: "/settings", icon: Settings },
];

interface AppSidebarLayoutProps {
  children: React.ReactNode;
  userMenu?: React.ReactNode;
}

export function AppSidebarLayout({ children, userMenu }: AppSidebarLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* Mobile nav toggle */}
      <input type="checkbox" id="mobile-nav" className="peer hidden" />
      {/* Mobile backdrop */}
      <label
        htmlFor="mobile-nav"
        className="fixed inset-0 z-40 bg-black/40 opacity-0 pointer-events-none transition-opacity duration-200 peer-checked:opacity-100 peer-checked:pointer-events-auto lg:hidden"
      />

      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-200 -translate-x-full peer-checked:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0">
        {/* Logo */}
        <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-5">
          <div className="flex size-8 items-center justify-center border border-primary bg-primary text-primary-foreground">
            <FlaskConical className="size-4.5" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-foreground font-[family-name:var(--font-space-grotesk)]">
            LabFlow
          </span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 p-3">
          <p className="px-3 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60 font-[family-name:var(--font-space-grotesk)]">
            Navigation
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-2.5 border-l-2 border-transparent px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:border-primary/40 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <Icon className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-sidebar-accent-foreground" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer — pushed to bottom */}
        <div className="mt-auto border-t border-sidebar-border p-3 space-y-1">
          <div className="flex items-center gap-1">
            <a
              href="https://docs.labflow.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center gap-2.5 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-sidebar-foreground"
            >
              <ExternalLink className="size-3.5" />
              Help & docs
            </a>
            <ThemeToggle />
          </div>
          <div className="px-3 pt-1">
            <p className="text-[11px] font-mono text-muted-foreground/50">
              v0.1.0{" \u00b7 "}
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              {" \u00b7 "}
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              {" \u00b7 "}
              <Link href="/impressum" className="hover:text-foreground transition-colors">Impressum</Link>
            </p>
          </div>
        </div>

        {/* User section */}
        {userMenu && (
          <div className="border-t border-sidebar-border p-3">
            {userMenu}
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/80 backdrop-blur-lg px-4 py-3 lg:hidden">
          <label
            htmlFor="mobile-nav"
            className="flex size-8 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Menu className="size-5" />
          </label>
          <Link href="/login" className="flex items-center gap-2.5">
            <span className="text-sm font-semibold font-[family-name:var(--font-space-grotesk)]">LabFlow</span>
          </Link>
          <nav className="ml-auto flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex size-8 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Icon className="size-4.5" />
                </Link>
              );
            })}
            <ThemeToggle />
          </nav>
        </header>

        <div>{children}</div>
      </main>

      {/* Close button for mobile nav */}
      <label
        htmlFor="mobile-nav"
        className="fixed top-3 left-[236px] z-[60] flex size-8 cursor-pointer items-center justify-center bg-sidebar text-sidebar-foreground shadow-md transition-opacity opacity-0 pointer-events-none peer-checked:opacity-100 peer-checked:pointer-events-auto lg:hidden"
      >
        <X className="size-4" />
      </label>
    </div>
  );
}
