/**
 * Standalone BullMQ worker for processing sequencing jobs.
 *
 * Run this separately from the Next.js server:
 *   npx tsx worker.ts
 *
 * This worker processes sequencing jobs enqueued by the sample advance route
 * when a stage is flagged as backgroundJob: true.
 */
import { startSequencingWorker } from "./lib/queue";

console.log("Starting LabFlow sequencing worker...");
const worker = startSequencingWorker();

process.on("SIGINT", () => {
  console.log("Shutting down worker...");
  worker.close();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("Shutting down worker...");
  worker.close();
  process.exit(0);
});
