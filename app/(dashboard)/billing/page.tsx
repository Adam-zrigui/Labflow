"use client";

import { Button } from "@/components/ui/button";

export default function BillingPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-bold">Billing</h1>
      <p className="text-muted-foreground">Manage your subscription and billing.</p>
      <div className="flex gap-4">
        <Button
          onClick={async () => {
            const res = await fetch("/api/checkout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ planId: "starter" }),
            });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
          }}
        >
          Upgrade Plan
        </Button>
        <Button
          variant="outline"
          onClick={async () => {
            const res = await fetch("/api/billing/portal", { method: "POST" });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
          }}
        >
          Manage Billing
        </Button>
      </div>
    </div>
  );
}
