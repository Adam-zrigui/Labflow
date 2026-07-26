import "./sentry.server.config";
import { startSequencingWorker } from "./lib/queue";
import * as Sentry from "@sentry/nextjs";

const worker = startSequencingWorker();

worker.on("failed", (job, err) => {
  Sentry.captureException(err, { extra: { jobId: job?.id, data: job?.data } });
});

process.on("unhandledRejection", (err) => {
  Sentry.captureException(err);
});

process.on("SIGTERM", async () => {
  await worker.close();
  process.exit(0);
});

console.log("BullMQ worker started — waiting for jobs...");
