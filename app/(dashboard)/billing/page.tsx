"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { ProgressBar } from "@/components/ui/progress-bar";

interface BillingData {
  planName: string | null;
  subscriptionStatus: string;
  sampleCount: number;
  maxSamples: number;
  maxWorkflowTemplates: number;
  hasInstrumentWebhook: boolean;
}

export default function BillingPage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    const fetchBilling = async () => {
      try {
        const res = await fetch("/api/billing");
        if (res.ok) {
          const body = await res.json();
          setData(body);
        }
      } catch {
        // silent — show empty state
      } finally {
        setLoading(false);
      }
    };

    fetchBilling();
  }, []);

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const body = await res.json();
      if (body.url) window.location.href = body.url;
    } catch {
      // silent
    } finally {
      setPortalLoading(false);
    }
  };

  const handleCheckout = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: "pro" }),
      });
      const body = await res.json();
      if (body.url) window.location.href = body.url;
    } catch {
      // silent
    } finally {
      setPortalLoading(false);
    }
  };

  const statusBadge = (
    status: string
  ): { label: string; variant: "active" | "pastDue" | "canceled" } => {
    switch (status) {
      case "active":
      case "trialing":
        return { label: status === "trialing" ? "Trialing" : "Active", variant: "active" };
      case "past_due":
        return { label: "Past due", variant: "pastDue" };
      case "canceled":
      case "incomplete":
        return { label: "Canceled", variant: "canceled" };
      default:
        return { label: status, variant: "canceled" };
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <Spinner className="size-5 text-muted-foreground" />
      </div>
    );
  }

  // No subscription data available
  if (!data || !data.planName) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <h1 className="text-lg font-semibold">Billing</h1>
        <div className="max-w-lg rounded-lg border bg-card p-5">
          <p className="text-sm font-medium mb-1">No active subscription</p>
          <p className="text-sm text-muted-foreground mb-4">
            Select a plan to start using LabFlow with your team.
          </p>
          <Button size="sm" onClick={handleCheckout} disabled={portalLoading}>
            {portalLoading && <Spinner />}
            View plans
          </Button>
        </div>
      </div>
    );
  }

  const badge = statusBadge(data.subscriptionStatus);
  const usagePercent =
    data.maxSamples > 0 ? Math.round((data.sampleCount / data.maxSamples) * 100) : 0;

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <h1 className="text-lg font-semibold">Billing</h1>

      {/* Subscription status card */}
      <div className="max-w-lg rounded-lg border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium">Current plan</p>
            <p className="text-sm text-muted-foreground">{data.planName}</p>
          </div>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>

        {/* Monthly usage */}
        <div className="mb-5">
          <ProgressBar
            value={data.sampleCount}
            max={data.maxSamples}
            label={`${data.sampleCount} of ${data.maxSamples} samples this month`}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={handlePortal} disabled={portalLoading}>
            {portalLoading && <Spinner />}
            Manage billing
          </Button>
          <Button size="sm" onClick={handleCheckout} disabled={portalLoading}>
            {portalLoading && <Spinner />}
            Upgrade plan
          </Button>
        </div>
      </div>

      {/* Past-due warning */}
      {data.subscriptionStatus === "past_due" && (
        <div className="max-w-lg rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            Payment past due
          </p>
          <p className="mt-0.5 text-sm text-amber-700 dark:text-amber-400">
            Please update your payment method to continue using LabFlow without interruption.
          </p>
        </div>
      )}
    </div>
  );
}
