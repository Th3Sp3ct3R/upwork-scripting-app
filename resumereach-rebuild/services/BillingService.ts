import { db } from '@/db';
import { subscriptions, transactions, credits } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_placeholder', {
  apiVersion: '2024-06-20' as any,
});
const stripe = typeof process.env.STRIPE_SECRET_KEY === 'string' ? getStripe() : null as any;

export interface CreditsPackage {
  id: string;
  credits: number;
  price: number;
  savings: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  applicationsPerDay: number;
  creditsIncluded: number;
}

export const CREDIT_PACKAGES: CreditsPackage[] = [
  {
    id: 'credits_30',
    credits: 30,
    price: 10,
    savings: 0,
  },
  {
    id: 'credits_100',
    credits: 100,
    price: 25,
    savings: 5,
  },
  {
    id: 'credits_250',
    credits: 250,
    price: 50,
    savings: 20,
  },
];

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan_basic_monthly',
    name: 'Basic',
    price: 9.99,
    billingCycle: 'monthly',
    applicationsPerDay: 5,
    creditsIncluded: 150,
  },
  {
    id: 'plan_pro_monthly',
    name: 'Professional',
    price: 24.99,
    billingCycle: 'monthly',
    applicationsPerDay: 20,
    creditsIncluded: 600,
  },
  {
    id: 'plan_basic_yearly',
    name: 'Basic Yearly',
    price: 99.99,
    billingCycle: 'yearly',
    applicationsPerDay: 5,
    creditsIncluded: 1800,
  },
  {
    id: 'plan_pro_yearly',
    name: 'Professional Yearly',
    price: 249.99,
    billingCycle: 'yearly',
    applicationsPerDay: 20,
    creditsIncluded: 7200,
  },
];

export class BillingService {
  /**
   * Create Stripe customer for user
   */
  static async createStripeCustomer(userId: string, email: string, name: string) {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId,
      },
    });

    return customer.id;
  }

  /**
   * Create payment intent for credits purchase
   */
  static async createCreditsCheckout(userId: string, creditsPackageId: string, email: string) {
    const pkg = CREDIT_PACKAGES.find((p) => p.id === creditsPackageId);
    if (!pkg) {
      throw new Error('Invalid credits package');
    }

    // Get or create Stripe customer
    let stripeCustomerId: string;
    const sub = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (sub.length && sub[0].stripeCustomerId) {
      stripeCustomerId = sub[0].stripeCustomerId;
    } else {
      stripeCustomerId = await this.createStripeCustomer(userId, email, 'ResumeReach User');
      // Store customer ID
      if (sub.length) {
        await db
          .update(subscriptions)
          .set({ stripeCustomerId })
          .where(eq(subscriptions.userId, userId));
      }
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${pkg.credits} Credits`,
              description: `Add ${pkg.credits} application credits to your account`,
            },
            unit_amount: Math.round(pkg.price * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: '{DOMAIN}/dashboard/billing?success=true',
      cancel_url: '{DOMAIN}/dashboard/billing?cancelled=true',
      metadata: {
        userId,
        creditsPackageId,
        creditsAmount: pkg.credits,
      },
    });

    return session;
  }

  /**
   * Create subscription checkout
   */
  static async createSubscriptionCheckout(userId: string, planId: string, email: string) {
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    if (!plan) {
      throw new Error('Invalid subscription plan');
    }

    // Get or create Stripe customer
    let stripeCustomerId: string;
    const sub = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (sub.length && sub[0].stripeCustomerId) {
      stripeCustomerId = sub[0].stripeCustomerId;
    } else {
      stripeCustomerId = await this.createStripeCustomer(userId, email, 'ResumeReach User');
    }

    // Create checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: plan.name,
              description: `${plan.applicationsPerDay} apps/day, ${plan.creditsIncluded} credits/month`,
            },
            unit_amount: Math.round(plan.price * 100),
            recurring: {
              interval: plan.billingCycle === 'monthly' ? 'month' : 'year',
              interval_count: 1,
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: '{DOMAIN}/dashboard/billing?success=true',
      cancel_url: '{DOMAIN}/dashboard/billing?cancelled=true',
      metadata: {
        userId,
        planId,
      },
    });

    return session;
  }

  /**
   * Process successful payment
   */
  static async processPaymentSuccess(sessionId: string) {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      throw new Error('Payment not completed');
    }

    const userId = session.metadata?.userId;
    const creditsPackageId = session.metadata?.creditsPackageId;
    const planId = session.metadata?.planId;

    if (!userId) {
      throw new Error('Invalid session metadata');
    }

    if (creditsPackageId) {
      // Handle credits purchase
      const pkg = CREDIT_PACKAGES.find((p) => p.id === creditsPackageId);
      if (!pkg) {
        throw new Error('Invalid credits package');
      }

      // Add credits
      const userCredits = await db
        .select()
        .from(credits)
        .where(eq(credits.userId, userId))
        .limit(1);

      if (userCredits.length) {
        await db
          .update(credits)
          .set({
            balance: userCredits[0].balance + pkg.credits,
            totalPurchased: userCredits[0].totalPurchased + pkg.credits,
            updatedAt: new Date(),
          })
          .where(eq(credits.userId, userId));
      }

      // Record transaction
      await db.insert(transactions).values({
        userId,
        type: 'credit_purchase',
        amount: String(pkg.price),
        creditsAdded: pkg.credits,
        stripePaymentId: session.payment_intent as string,
        status: 'completed',
        description: `Purchase of ${pkg.credits} credits`,
        completedAt: new Date(),
      });
    } else if (planId) {
      // Handle subscription
      const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
      if (!plan) {
        throw new Error('Invalid plan');
      }

      // Update subscription
      const sub = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .limit(1);

      const subscriptionId = session.subscription as string;

      if (sub.length) {
        await db
          .update(subscriptions)
          .set({
            plan: plan.name.toLowerCase(),
            stripeSubscriptionId: subscriptionId,
            stripeCustomerId: session.customer as string,
            status: 'active',
            currentPeriodStart: new Date(session.created * 1000),
            currentPeriodEnd: new Date((session.created + 30 * 24 * 60 * 60) * 1000),
            nextBillingDate: new Date((session.created + 30 * 24 * 60 * 60) * 1000),
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.userId, userId));
      } else {
        await db.insert(subscriptions).values({
          userId,
          plan: plan.name.toLowerCase(),
          billingCycle: plan.billingCycle,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: subscriptionId,
          status: 'active',
          currentPeriodStart: new Date(session.created * 1000),
          currentPeriodEnd: new Date((session.created + 30 * 24 * 60 * 60) * 1000),
          nextBillingDate: new Date((session.created + 30 * 24 * 60 * 60) * 1000),
        });
      }

      // Record transaction
      await db.insert(transactions).values({
        userId,
        type: 'subscription',
        amount: String(plan.price),
        stripePaymentId: session.payment_intent as string,
        status: 'completed',
        description: `${plan.name} subscription (${plan.billingCycle})`,
        completedAt: new Date(),
      });
    }

    return { success: true };
  }

  /**
   * Get user billing info
   */
  static async getUserBilling(userId: string) {
    const [sub, userCredits, txns] = await Promise.all([
      db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .limit(1),
      db
        .select()
        .from(credits)
        .where(eq(credits.userId, userId))
        .limit(1),
      db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, userId))
        .orderBy(transactions.createdAt),
    ]);

    return {
      subscription: sub.length ? sub[0] : null,
      credits: userCredits.length ? userCredits[0] : null,
      transactions: txns,
    };
  }
}
