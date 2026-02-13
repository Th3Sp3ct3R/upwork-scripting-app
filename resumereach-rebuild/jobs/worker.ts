import { Worker, Queue } from 'bullmq';
import Redis from 'redis';
import { db } from '@/db';
import { applications, jobs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { ResumeService } from '@/services/ResumeService';
import { ApplicationService } from '@/services/ApplicationService';

const redis = new Redis({
  host: process.env.REDIS_URL?.split('://')[1]?.split(':')[0] || 'localhost',
  port: parseInt(process.env.REDIS_URL?.split(':')[2] || '6379'),
});

// Job queues
export const applicationQueue = new Queue('applications', { connection: redis });
export const resumeQueue = new Queue('resumes', { connection: redis });

// Application worker
export const applicationWorker = new Worker(
  'applications',
  async (job) => {
    console.log(`Processing application job ${job.id}`);

    const { userId, jobId, resumeId } = job.data;

    try {
      // Get job details
      const jobRecord = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);

      if (!jobRecord.length) {
        throw new Error('Job not found');
      }

      // Create application
      const application = await ApplicationService.createApplication({
        userId,
        jobId,
        resumeId,
      });

      // Deduct credit
      await ApplicationService.deductCredit(userId, 1);

      console.log(`Application ${application.id} processed successfully`);
      return { success: true, applicationId: application.id };
    } catch (error) {
      console.error(`Error processing application:`, error);

      // Record failure
      if (job.data.applicationId) {
        await ApplicationService.recordApplicationFailure(
          job.data.applicationId,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }

      throw error;
    }
  },
  { connection: redis, concurrency: 5 }
);

// Resume generation worker
export const resumeWorker = new Worker(
  'resumes',
  async (job) => {
    console.log(`Processing resume generation job ${job.id}`);

    const { userId, jobId, jobDescription, jobTitle, companyName } = job.data;

    try {
      // Generate customized resume
      const { resumeId, customizedText } = await ResumeService.generateCustomizedResume({
        userId,
        jobDescription,
        jobTitle,
        companyName,
        customizedForJobId: jobId,
      });

      console.log(`Resume ${resumeId} generated successfully`);
      return { success: true, resumeId, customizedText };
    } catch (error) {
      console.error(`Error generating resume:`, error);
      throw error;
    }
  },
  { connection: redis, concurrency: 3 }
);

// Worker events
applicationWorker.on('completed', (job) => {
  console.log(`Application job ${job.id} completed`);
});

applicationWorker.on('failed', (job, err) => {
  console.error(`Application job ${job?.id} failed:`, err);
});

resumeWorker.on('completed', (job) => {
  console.log(`Resume job ${job.id} completed`);
});

resumeWorker.on('failed', (job, err) => {
  console.error(`Resume job ${job?.id} failed:`, err);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down workers...');
  await applicationWorker.close();
  await resumeWorker.close();
  redis.disconnect();
  process.exit(0);
});

console.log('BullMQ workers started');
