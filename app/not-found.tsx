import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FlaskConical } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground/60">
        <FlaskConical className="size-8" />
      </div>
      <div>
        <h1 className="text-xl font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>
      <Link href="/">
        <Button variant="outline" className="gap-1.5">
          Back to dashboard
        </Button>
      </Link>
    </div>
  );
}
