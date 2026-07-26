import { NextResponse } from "next/server";

/**
 * This API route is a placeholder for serverless-friendly queue processing.
 * Sequencing jobs are processed by the standalone BullMQ worker (worker.ts)
 * which must be started separately from the Next.js server.
 *
 * See ARCHITECTURE.md for details on the worker model.
 */
export async function POST() {
  return NextResponse.json({
    message:
      "Sequencing jobs are processed by the standalone BullMQ worker (worker.ts). Start it with: npx tsx worker.ts",
  });
}
