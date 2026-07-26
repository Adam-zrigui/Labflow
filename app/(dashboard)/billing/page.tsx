"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  EmptyState,
  NoPlansIllustration,
} from "@/components/empty-state";
import {
  CreditCard,
  AlertTriangle,
  ExternalLink,
  TestTubeDiagonal,
  FileStack,
  Users,
  Zap,
} from "lucide-react";

interface Plan {
  id: string;
  name: string;
  maxSamplesPerMonth: number;
  maxWorkflowTemplates: number;
  maxUsers: number;
  hasInstrumentWebhook: boolean;
}

interface BillingData {
  planName: string | null;
  subscriptionStatus: string;
  sampleCount: number;
  maxSamples: number;
  maxWorkflowTemplates: number;
  hasInstrumentWebhook: boolean;
}

function BillingSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <div className="space-y-2">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="rounded-xl border bg-card p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>
    </div>
  );
}

export default function BillingPage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [billingRes, plansRes] = await Promise.all([
          fetch("/api/billing"),
          fetch("/api/plans"),
        ]);
        if (billingRes.ok) setData(await billingRes.json());
        if (plansRes.ok) setPlans(await plansRes.json());
      } catch {
        setError("Failed to load billing data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const body = await res.json();
      if (body.url) window.location.href = body.url;
    } catch {
      setError("Failed to open billing portal");
    } finally {
      setPortalLoading(false);
    }
  };

  const handleCheckout = async (planId: string) => {
    setCheckoutLoading(planId);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const body = await res.json();
      if (body.url) window.location.href = body.url;
    } catch {
      setError("Failed to start checkout");
    } finally {
      setCheckoutLoading(null);
    }
  };

  const statusBadge = (
    status: string
  ): { label: string; variant: "active" | "pastDue" | "canceled" } => {
    switch (status) {
      case "active":
      case "trialing":
        return {
          label: status === "trialing" ? "Trialing" : "Active",
          variant: "active",
        };
      case "past_due":
        return { label: "Past due", variant: "pastDue" };
      case "canceled":
      case "incomplete":
        return { label: "Canceled", variant: "canceled" };
      default:
        return { label: status, variant: "canceled" };
    }
  };

  if (loading) return <BillingSkeleton />;

  // No subscription — show plan picker
  if (!data || !data.planName) {
    return (
      <div className="flex flex-col gap-6 p-6 lg:p-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Billing</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Choose a plan for your workspace
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertTriangle className="size-4 shrink-0" />
            {error}
          </div>
        )}

        {plans.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan, idx) => {
              const isRecommended = idx === plans.length - 1;
              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-xl border bg-card shadow-xs transition-all hover:shadow-md overflow-hidden ${
                    isRecommended
                      ? "border-primary/30 ring-1 ring-primary/10"
                      : ""
                  }`}
                >
                  {/* Gradient header */}
                  <div className={`px-6 pt-5 pb-4 ${isRecommended ? "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" : "bg-gradient-to-br from-muted/50 to-transparent"}`}>
                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                    {isRecommended && (
                      <span className="mt-1.5 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                        Recommended
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col px-6 pb-6 pt-2">
                    <div className="mb-6 flex-1 space-y-3">
                      <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                        <TestTubeDiagonal className="size-4 shrink-0 text-primary" />
                        {plan.maxSamplesPerMonth.toLocaleString()} samples/mo
                      </div>
                      <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                        <FileStack className="size-4 shrink-0 text-primary" />
                        {plan.maxWorkflowTemplates} templates
                      </div>
                      <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                        <Users className="size-4 shrink-0 text-primary" />
                        {plan.maxUsers} users
                      </div>
                      {plan.hasInstrumentWebhook && (
                        <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                          <Zap className="size-4 shrink-0 text-primary" />
                          Instrument webhooks
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={() => handleCheckout(plan.id)}
                      disabled={checkoutLoading !== null}
                      className="w-full gap-1.5"
                      variant={isRecommended ? "default" : "outline"}
                    >
                      {checkoutLoading === plan.id ? (
                        <>
                          <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Redirecting\u2026
                        </>
                      ) : (
                        <>
                          <CreditCard className="size-4" />
                          Subscribe
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No plans available"
            description="Plans have not been configured yet. Please contact support to get started with LabFlow."
            illustration={<NoPlansIllustration />}
          >
            <div className="space-y-3">
              <p className="text-center text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
                What you&apos;ll get with a plan
              </p>
              <div className="grid gap-2 text-left sm:grid-cols-2">
                <div className="flex items-start gap-2 rounded-lg bg-background p-3">
                  <TestTubeDiagonal className="size-4 mt-0.5 shrink-0 text-primary" />
                  <p className="text-xs text-muted-foreground">
                    Monthly sample processing quota
                  </p>
                </div>
                <div className="flex items-start gap-2 rounded-lg bg-background p-3">
                  <FileStack className="size-4 mt-0.5 shrink-0 text-primary" />
                  <p className="text-xs text-muted-foreground">
                    Unlimited workflow templates
                  </p>
                </div>
                <div className="flex items-start gap-2 rounded-lg bg-background p-3">
                  <Users className="size-4 mt-0.5 shrink-0 text-primary" />
                  <p className="text-xs text-muted-foreground">
                    Team member access with roles
                  </p>
                </div>
                <div className="flex items-start gap-2 rounded-lg bg-background p-3">
                  <Zap className="size-4 mt-0.5 shrink-0 text-primary" />
                  <p className="text-xs text-muted-foreground">
                    Instrument webhook integration
                  </p>
                </div>
              </div>
            </div>
          </EmptyState>
        )}
      </div>
    );
  }

  const badge = statusBadge(data.subscriptionStatus);

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Billing</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Manage your subscription and usage
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Subscription status card */}
      <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CreditCard className="size-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current plan</p>
                <p className="text-lg font-semibold">{data.planName}</p>
              </div>
            </div>
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </div>
        </div>

        <div className="px-6 py-5">
          {/* Monthly usage */}
          <div className="mb-5">
            <ProgressBar
              value={data.sampleCount}
              max={data.maxSamples}
              label={`${data.sampleCount} of ${data.maxSamples} samples this month`}
            />
          </div>

          {/* Features */}
          <div className="mb-5 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <FileStack className="size-3.5" />
              {data.maxWorkflowTemplates} templates
            </span>
            {data.hasInstrumentWebhook && (
              <span className="flex items-center gap-1.5">
                <Zap className="size-3.5" />
                Webhooks enabled
              </span>
            )}
          </div>

          {/* Actions */}
          <Button
            variant="outline"
            onClick={handlePortal}
            disabled={portalLoading}
            className="gap-1.5"
          >
            {portalLoading ? (
              <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <ExternalLink className="size-4" />
            )}
            Manage billing
          </Button>
        </div>
      </div>

      {/* Past-due warning */}
      {data.subscriptionStatus === "past_due" && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 dark:border-amber-800/50 dark:bg-amber-950/50">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400">
            <AlertTriangle className="size-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Payment past due
            </p>
            <p className="mt-0.5 text-sm text-amber-700 dark:text-amber-400">
              Please update your payment method to continue using LabFlow
              without interruption.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
