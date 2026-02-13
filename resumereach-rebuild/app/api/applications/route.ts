import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ApplicationService } from '@/services/ApplicationService';
import { z } from 'zod';

const createApplicationSchema = z.object({
  jobId: z.string().uuid(),
  resumeId: z.string().uuid(),
  appliedVia: z.enum(['linkedin', 'indeed', 'ziprecruiter']).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const applications = await ApplicationService.getUserApplications(session.user.id);
    return NextResponse.json(applications);
  } catch (error) {
    console.error('Get applications error:', error);
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
    const data = await createApplicationSchema.parseAsync(body);

    const application = await ApplicationService.createApplication({
      userId: session.user.id,
      jobId: data.jobId,
      resumeId: data.resumeId,
      appliedVia: data.appliedVia,
    });

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    console.error('Create application error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
