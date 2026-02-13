import { db } from '@/db';
import { resumes, profiles } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { generateCustomizedResume } from '@/lib/claude';

export interface ResumeServiceInput {
  userId: string;
  jobDescription: string;
  jobTitle: string;
  companyName: string;
  customizedForJobId?: string;
}

export class ResumeService {
  /**
   * Get user's original resume
   */
  static async getOriginalResume(userId: string) {
    const profile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    if (!profile.length) {
      throw new Error('User profile not found');
    }

    return profile[0].originalResume;
  }

  /**
   * Store original resume
   */
  static async storeOriginalResume(userId: string, resumeText: string) {
    const profile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    if (!profile.length) {
      throw new Error('User profile not found');
    }

    await db
      .update(profiles)
      .set({
        originalResume: resumeText,
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, userId));
  }

  /**
   * Generate a customized resume for a job
   */
  static async generateCustomizedResume(input: ResumeServiceInput) {
    const originalResume = await this.getOriginalResume(input.userId);

    if (!originalResume) {
      throw new Error('No original resume found. Please upload your resume first.');
    }

    // Call Claude to generate customized resume
    const { resume: customizedText, summary } = await generateCustomizedResume({
      originalResume,
      jobDescription: input.jobDescription,
      jobTitle: input.jobTitle,
      companyName: input.companyName,
    });

    // Store the customized resume
    const resumeRecord = await db
      .insert(resumes)
      .values({
        userId: input.userId,
        originalText: originalResume,
        customizedText,
        customizedForJobId: input.customizedForJobId,
        version: 1,
        isActive: true,
      })
      .returning();

    return {
      resumeId: resumeRecord[0].id,
      customizedText,
      summary,
    };
  }

  /**
   * Get all resumes for a user
   */
  static async getUserResumes(userId: string) {
    return await db
      .select()
      .from(resumes)
      .where(eq(resumes.userId, userId))
      .orderBy(desc(resumes.createdAt));
  }

  /**
   * Get a specific resume by ID
   */
  static async getResume(resumeId: string) {
    const result = await db
      .select()
      .from(resumes)
      .where(eq(resumes.id, resumeId))
      .limit(1);

    if (!result.length) {
      throw new Error('Resume not found');
    }

    return result[0];
  }

  /**
   * Compare two resumes
   */
  static async compareResumes(resumeId1: string, resumeId2: string) {
    const [resume1, resume2] = await Promise.all([
      this.getResume(resumeId1),
      this.getResume(resumeId2),
    ]);

    return {
      resume1: {
        id: resume1.id,
        originalText: resume1.originalText,
        customizedText: resume1.customizedText,
        createdAt: resume1.createdAt,
      },
      resume2: {
        id: resume2.id,
        originalText: resume2.originalText,
        customizedText: resume2.customizedText,
        createdAt: resume2.createdAt,
      },
    };
  }

  /**
   * Delete a resume
   */
  static async deleteResume(resumeId: string) {
    await db.delete(resumes).where(eq(resumes.id, resumeId));
  }

  /**
   * Get resume count for user
   */
  static async getResumeCount(userId: string): Promise<number> {
    const result = await db
      .select()
      .from(resumes)
      .where(eq(resumes.userId, userId));

    return result.length;
  }
}
