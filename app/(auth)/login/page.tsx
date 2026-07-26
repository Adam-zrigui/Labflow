"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FlaskConical } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setLoading(true);

    try {
      const result = await signInWithEmailAndPassword(auth, data.email, data.password);
      const idToken = await result.user.getIdToken();

      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) throw new Error("Session creation failed");

      router.push("/");
      router.refresh();
    } catch {
      setError("Invalid email or password");
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
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to your LabFlow workspace
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
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
                autoComplete="current-password"
                {...register("password")}
                className="block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-shadow focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring disabled:opacity-50"
                placeholder="Enter your password"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.password.message}
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
              {loading ? "Signing in\u2026" : "Sign in"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Create one
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
