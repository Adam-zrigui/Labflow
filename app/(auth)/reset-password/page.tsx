"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { Suspense } from "react";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be at most 128 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  if (!token) {
    return (
      <div className="space-y-4">
        <div className="border border-destructive/20 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
          Invalid reset link. Please request a new password reset.
        </div>
        <Link
          href="/forgot-password"
          className="block text-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Request a new reset link
        </Link>
      </div>
    );
  }

  const onSubmit = async (data: ResetPasswordFormData) => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: data.password }),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body.error || "Failed to reset password");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-4">
        <div className="border border-green-200 bg-green-50 px-3.5 py-2.5 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
          Your password has been updated successfully.
        </div>
        <Link
          href="/login"
          className="block text-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Sign in with your new password
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="mb-2 text-lg font-semibold text-foreground">
        Set a new password
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Choose a strong password for your account.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            New password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register("password")}
            className="block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-shadow focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring disabled:opacity-50"
            placeholder="At least 8 characters"
          />
          {errors.password && (
            <p className="mt-1 text-xs text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            {...register("confirmPassword")}
            className="block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-shadow focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring disabled:opacity-50"
            placeholder="Repeat your password"
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-destructive">
              {errors.confirmPassword.message}
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
          {loading ? "Updating password\u2026" : "Update password"}
        </Button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
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
          <Suspense>
            <ResetPasswordForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground/60">
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
