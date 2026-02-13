import { db } from '@/db';
import { applications, jobs, resumes, credits } from '@/db/schema';
import { eq, and, desc, gte } from 'drizzle-orm';

export interface CreateApplicationInput {
  userId: string;
  jobId: string;
  resumeId: string;
  appliedVia?: 'linkedin' | 'indeed' | 'ziprecruiter';
}

export class ApplicationService {
  /**
   * Create a new application
   */
  static async createApplication(input: CreateApplicationInput) {
    // Check if already applied to this job
    const existing = await db
      .select()
      .from(applications)
      .where(and(eq(applications.userId, input.userId), eq(applications.jobId, input.jobId)))
      .limit(1);

    if (existing.length) {
      throw new Error('Already applied to this job');
    }

    // Create application
    const result = await db
      .insert(applications)
      .values({
        userId: input.userId,
        jobId: input.jobId,
        resumeId: input.resumeId,
        appliedVia: input.appliedVia,
        status: 'submitted',
        appliedAt: new Date(),
      })
      .returning();

    return result[0];
  }

  /**
   * Get all applications for a user
   */
  static async getUserApplications(userId: string) {
    return await db
      .select({
        application: applications,
        job: jobs,
        resume: resumes,
      })
      .from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .innerJoin(resumes, eq(applications.resumeId, resumes.id))
      .where(eq(applications.userId, userId))
      .orderBy(desc(applications.appliedAt));
  }

  /**
   * Get application by ID
   */
  static async getApplication(applicationId: string) {
    const result = await db
      .select({
        application: applications,
        job: jobs,
        resume: resumes,
      })
      .from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .innerJoin(resumes, eq(applications.resumeId, resumes.id))
      .where(eq(applications.id, applicationId))
      .limit(1);

    if (!result.length) {
      throw new Error('Application not found');
    }

    return result[0];
  }

  /**
   * Update application status
   */
  static async updateApplicationStatus(
    applicationId: string,
    status: string,
    responseStatus?: string
  ) {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (responseStatus) {
      updateData.responseStatus = responseStatus;
    }

    await db.update(applications).set(updateData).where(eq(applications.id, applicationId));
  }

  /**
   * Get application stats for user
   */
  static async getApplicationStats(userId: string) {
    const allApplications = await db
      .select()
      .from(applications)
      .where(eq(applications.userId, userId));

    const stats = {
      total: allApplications.length,
      submitted: allApplications.filter((a) => a.status === 'submitted').length,
      pending: allApplications.filter(
        (a) => a.status === 'pending_review' || a.status === 'interview_scheduled'
      ).length,
      rejected: allApplications.filter((a) => a.status === 'rejected').length,
      approved: allApplications.filter((a) => a.status === 'approved').length,
    };

    return stats;
  }

  /**
   * Get applications by status
   */
  static async getApplicationsByStatus(userId: string, status: string) {
    return await db
      .select()
      .from(applications)
      .where(and(eq(applications.userId, userId), eq(applications.status, status)))
      .orderBy(desc(applications.appliedAt));
  }

  /**
   * Record application failure
   */
  static async recordApplicationFailure(
    applicationId: string,
    errorMessage: string
  ) {
    const app = await db
      .select()
      .from(applications)
      .where(eq(applications.id, applicationId))
      .limit(1);

    if (!app.length) {
      throw new Error('Application not found');
    }

    await db
      .update(applications)
      .set({
        status: 'failed',
        errorMessage,
        retryCount: app[0].retryCount + 1,
        lastRetryAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(applications.id, applicationId));
  }

  /**
   * Get applications ready for retry
   */
  static async getFailedApplicationsForRetry(userId: string, maxRetries: number = 3) {
    return await db
      .select()
      .from(applications)
      .where(
        and(
          eq(applications.userId, userId),
          eq(applications.status, 'failed'),
          gte(maxRetries, applications.retryCount)
        )
      )
      .orderBy(applications.lastRetryAt);
  }

  /**
   * Deduct credit from user
   */
  static async deductCredit(userId: string, amount: number = 1) {
    // Check user has enough credits
    const userCredits = await db
      .select()
      .from(credits)
      .where(eq(credits.userId, userId))
      .limit(1);

    if (!userCredits.length) {
      throw new Error('Credit account not found');
    }

    if (userCredits[0].balance < amount) {
      throw new Error('Insufficient credits');
    }

    // Deduct credit
    await db
      .update(credits)
      .set({
        balance: userCredits[0].balance - amount,
        totalUsed: userCredits[0].totalUsed + amount,
        updatedAt: new Date(),
      })
      .where(eq(credits.userId, userId));

    return userCredits[0].balance - amount;
  }

  /**
   * Get daily application count
   */
  static async getDailyApplicationCount(userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const result = await db
      .select()
      .from(applications)
      .where(
        and(
          eq(applications.userId, userId),
          eq(applications.status, 'submitted'),
          gte(applications.appliedAt, today),
          gte(todayEnd, applications.appliedAt)
        )
      );

    return result.length;
  }
}
