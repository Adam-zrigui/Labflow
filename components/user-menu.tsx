"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { LogOut } from "lucide-react";

interface UserMenuProps {
  email: string;
}

function initials(email: string) {
  const name = email.split("@")[0] ?? "";
  const parts = name.replace(/[._-]/g, " ").split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function UserMenu({ email }: UserMenuProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
        {email ? initials(email) : "??"}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-foreground">
          {email || "Signed in"}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={handleLogout}
        disabled={loading}
        className="shrink-0 text-muted-foreground hover:text-destructive"
        title="Sign out"
      >
        {loading ? <Spinner className="size-3" /> : <LogOut className="size-3.5" />}
      </Button>
    </div>
  );
}
