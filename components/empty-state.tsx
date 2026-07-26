import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  illustration: ReactNode;
  action?: ReactNode;
  className?: string;
  children?: ReactNode;
}

function EmptyState({
  title,
  description,
  illustration,
  action,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-6 rounded-2xl border border-dashed bg-card/50 py-14 px-8",
        className
      )}
    >
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="flex size-20 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground/60">
          {illustration}
        </div>
        <div className="max-w-md">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
      </div>
      {action && <div>{action}</div>}
      {children && <div className="w-full max-w-lg">{children}</div>}
    </div>
  );
}

/* --- SVG Illustrations --- */

function FlaskIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-16", className)}
    >
      <path
        d="M30 12h20v18l14 30a4 4 0 01-3.6 5.6H19.6A4 4 0 0116 60L30 30V12z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M26 62h28"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
      />
      <path
        d="M34 12V8a2 2 0 012-2h8a2 2 0 012 2v4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="34" cy="50" r="2.5" fill="currentColor" opacity="0.3" />
      <circle cx="44" cy="54" r="2" fill="currentColor" opacity="0.2" />
      <circle cx="38" cy="46" r="1.5" fill="currentColor" opacity="0.25" />
    </svg>
  );
}

function ClipboardIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-16", className)}
    >
      <rect
        x="18"
        y="14"
        width="44"
        height="54"
        rx="4"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M30 14V10a4 4 0 014-4h12a4 4 0 014 4v4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="28"
        y1="28"
        x2="52"
        y2="28"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
      />
      <line
        x1="28"
        y1="36"
        x2="46"
        y2="36"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.3"
      />
      <line
        x1="28"
        y1="44"
        x2="50"
        y2="44"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.2"
      />
      <line
        x1="28"
        y1="52"
        x2="42"
        y2="52"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.15"
      />
    </svg>
  );
}

function CreditCardIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-16", className)}
    >
      <rect
        x="12"
        y="20"
        width="56"
        height="40"
        rx="6"
        stroke="currentColor"
        strokeWidth="2"
      />
      <line
        x1="12"
        y1="32"
        x2="68"
        y2="32"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.3"
      />
      <rect
        x="20"
        y="40"
        width="16"
        height="4"
        rx="1"
        fill="currentColor"
        opacity="0.2"
      />
      <rect
        x="20"
        y="48"
        width="10"
        height="3"
        rx="1"
        fill="currentColor"
        opacity="0.12"
      />
      <circle
        cx="56"
        cy="46"
        r="6"
        fill="currentColor"
        opacity="0.1"
      />
      <circle
        cx="50"
        cy="46"
        r="6"
        fill="currentColor"
        opacity="0.15"
      />
    </svg>
  );
}

function NotFoundIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-16", className)}
    >
      <circle
        cx="40"
        cy="40"
        r="24"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="4 3"
      />
      <text
        x="40"
        y="46"
        textAnchor="middle"
        fill="currentColor"
        fontSize="20"
        fontWeight="600"
        opacity="0.3"
      >
        ?
      </text>
    </svg>
  );
}

function NoPlansIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-16", className)}
    >
      <rect
        x="14"
        y="18"
        width="22"
        height="44"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.3"
      />
      <rect
        x="29"
        y="14"
        width="22"
        height="52"
        rx="4"
        stroke="currentColor"
        strokeWidth="2"
      />
      <rect
        x="44"
        y="18"
        width="22"
        height="44"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.3"
      />
      <line
        x1="33"
        y1="28"
        x2="47"
        y2="28"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
      />
      <line
        x1="33"
        y1="34"
        x2="47"
        y2="34"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.3"
      />
      <line
        x1="33"
        y1="40"
        x2="43"
        y2="40"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.2"
      />
    </svg>
  );
}

function UsersIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-16", className)}
    >
      {/* Left person */}
      <circle cx="30" cy="28" r="8" stroke="currentColor" strokeWidth="2" opacity="0.4" />
      <path
        d="M16 56c0-8 6-14 14-14s14 6 14 14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.3"
      />
      {/* Right person (foreground) */}
      <circle cx="52" cy="26" r="9" stroke="currentColor" strokeWidth="2" />
      <path
        d="M36 58c0-9 7-16 16-16s16 7 16 16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Plus sign */}
      <line x1="66" y1="14" x2="66" y2="26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <line x1="60" y1="20" x2="72" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

export {
  EmptyState,
  FlaskIllustration,
  ClipboardIllustration,
  CreditCardIllustration,
  NotFoundIllustration,
  NoPlansIllustration,
  UsersIllustration,
};
