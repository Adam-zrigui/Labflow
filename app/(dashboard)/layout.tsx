import { requireAuth } from "@/lib/auth";
import { UserMenu } from "@/components/user-menu";
import { AppSidebarLayout } from "@/components/app-sidebar-layout";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  return (
    <AppSidebarLayout userMenu={<UserMenu email={session.email} />}>
      {children}
    </AppSidebarLayout>
  );
}
