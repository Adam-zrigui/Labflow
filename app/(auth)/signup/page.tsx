"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FlaskConical } from "lucide-react";

const signupSchema = z
  .object({
    labName: z.string().min(1, "Lab/Organization name is required").max(100),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { labName: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: SignupFormData) => {
    setError(null);
    setLoading(true);

    try {
      let idToken: string;

      try {
        const result = await createUserWithEmailAndPassword(auth, data.email, data.password);
        idToken = await result.user.getIdToken();
      } catch (createErr) {
        if (createErr && typeof createErr === "object" && "code" in createErr && createErr.code === "auth/email-already-in-use") {
          const result = await signInWithEmailAndPassword(auth, data.email, data.password);
          idToken = await result.user.getIdToken();
        } else {
          throw createErr;
        }
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, labName: data.labName }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Registration failed");
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Registration failed. Please try again.";
      setError(message);
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

      {/* Decorative background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/3" />
        <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <FlaskConical className="size-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
          <p className="text-sm text-muted-foreground">
            Set up your LabFlow workspace in minutes
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label
                htmlFor="labName"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Lab / Organization name
              </label>
              <input
                id="labName"
                type="text"
                {...register("labName")}
                className="block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-shadow focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring disabled:opacity-50"
                placeholder="My Lab"
              />
              {errors.labName && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.labName.message}
                </p>
              )}
            </div>

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

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Password
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
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading && <Spinner />}
              {loading ? "Creating account\u2026" : "Create account"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
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
