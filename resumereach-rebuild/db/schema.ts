import {
  pgTable,
  pgEnum,
  uuid,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  decimal,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const UserStatusEnum = pgEnum('user_status', ['active', 'suspended', 'deleted']);
export const PlatformEnum = pgEnum('platform', ['linkedin', 'indeed', 'ziprecruiter']);
export const ApplicationStatusEnum = pgEnum('application_status', [
  'draft',
  'submitted',
  'pending_review',
  'rejected',
  'approved',
  'interview_scheduled',
  'failed',
]);
export const ResponseStatusEnum = pgEnum('response_status', [
  'no_response',
  'viewed',
  'interviewed',
  'offered',
  'rejected',
]);
export const SubscriptionPlanEnum = pgEnum('subscription_plan', [
  'free',
  'basic',
  'pro',
  'enterprise',
]);
export const BillingCycleEnum = pgEnum('billing_cycle', ['monthly', 'yearly']);
export const AuditActionEnum = pgEnum('audit_action', [
  'login',
  'profile_update',
  'application_submitted',
  'payment_received',
  'account_created',
]);

// ============================================================================
// USERS & AUTHENTICATION
// ============================================================================
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    passwordHash: text('password_hash'),
    profilePic: text('profile_pic'),
    status: UserStatusEnum('status').default('active').notNull(),
    onboardingCompleted: boolean('onboarding_completed').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => {
    return {
      emailIdx: index('users_email_idx').on(table.email),
      createdAtIdx: index('users_created_at_idx').on(table.createdAt),
    };
  }
);

export const linkedAccounts = pgTable(
  'linked_accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    platform: PlatformEnum('platform').notNull(),
    platformUserId: varchar('platform_user_id', { length: 255 }).notNull(),
    accessToken: text('access_token').notNull(),
    refreshToken: text('refresh_token'),
    tokenExpiresAt: timestamp('token_expires_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      userIdIdx: index('linked_accounts_user_id_idx').on(table.userId),
      uniqueUserPlatform: unique('unique_user_platform').on(table.userId, table.platform),
    };
  }
);

// ============================================================================
// USER PROFILE & PREFERENCES
// ============================================================================
export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    skills: text('skills'), // JSON array: ["JavaScript", "React", ...]
    experience: text('experience'), // JSON: { years: 5, roles: ["Frontend Dev", ...] }
    targetRoles: text('target_roles'), // JSON array
    locations: text('locations'), // JSON array
    bio: text('bio'),
    originalResume: text('original_resume'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      userIdIdx: index('profiles_user_id_idx').on(table.userId),
    };
  }
);

export const jobPreferences = pgTable(
  'job_preferences',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    targetRoles: text('target_roles'), // JSON array
    locations: text('locations'), // JSON array
    salaryMin: integer('salary_min'),
    salaryMax: integer('salary_max'),
    keywords: text('keywords'), // JSON array
    autoApplyEnabled: boolean('auto_apply_enabled').default(false).notNull(),
    applicationsPerDay: integer('applications_per_day').default(5).notNull(),
    minJobFitScore: integer('min_job_fit_score').default(70).notNull(), // 0-100
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      userIdIdx: index('job_preferences_user_id_idx').on(table.userId),
    };
  }
);

// ============================================================================
// RESUMES
// ============================================================================
export const resumes = pgTable(
  'resumes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    originalText: text('original_text').notNull(),
    customizedText: text('customized_text'),
    customizedForJobId: uuid('customized_for_job_id'),
    version: integer('version').default(1).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      userIdIdx: index('resumes_user_id_idx').on(table.userId),
      customizedForJobIdIdx: index('resumes_customized_for_job_id_idx').on(
        table.customizedForJobId
      ),
    };
  }
);

// ============================================================================
// JOB LISTINGS & MATCHING
// ============================================================================
export const jobs = pgTable(
  'jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    platform: PlatformEnum('platform').notNull(),
    platformJobId: varchar('platform_job_id', { length: 255 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    company: varchar('company', { length: 255 }).notNull(),
    location: varchar('location', { length: 255 }),
    salaryMin: integer('salary_min'),
    salaryMax: integer('salary_max'),
    description: text('description').notNull(),
    url: text('url').notNull(),
    postedAt: timestamp('posted_at'),
    expiresAt: timestamp('expires_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      platformJobIdIdx: index('jobs_platform_job_id_idx').on(table.platformJobId),
      companyIdx: index('jobs_company_idx').on(table.company),
      createdAtIdx: index('jobs_created_at_idx').on(table.createdAt),
    };
  }
);

export const jobMatches = pgTable(
  'job_matches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    jobId: uuid('job_id')
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    fitScore: integer('fit_score').notNull(), // 0-100
    matchReason: text('match_reason'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      userIdIdx: index('job_matches_user_id_idx').on(table.userId),
      jobIdIdx: index('job_matches_job_id_idx').on(table.jobId),
      fitScoreIdx: index('job_matches_fit_score_idx').on(table.fitScore),
    };
  }
);

// ============================================================================
// APPLICATIONS
// ============================================================================
export const applications = pgTable(
  'applications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    jobId: uuid('job_id')
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    resumeId: uuid('resume_id')
      .notNull()
      .references(() => resumes.id, { onDelete: 'restrict' }),
    status: ApplicationStatusEnum('status').default('draft').notNull(),
    responseStatus: ResponseStatusEnum('response_status').default('no_response').notNull(),
    appliedAt: timestamp('applied_at'),
    appliedVia: PlatformEnum('applied_via'),
    errorMessage: text('error_message'),
    retryCount: integer('retry_count').default(0).notNull(),
    lastRetryAt: timestamp('last_retry_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      userIdIdx: index('applications_user_id_idx').on(table.userId),
      jobIdIdx: index('applications_job_id_idx').on(table.jobId),
      statusIdx: index('applications_status_idx').on(table.status),
      appliedAtIdx: index('applications_applied_at_idx').on(table.appliedAt),
    };
  }
);

// ============================================================================
// BILLING & CREDITS
// ============================================================================
export const credits = pgTable(
  'credits',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    balance: integer('balance').default(0).notNull(),
    totalPurchased: integer('total_purchased').default(0).notNull(),
    totalUsed: integer('total_used').default(0).notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      userIdIdx: index('credits_user_id_idx').on(table.userId),
    };
  }
);

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    plan: SubscriptionPlanEnum('plan').default('free').notNull(),
    billingCycle: BillingCycleEnum('billing_cycle'),
    stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
    stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
    status: varchar('status', { length: 50 }).default('inactive').notNull(),
    currentPeriodStart: timestamp('current_period_start'),
    currentPeriodEnd: timestamp('current_period_end'),
    nextBillingDate: timestamp('next_billing_date'),
    cancelledAt: timestamp('cancelled_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      userIdIdx: index('subscriptions_user_id_idx').on(table.userId),
      stripeCustomerIdIdx: index('subscriptions_stripe_customer_id_idx').on(
        table.stripeCustomerId
      ),
    };
  }
);

export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 50 }).notNull(), // 'credit_purchase', 'subscription'
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    creditsAdded: integer('credits_added'),
    stripePaymentId: varchar('stripe_payment_id', { length: 255 }),
    status: varchar('status', { length: 50 }).default('pending').notNull(),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    completedAt: timestamp('completed_at'),
  },
  (table) => {
    return {
      userIdIdx: index('transactions_user_id_idx').on(table.userId),
      stripePaymentIdIdx: index('transactions_stripe_payment_id_idx').on(
        table.stripePaymentId
      ),
    };
  }
);

// ============================================================================
// AUDIT LOG
// ============================================================================
export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    action: AuditActionEnum('action').notNull(),
    metadata: text('metadata'), // JSON
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      userIdIdx: index('audit_log_user_id_idx').on(table.userId),
      createdAtIdx: index('audit_log_created_at_idx').on(table.createdAt),
    };
  }
);

// ============================================================================
// JOB QUEUE STATE (for BullMQ tracking)
// ============================================================================
export const jobQueue = pgTable(
  'job_queue',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    jobId: uuid('job_id')
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    queuedAt: timestamp('queued_at').defaultNow().notNull(),
    processedAt: timestamp('processed_at'),
    priority: integer('priority').default(0).notNull(),
    attempts: integer('attempts').default(0).notNull(),
    status: varchar('status', { length: 50 }).default('pending').notNull(),
    lastError: text('last_error'),
  },
  (table) => {
    return {
      userIdIdx: index('job_queue_user_id_idx').on(table.userId),
      statusIdx: index('job_queue_status_idx').on(table.status),
    };
  }
);

// ============================================================================
// RELATIONS
// ============================================================================
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
  linkedAccounts: many(linkedAccounts),
  jobPreferences: one(jobPreferences),
  resumes: many(resumes),
  applications: many(applications),
  credits: one(credits),
  subscription: one(subscriptions),
  transactions: many(transactions),
  auditLog: many(auditLog),
  jobMatches: many(jobMatches),
}));

export const applicationsRelations = relations(applications, ({ one }) => ({
  user: one(users, {
    fields: [applications.userId],
    references: [users.id],
  }),
  job: one(jobs, {
    fields: [applications.jobId],
    references: [jobs.id],
  }),
  resume: one(resumes, {
    fields: [applications.resumeId],
    references: [resumes.id],
  }),
}));

export const resumesRelations = relations(resumes, ({ one }) => ({
  user: one(users, {
    fields: [resumes.userId],
    references: [users.id],
  }),
}));
