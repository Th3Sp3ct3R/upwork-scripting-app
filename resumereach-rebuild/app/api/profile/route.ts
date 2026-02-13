import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { profiles, jobPreferences } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { safeJsonStringify } from '@/lib/utils';

const profileUpdateSchema = z.object({
  skills: z.array(z.string()).optional(),
  experience: z.record(z.any()).optional(),
  targetRoles: z.array(z.string()).optional(),
  locations: z.array(z.string()).optional(),
  bio: z.string().optional(),
  originalResume: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, session.user.id))
      .limit(1);

    if (!profile.length) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json(profile[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = await profileUpdateSchema.parseAsync(body);

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.skills !== undefined) {
      updateData.skills = safeJsonStringify(data.skills);
    }
    if (data.experience !== undefined) {
      updateData.experience = safeJsonStringify(data.experience);
    }
    if (data.targetRoles !== undefined) {
      updateData.targetRoles = safeJsonStringify(data.targetRoles);
    }
    if (data.locations !== undefined) {
      updateData.locations = safeJsonStringify(data.locations);
    }
    if (data.bio !== undefined) {
      updateData.bio = data.bio;
    }
    if (data.originalResume !== undefined) {
      updateData.originalResume = data.originalResume;
    }

    const updated = await db
      .update(profiles)
      .set(updateData)
      .where(eq(profiles.userId, session.user.id))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Update profile error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
