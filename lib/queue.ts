import { Queue, Worker } from "bullmq";
import { prisma } from "./prisma";
import { performStageAdvance } from "./advance-sample";
import type { Stage } from "./workflow-engine";

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
 *
 * When a job completes, the worker advances the sample to the next stage
 * using the same core logic (`performStageAdvance`) as the manual advance route.
 */
export function startSequencingWorker() {
  const worker = new Worker(
    "sequencing",
    async (job) => {
      const { sampleId } = job.data as { sampleId: string };
      console.log(`Processing sequencing job for sample ${sampleId}`);

      // Simulate sequencing work — in production, this would call an actual sequencer API
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Load the sample to get current stage info
      const sample = await prisma.sample.findUnique({
        where: { id: sampleId },
        include: {
          template: { select: { stages: true } },
        },
      });

      if (!sample) {
        throw new Error(`Sample ${sampleId} not found — cannot advance after sequencing`);
      }

      const stages = sample.template.stages as unknown as Stage[];

      // Advance the sample using the same core logic as the manual route
      await performStageAdvance(
        sampleId,
        sample.currentStageIndex,
        stages,
        "instrument-webhook"
      );

      console.log(`Sequencing complete — advanced sample ${sampleId} to next stage`);
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
