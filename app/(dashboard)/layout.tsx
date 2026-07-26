import Link from "next/link";

const navItems = [
  { label: "Samples", href: "/dashboard" },
  { label: "Templates", href: "/dashboard/templates" },
  { label: "Billing", href: "/dashboard/billing" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1">
      {/* Sidebar */}
      <aside className="hidden w-56 shrink-0 border-r bg-muted/20 p-4 lg:flex lg:flex-col">
        <div className="mb-8">
          <Link href="/dashboard" className="text-sm font-semibold tracking-tight">
            LabFlow
          </Link>
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex flex-1 flex-col">
        {/* Mobile header */}
        <header className="flex items-center gap-4 border-b px-4 py-3 lg:hidden">
          <Link href="/dashboard" className="text-sm font-semibold">
            LabFlow
          </Link>
          <nav className="flex gap-3 ml-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <div className="flex-1">{children}</div>
      </main>
    </div>
  );
}
