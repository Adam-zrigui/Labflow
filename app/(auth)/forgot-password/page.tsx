"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Failed to send reset link");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-8">
      {/* Theme toggle */}
      <div className="fixed top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-[400px]">
        {/* Wordmark */}
        <div className="mb-6 text-center">
          <span className="text-2xl font-semibold tracking-tight font-[family-name:var(--font-space-grotesk)]">
            LabFlow
          </span>
        </div>

        {/* Card */}
        <div className="border border-border p-6">
          {submitted ? (
            <div className="space-y-4">
              <div className="border border-green-200 bg-green-50 px-3.5 py-2.5 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
                If an account exists with that email, you will receive a password reset link shortly.
              </div>
              <p className="text-sm text-muted-foreground">
                Check your inbox and follow the link to reset your password. The link expires in 1 hour.
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSubmitted(false);
                }}
              >
                Send another link
              </Button>
            </div>
          ) : (
            <>
              <h1 className="mb-2 text-lg font-semibold text-foreground">
                Forgot your password?
              </h1>
              <p className="mb-6 text-sm text-muted-foreground">
                Enter your email address and we&apos;ll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-sm font-medium text-foreground"
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    {...register("email")}
                    className="block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-shadow focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring disabled:opacity-50"
                    placeholder="you@lab.example.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {error && (
                  <div className="border border-destructive/20 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <Button type="submit" disabled={loading} className="w-full" size="lg">
                  {loading && <Spinner />}
                  {loading ? "Sending link\u2026" : "Send reset link"}
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Sign in
          </Link>
        </p>
        <p className="mt-3 text-center text-xs text-muted-foreground/60">
          <Link href="/terms" className="hover:text-foreground transition-colors">
            Terms
          </Link>
          {" \u00b7 "}
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy
          </Link>
          {" \u00b7 "}
          <Link href="/impressum" className="hover:text-foreground transition-colors">
            Impressum
          </Link>
        </p>
      </div>
    </div>
  );
}
