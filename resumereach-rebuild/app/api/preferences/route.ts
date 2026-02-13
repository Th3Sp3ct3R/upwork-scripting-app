import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { jobPreferences } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { safeJsonStringify } from '@/lib/utils';

const preferencesSchema = z.object({
  targetRoles: z.array(z.string()).optional(),
  locations: z.array(z.string()).optional(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  keywords: z.array(z.string()).optional(),
  autoApplyEnabled: z.boolean().optional(),
  applicationsPerDay: z.number().min(1).max(50).optional(),
  minJobFitScore: z.number().min(0).max(100).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prefs = await db
      .select()
      .from(jobPreferences)
      .where(eq(jobPreferences.userId, session.user.id))
      .limit(1);

    if (!prefs.length) {
      return NextResponse.json({ error: 'Preferences not found' }, { status: 404 });
    }

    return NextResponse.json(prefs[0]);
  } catch (error) {
    console.error('Get preferences error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = await preferencesSchema.parseAsync(body);

    // Check if preferences exist
    const existing = await db
      .select()
      .from(jobPreferences)
      .where(eq(jobPreferences.userId, session.user.id))
      .limit(1);

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.targetRoles !== undefined) {
      updateData.targetRoles = safeJsonStringify(data.targetRoles);
    }
    if (data.locations !== undefined) {
      updateData.locations = safeJsonStringify(data.locations);
    }
    if (data.salaryMin !== undefined) {
      updateData.salaryMin = data.salaryMin;
    }
    if (data.salaryMax !== undefined) {
      updateData.salaryMax = data.salaryMax;
    }
    if (data.keywords !== undefined) {
      updateData.keywords = safeJsonStringify(data.keywords);
    }
    if (data.autoApplyEnabled !== undefined) {
      updateData.autoApplyEnabled = data.autoApplyEnabled;
    }
    if (data.applicationsPerDay !== undefined) {
      updateData.applicationsPerDay = data.applicationsPerDay;
    }
    if (data.minJobFitScore !== undefined) {
      updateData.minJobFitScore = data.minJobFitScore;
    }

    let result;
    if (existing.length) {
      result = await db
        .update(jobPreferences)
        .set(updateData)
        .where(eq(jobPreferences.userId, session.user.id))
        .returning();
    } else {
      result = await db
        .insert(jobPreferences)
        .values({
          userId: session.user.id,
          ...updateData,
        })
        .returning();
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Update preferences error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
