import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, profiles, credits, subscriptions } from '@/db/schema';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = await signupSchema.parseAsync(body);

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, email),
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await db
      .insert(users)
      .values({
        email,
        name,
        passwordHash: hashedPassword,
        status: 'active',
      })
      .returning();

    const userId = newUser[0]!.id;

    // Create profile
    await db.insert(profiles).values({
      userId,
    });

    // Initialize credits
    await db.insert(credits).values({
      userId,
      balance: 0,
      totalPurchased: 0,
      totalUsed: 0,
    });

    // Initialize subscription (free tier)
    await db.insert(subscriptions).values({
      userId,
      plan: 'free',
      status: 'inactive',
    });

    return NextResponse.json(
      { message: 'User created successfully', userId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
