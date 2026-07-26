import { Queue, Worker } from "bullmq";

const connection = {
  host: process.env.REDIS_HOST ?? "localhost",
  port: parseInt(process.env.REDIS_PORT ?? "6379", 10),
};

export const sequencingQueue = new Queue("sequencing", { connection });

export async function enqueueSequencingJob(sampleId: string) {
  await sequencingQueue.add(
    "sequence-sample",
    { sampleId },
    {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
    }
  );
}

/**
 * Start the BullMQ worker to process sequencing jobs.
 * Call this from a standalone worker process (worker.ts), NOT from Next.js route handlers.
 */
export function startSequencingWorker() {
  const worker = new Worker(
    "sequencing",
    async (job) => {
      const { sampleId } = job.data as { sampleId: string };
      console.log(`Processing sequencing job for sample ${sampleId}`);
      // Simulate sequencing work — in production, this would call an actual sequencer API
      await new Promise((resolve) => setTimeout(resolve, 5000));
      console.log(`Sequencing complete for sample ${sampleId}`);
    },
    { connection }
  );

  worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
  });

  return worker;
}
