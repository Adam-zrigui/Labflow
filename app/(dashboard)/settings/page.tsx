"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  reauthenticateWithCredential,
  updatePassword,
  EmailAuthProvider,
} from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Trash2,
  AlertTriangle,
  KeyRound,
  CheckCircle2,
  Shield,
} from "lucide-react";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be at most 128 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const router = useRouter();

  // Delete account state
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  // Change password state
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors: pwErrors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setPwError(null);
    setPwSuccess(false);
    setPwLoading(true);

    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error("Not signed in. Please log in again.");
      }

      const credential = EmailAuthProvider.credential(
        user.email,
        data.currentPassword
      );
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, data.newPassword);

      setPwSuccess(true);
      reset();
      setTimeout(() => setPwSuccess(false), 4000);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "code" in err) {
        const code = (err as { code: string }).code;
        if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
          setPwError("Current password is incorrect.");
        } else if (code === "auth/weak-password") {
          setPwError("New password is too weak. Use at least 8 characters.");
        } else if (code === "auth/requires-recent-login") {
          setPwError(
            "For security, please log out and log back in before changing your password."
          );
        } else {
          setPwError("Failed to change password. Please try again.");
        }
      } else {
        setPwError("Failed to change password. Please try again.");
      }
    } finally {
      setPwLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to delete account");
      }
      router.push("/login");
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete account"
      );
      setDeleteLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Manage your account
        </p>
      </div>

      {/* Change password */}
      <div className="rounded-xl border bg-card p-6 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <KeyRound className="size-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-foreground">
              Change password
            </h2>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              Update your account password. You&apos;ll need to enter your
              current password to confirm the change.
            </p>

            <form
              onSubmit={handleSubmit(onPasswordSubmit)}
              className="mt-4 space-y-4"
            >
              <div className="max-w-sm space-y-3">
                <div>
                  <label
                    htmlFor="currentPassword"
                    className="mb-1.5 block text-sm font-medium text-foreground"
                  >
                    Current password
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    autoComplete="current-password"
                    {...register("currentPassword")}
                    className="block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-shadow focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring disabled:opacity-50"
                    placeholder="Enter current password"
                  />
                  {pwErrors.currentPassword && (
                    <p className="mt-1 text-xs text-destructive">
                      {pwErrors.currentPassword.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="newPassword"
                    className="mb-1.5 block text-sm font-medium text-foreground"
                  >
                    New password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    autoComplete="new-password"
                    {...register("newPassword")}
                    className="block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-shadow focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring disabled:opacity-50"
                    placeholder="Minimum 8 characters"
                  />
                  {pwErrors.newPassword && (
                    <p className="mt-1 text-xs text-destructive">
                      {pwErrors.newPassword.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-1.5 block text-sm font-medium text-foreground"
                  >
                    Confirm new password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    {...register("confirmPassword")}
                    className="block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-shadow focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring disabled:opacity-50"
                    placeholder="Re-enter new password"
                  />
                  {pwErrors.confirmPassword && (
                    <p className="mt-1 text-xs text-destructive">
                      {pwErrors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>

              {pwError && (
                <div className="max-w-sm rounded-lg border border-destructive/20 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
                  {pwError}
                </div>
              )}

              {pwSuccess && (
                <div className="max-w-sm rounded-lg border border-green-200 bg-green-50 px-3.5 py-2.5 text-sm text-green-700 dark:border-green-800/50 dark:bg-green-950/50 dark:text-green-300 flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0" />
                  Password changed successfully.
                </div>
              )}

              <Button
                type="submit"
                disabled={pwLoading}
                size="sm"
                className="gap-1.5"
              >
                {pwLoading ? (
                  <Spinner className="size-3" />
                ) : (
                  <Shield className="size-3.5" />
                )}
                {pwLoading ? "Updating\u2026" : "Update password"}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-xl border border-destructive/20 bg-card p-6 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
            <Trash2 className="size-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-foreground">
              Delete account
            </h2>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              Permanently delete your account and pseudonymize all associated
              data. Your email will be replaced with a random placeholder, and
              your account will be marked as deleted. Audit log entries will
              be retained for compliance purposes but will show &quot;Deleted
              user&quot; instead of your identity.
            </p>
            <div className="mt-4">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowConfirm(true)}
                className="gap-1.5"
              >
                <Trash2 className="size-3.5" />
                Delete my account
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-2xl border bg-card p-6 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold">
                  Are you absolutely sure?
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  This action <span className="font-medium text-foreground">cannot be undone</span>.
                  Your account will be pseudonymized: your email will be
                  replaced with a random placeholder and your account will be
                  marked as deleted. Audit logs will retain your activity
                  history for compliance but will no longer display your
                  identity.
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="size-4 rounded border-input"
                />
                I understand this is permanent
              </label>
            </div>

            {deleteError && (
              <div className="mt-3 rounded-lg border border-destructive/20 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
                {deleteError}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowConfirm(false);
                  setConfirmed(false);
                  setDeleteError(null);
                }}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={!confirmed || deleteLoading}
                className="gap-1.5"
              >
                {deleteLoading ? (
                  <Spinner className="size-3" />
                ) : (
                  <Trash2 className="size-3.5" />
                )}
                {deleteLoading ? "Deleting\u2026" : "Delete account"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
