"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { SkeletonTable } from "@/components/ui/skeleton";
import {
  EmptyState,
  UsersIllustration,
} from "@/components/empty-state";
import {
  Plus,
  Shield,
  AlertTriangle,
  Crown,
  UserPlus,
  Copy,
  CheckCircle2,
  Mail,
} from "lucide-react";

interface TeamMember {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

interface InviteResponse {
  invite: {
    id: string;
    email: string;
    role: string;
    expiresAt: string;
    signupUrl: string;
  };
}

const roleBadge: Record<string, { label: string; variant: "default" | "inProgress" | "completed" | "flagged" }> = {
  Admin: { label: "Admin", variant: "completed" },
  SeniorScientist: { label: "Senior Scientist", variant: "inProgress" },
  Technician: { label: "Technician", variant: "default" },
};

function relativeDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  // Invite dialog
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("Technician");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteResult, setInviteResult] = useState<InviteResponse | null>(null);
  const [copied, setCopied] = useState(false);

  // Promote dialog
  const [promoteTarget, setPromoteTarget] = useState<TeamMember | null>(null);
  const [promoteLoading, setPromoteLoading] = useState(false);
  const [promoteError, setPromoteError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch("/api/team");
      if (res.status === 403) {
        setAccessDenied(true);
        return;
      }
      if (res.ok) setMembers(await res.json());
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteError(null);
    setInviteResult(null);

    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error || "Failed to send invite");
      }

      setInviteResult(body);
      setInviteEmail("");
      setInviteRole("Technician");
      fetchMembers();
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Failed to send invite");
    } finally {
      setInviteLoading(false);
    }
  };

  const handlePromote = async () => {
    if (!promoteTarget) return;
    setPromoteLoading(true);
    setPromoteError(null);

    try {
      const res = await fetch(`/api/team/${promoteTarget.id}/promote-admin`, {
        method: "POST",
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error || "Failed to promote user");
      }

      setPromoteTarget(null);
      fetchMembers();
    } catch (err) {
      setPromoteError(err instanceof Error ? err.message : "Failed to promote user");
    } finally {
      setPromoteLoading(false);
    }
  };

  const copyInviteLink = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6 lg:p-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Team</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Manage your team members and roles
          </p>
        </div>
        <SkeletonTable rows={4} />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="flex flex-col gap-6 p-6 lg:p-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Team</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Manage your team members and roles
          </p>
        </div>
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed bg-card p-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Shield className="size-6" />
          </div>
          <div>
            <p className="text-sm font-medium">Admin access required</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Only Admins can manage team members. Ask your workspace Admin to
              make changes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Team</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Manage your team members and roles
          </p>
        </div>
        <Button onClick={() => setShowInvite(true)} className="gap-1.5">
          <UserPlus className="size-4" />
          Invite teammate
        </Button>
      </div>

      {/* Members list or empty state */}
      {members.length === 0 ? (
        <EmptyState
          title="No team members yet"
          description="Invite teammates to collaborate on samples and workflows."
          illustration={<UsersIllustration />}
          action={
            <Button onClick={() => setShowInvite(true)} className="gap-1.5">
              <UserPlus className="size-4" />
              Invite teammate
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-xs">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Member
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Joined
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {members.map((member) => {
                const rb = roleBadge[member.role] ?? {
                  label: member.role,
                  variant: "default" as const,
                };
                return (
                  <tr
                    key={member.id}
                    className="group transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium">{member.email}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={rb.variant} className="gap-1">
                        {member.role === "Admin" && <Crown className="size-3" />}
                        {rb.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {relativeDate(member.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {member.role !== "Admin" && (
                        <button
                          type="button"
                          onClick={() => setPromoteTarget(member)}
                          className="text-xs font-medium text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground"
                        >
                          Promote to Admin
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite dialog */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-2xl border bg-card p-6 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <UserPlus className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Invite teammate</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  They&apos;ll receive a link to join your workspace.
                </p>
              </div>
            </div>

            {inviteResult ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-lg border border-green-200 bg-green-50 px-3.5 py-3 dark:border-green-800/50 dark:bg-green-950/50">
                  <p className="text-sm font-medium text-green-800 dark:text-green-300 flex items-center gap-2">
                    <CheckCircle2 className="size-4 shrink-0" />
                    Invite created for {inviteResult.invite.email}
                  </p>
                  <p className="mt-1 text-xs text-green-700 dark:text-green-400">
                    Expires {relativeDate(inviteResult.invite.expiresAt)}
                  </p>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Share this signup link
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={inviteResult.invite.signupUrl}
                      className="flex-1 rounded-lg border bg-muted px-3 py-2 font-mono text-xs text-muted-foreground"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyInviteLink(inviteResult.invite.signupUrl)}
                      className="gap-1 shrink-0"
                    >
                      {copied ? (
                        <CheckCircle2 className="size-3.5" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowInvite(false);
                      setInviteResult(null);
                    }}
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInvite} className="mt-5 space-y-4">
                <div>
                  <label
                    htmlFor="invite-email"
                    className="mb-1.5 block text-sm font-medium text-foreground"
                  >
                    Email address
                  </label>
                  <input
                    id="invite-email"
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-shadow focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
                    placeholder="teammate@lab.example.com"
                  />
                </div>
                <div>
                  <label
                    htmlFor="invite-role"
                    className="mb-1.5 block text-sm font-medium text-foreground"
                  >
                    Role
                  </label>
                  <select
                    id="invite-role"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground transition-shadow focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
                  >
                    <option value="Technician">Technician</option>
                    <option value="SeniorScientist">Senior Scientist</option>
                  </select>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Admins can be promoted separately after the user joins.
                  </p>
                </div>

                {inviteError && (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
                    {inviteError}
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowInvite(false);
                      setInviteError(null);
                      setInviteResult(null);
                    }}
                    disabled={inviteLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={inviteLoading || !inviteEmail}
                    className="gap-1.5"
                  >
                    {inviteLoading ? (
                      <Spinner className="size-3" />
                    ) : (
                      <Mail className="size-3.5" />
                    )}
                    {inviteLoading ? "Sending\u2026" : "Send invite"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Promote confirmation dialog */}
      {promoteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-2xl border bg-card p-6 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold">
                  Promote to Admin?
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  This will give{" "}
                  <span className="font-medium text-foreground">
                    {promoteTarget.email}
                  </span>{" "}
                  full Admin access to this workspace, including the ability to
                  invite/remove members, manage billing, and change settings.
                  This is a significant permission change.
                </p>
              </div>
            </div>

            {promoteError && (
              <div className="mt-3 rounded-lg border border-destructive/20 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
                {promoteError}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPromoteTarget(null);
                  setPromoteError(null);
                }}
                disabled={promoteLoading}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handlePromote}
                disabled={promoteLoading}
                className="gap-1.5 bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
              >
                {promoteLoading ? (
                  <Spinner className="size-3" />
                ) : (
                  <Crown className="size-3.5" />
                )}
                {promoteLoading ? "Promoting\u2026" : "Promote to Admin"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
