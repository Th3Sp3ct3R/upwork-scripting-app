import { db } from '@/db';
import { jobs, jobMatches, profiles, jobPreferences } from '@/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { scoreJobMatch } from '@/lib/claude';
import { safeJsonParse } from '@/lib/utils';

export class JobMatchingService {
  /**
   * Score all unscored jobs for a user
   */
  static async scoreJobsForUser(userId: string) {
    // Get user profile and preferences
    const userProfile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    if (!userProfile.length) {
      throw new Error('User profile not found');
    }

    const jobPrefs = await db
      .select()
      .from(jobPreferences)
      .where(eq(jobPreferences.userId, userId))
      .limit(1);

    // Get all unscored jobs
    const allJobs = await db.select().from(jobs);

    const scoredJobs = [];

    for (const job of allJobs) {
      // Check if already scored
      const existingMatch = await db
        .select()
        .from(jobMatches)
        .where(and(eq(jobMatches.userId, userId), eq(jobMatches.jobId, job.id)))
        .limit(1);

      if (existingMatch.length) continue;

      // Score the job
      const userProfileText = this.buildUserProfileText(userProfile[0]);

      try {
        const { score, reason } = await scoreJobMatch({
          jobTitle: job.title,
          jobDescription: job.description,
          companyName: job.company,
          userProfile: userProfileText,
        });

        // Store the match
        const matchRecord = await db
          .insert(jobMatches)
          .values({
            userId,
            jobId: job.id,
            fitScore: score,
            matchReason: reason,
          })
          .returning();

        scoredJobs.push({
          jobId: job.id,
          score,
          reason,
        });
      } catch (error) {
        console.error(`Error scoring job ${job.id}:`, error);
      }
    }

    return scoredJobs;
  }

  /**
   * Get matched jobs for a user, filtered by score
   */
  static async getMatchedJobs(userId: string, minScore: number = 70) {
    const matches = await db
      .select({
        jobId: jobMatches.jobId,
        fitScore: jobMatches.fitScore,
        matchReason: jobMatches.matchReason,
        job: jobs,
      })
      .from(jobMatches)
      .innerJoin(jobs, eq(jobMatches.jobId, jobs.id))
      .where(and(eq(jobMatches.userId, userId), gte(jobMatches.fitScore, minScore)))
      .orderBy(desc(jobMatches.fitScore));

    return matches;
  }

  /**
   * Get top matches for a user
   */
  static async getTopMatches(userId: string, limit: number = 10) {
    const matches = await db
      .select({
        jobId: jobMatches.jobId,
        fitScore: jobMatches.fitScore,
        matchReason: jobMatches.matchReason,
        job: jobs,
      })
      .from(jobMatches)
      .innerJoin(jobs, eq(jobMatches.jobId, jobs.id))
      .where(eq(jobMatches.userId, userId))
      .orderBy(desc(jobMatches.fitScore))
      .limit(limit);

    return matches;
  }

  /**
   * Check if job matches user preferences
   */
  static async checkJobMatch(userId: string, job: any): Promise<boolean> {
    const prefs = await db
      .select()
      .from(jobPreferences)
      .where(eq(jobPreferences.userId, userId))
      .limit(1);

    if (!prefs.length) {
      return true; // No preferences set, match everything
    }

    const pref = prefs[0];

    // Check location
    if (pref.locations) {
      const locations = safeJsonParse(pref.locations, []);
      if (locations.length > 0 && !locations.some((loc: string) => job.location?.includes(loc))) {
        return false;
      }
    }

    // Check salary
    if (pref.salaryMin && job.salaryMax && job.salaryMax < pref.salaryMin) {
      return false;
    }
    if (pref.salaryMax && job.salaryMin && job.salaryMin > pref.salaryMax) {
      return false;
    }

    // Check target roles
    if (pref.targetRoles) {
      const roles = safeJsonParse(pref.targetRoles, []);
      if (
        roles.length > 0 &&
        !roles.some((role: string) => job.title?.toLowerCase().includes(role.toLowerCase()))
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get job match score
   */
  static async getJobScore(userId: string, jobId: string): Promise<number | null> {
    const match = await db
      .select()
      .from(jobMatches)
      .where(and(eq(jobMatches.userId, userId), eq(jobMatches.jobId, jobId)))
      .limit(1);

    return match.length ? match[0].fitScore : null;
  }

  /**
   * Clear old matches for a user (useful for refresh)
   */
  static async clearUserMatches(userId: string) {
    await db.delete(jobMatches).where(eq(jobMatches.userId, userId));
  }

  private static buildUserProfileText(profile: any): string {
    const skills = safeJsonParse(profile.skills, []);
    const experience = safeJsonParse(profile.experience, {});
    const targetRoles = safeJsonParse(profile.targetRoles, []);
    const locations = safeJsonParse(profile.locations, []);

    return `
Skills: ${Array.isArray(skills) ? skills.join(', ') : skills}
Experience: ${experience.years || 'N/A'} years
Previous Roles: ${Array.isArray(targetRoles) ? targetRoles.join(', ') : targetRoles}
Preferred Locations: ${Array.isArray(locations) ? locations.join(', ') : locations}
Bio: ${profile.bio || 'N/A'}
    `;
  }
}
