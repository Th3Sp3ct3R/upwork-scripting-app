import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ResumeService } from '@/services/ResumeService';
import { z } from 'zod';

const generateResumeSchema = z.object({
  jobDescription: z.string().min(10),
  jobTitle: z.string().min(2),
  companyName: z.string().min(2),
  jobId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resumes = await ResumeService.getUserResumes(session.user.id);
    return NextResponse.json(resumes);
  } catch (error) {
    console.error('Get resumes error:', error);
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
    const data = await generateResumeSchema.parseAsync(body);

    const result = await ResumeService.generateCustomizedResume({
      userId: session.user.id,
      jobDescription: data.jobDescription,
      jobTitle: data.jobTitle,
      companyName: data.companyName,
      customizedForJobId: data.jobId,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Generate resume error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
