import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { BillingService } from '@/services/BillingService';
import { z } from 'zod';

const creditsCheckoutSchema = z.object({
  creditsPackageId: z.enum(['credits_30', 'credits_100', 'credits_250']),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = await creditsCheckoutSchema.parseAsync(body);

    const session_obj = await BillingService.createCreditsCheckout(
      session.user.id,
      data.creditsPackageId,
      session.user.email
    );

    return NextResponse.json({
      sessionId: session_obj.id,
      url: session_obj.url,
    });
  } catch (error) {
    console.error('Create credits checkout error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
