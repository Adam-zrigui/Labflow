import { Queue, Worker } from "bullmq";
import { prisma } from "./prisma";
import { performStageAdvance } from "./advance-sample";
import type { Stage } from "./workflow-engine";

function buildRedisConnection() {
  const url = process.env.REDIS_URL;
  if (url) {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port || "6379", 10),
      password: parsed.password || undefined,
      tls: parsed.protocol === "rediss:" ? {} : undefined,
      maxRetriesPerRequest: null,
    };
  }

  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  if (upstashUrl) {
    const parsed = new URL(upstashUrl);
    return {
      host: parsed.hostname,
      port: 6380,
      password: process.env.UPSTASH_REDIS_REST_TOKEN,
      tls: {} as const,
      maxRetriesPerRequest: null,
    };
  }

  return {
    host: process.env.REDIS_HOST ?? "localhost",
    port: parseInt(process.env.REDIS_PORT ?? "6379", 10),
    maxRetriesPerRequest: null,
  };
}

export const redisConnection = buildRedisConnection();
export const sequencingQueue = new Queue("sequencing", { connection: redisConnection });

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

      await new Promise((resolve) => setTimeout(resolve, 5000));

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

      await performStageAdvance(
        sampleId,
        sample.currentStageIndex,
        stages,
        "instrument-webhook"
      );

      console.log(`Sequencing complete — advanced sample ${sampleId} to next stage`);
    },
    { connection: redisConnection }
  );

  worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
  });

  return worker;
}
