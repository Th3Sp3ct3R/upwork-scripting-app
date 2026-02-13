# ResumeReach Architecture Overview

Comprehensive guide to understanding the ResumeReach system architecture, design decisions, and component interactions.

## 📐 System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  Next.js Pages (React) + TypeScript + Tailwind + Shadcn/ui   │
└──────────────┬───────────────────────────────────┬───────────┘
               │                                   │
        ┌──────▼───────┐                   ┌──────▼────────┐
        │  Auth Pages  │                   │  Dashboard    │
        │  Onboarding  │                   │  Settings     │
        │  Signup      │                   │  Billing      │
        └──────┬───────┘                   └──────┬────────┘
               │                                   │
               └───────────────┬───────────────────┘
                               │
        ┌──────────────────────▼──────────────────────┐
        │   API Route Layer (Next.js API Routes)     │
        │  - Authentication (/api/auth/*)            │
        │  - Profile Management (/api/profile)       │
        │  - Job Search (/api/jobs/*)                │
        │  - Resume Generation (/api/resumes)        │
        │  - Applications (/api/applications)        │
        │  - Billing (/api/billing)                  │
        │  - WebHooks (/api/webhooks/*)              │
        └──────────────────────┬──────────────────────┘
                               │
        ┌──────────────────────▼──────────────────────┐
        │   Service Layer (Business Logic)           │
        │  - ResumeService                           │
        │  - JobMatchingService                      │
        │  - ApplicationService                      │
        │  - BillingService                          │
        │  - AuthService                             │
        └──────────────────────┬──────────────────────┘
                               │
        ┌──────────────────────▼──────────────────────┐
        │   Data Layer (Database + Cache)            │
        │  - PostgreSQL (Drizzle ORM)                │
        │  - Redis (Sessions + Cache)                │
        └──────────────────────┬──────────────────────┘
                               │
        ┌──────────────────────▼──────────────────────┐
        │   External Services Layer                  │
        │  - Claude API (AI)                         │
        │  - Stripe (Payments)                       │
        │  - OAuth Providers (Google, GitHub)        │
        │  - Job Platform APIs (LinkedIn, Indeed)    │
        └──────────────────────────────────────────────┘
```

## 🔄 Key Flows

### 1. User Signup Flow

```
User Input
    ↓
NextAuth SignUp Handler
    ↓
Validate Input (Zod)
    ↓
Hash Password (bcryptjs)
    ↓
Create User in PostgreSQL
    ↓
Create Profile, Credits, Subscription records
    ↓
Redirect to Onboarding
```

### 2. Resume Generation Flow

```
User Requests Resume Generation
    ↓
Get Original Resume from Profile
    ↓
Validate Job Description
    ↓
Call Claude API (generateCustomizedResume)
    ↓
Store Resume in Database
    ↓
Return Resume ID + Customized Content
```

### 3. Autonomous Application Flow

```
Scheduled Job (BullMQ)
    ↓
Fetch Unprocessed Jobs for User
    ↓
Check User Preferences (salary, location, roles)
    ↓
Score Job with Claude (JobMatchingService)
    ↓
If Score > Threshold:
    Generate Customized Resume (Claude)
        ↓
    Apply via Platform API
        ↓
    Record Application in Database
        ↓
    Deduct Credit from User
        ↓
    Send Notification
    ↓
Else: Skip Job
```

### 4. Payment Processing Flow

```
User Selects Credits/Subscription
    ↓
Create Stripe Session
    ↓
User Completes Payment
    ↓
Stripe Webhook Received
    ↓
Verify Webhook Signature
    ↓
Add Credits / Activate Subscription
    ↓
Record Transaction
    ↓
Update User Dashboard
```

## 🗄️ Database Schema Design

### User & Authentication Tables

```
users
├─ id: UUID (PK)
├─ email: VARCHAR (UNIQUE)
├─ name: VARCHAR
├─ password_hash: TEXT
├─ profile_pic: TEXT
├─ status: ENUM (active, suspended, deleted)
├─ onboarding_completed: BOOLEAN
├─ created_at: TIMESTAMP
└─ updated_at: TIMESTAMP

profiles (1-1 with users)
├─ id: UUID (PK)
├─ user_id: UUID (FK → users, UNIQUE)
├─ skills: JSON (array of strings)
├─ experience: JSON (object)
├─ target_roles: JSON
├─ locations: JSON
├─ bio: TEXT
├─ original_resume: TEXT
└─ timestamps

linked_accounts (N-1 with users)
├─ id: UUID (PK)
├─ user_id: UUID (FK → users)
├─ platform: ENUM (linkedin, indeed, ziprecruiter)
├─ platform_user_id: VARCHAR
├─ access_token: TEXT (encrypted)
├─ refresh_token: TEXT (encrypted)
└─ timestamps
```

### Resume Tables

```
resumes (N-1 with users)
├─ id: UUID (PK)
├─ user_id: UUID (FK → users)
├─ original_text: TEXT
├─ customized_text: TEXT
├─ customized_for_job_id: UUID (FK → jobs, nullable)
├─ version: INT
├─ is_active: BOOLEAN
└─ timestamps

KEY: resumes.customized_for_job_id → jobs.id
```

### Job & Application Tables

```
jobs
├─ id: UUID (PK)
├─ platform: ENUM
├─ platform_job_id: VARCHAR (unique per platform)
├─ title: VARCHAR
├─ company: VARCHAR
├─ location: VARCHAR
├─ salary_min: INT
├─ salary_max: INT
├─ description: TEXT (full job description)
├─ url: TEXT
├─ posted_at: TIMESTAMP
└─ expires_at: TIMESTAMP

job_matches (N-N between users and jobs)
├─ id: UUID (PK)
├─ user_id: UUID (FK → users)
├─ job_id: UUID (FK → jobs)
├─ fit_score: INT (0-100, indexed)
├─ match_reason: TEXT
└─ created_at: TIMESTAMP

applications (tracks user applications)
├─ id: UUID (PK)
├─ user_id: UUID (FK → users, indexed)
├─ job_id: UUID (FK → jobs, indexed)
├─ resume_id: UUID (FK → resumes)
├─ status: ENUM (draft, submitted, pending_review, etc)
├─ response_status: ENUM (no_response, viewed, interviewed, offered, rejected)
├─ applied_at: TIMESTAMP (indexed)
├─ applied_via: ENUM
├─ error_message: TEXT
├─ retry_count: INT
├─ last_retry_at: TIMESTAMP
└─ timestamps
```

### Billing Tables

```
credits (1-1 with users)
├─ id: UUID (PK)
├─ user_id: UUID (FK → users, UNIQUE)
├─ balance: INT (current credits)
├─ total_purchased: INT
├─ total_used: INT
└─ updated_at: TIMESTAMP

subscriptions (1-1 with users)
├─ id: UUID (PK)
├─ user_id: UUID (FK → users, UNIQUE)
├─ plan: ENUM (free, basic, pro, enterprise)
├─ billing_cycle: ENUM (monthly, yearly)
├─ stripe_customer_id: VARCHAR
├─ stripe_subscription_id: VARCHAR
├─ status: VARCHAR (active, inactive, cancelled)
├─ current_period_start: TIMESTAMP
├─ current_period_end: TIMESTAMP
├─ next_billing_date: TIMESTAMP
├─ cancelled_at: TIMESTAMP
└─ timestamps

transactions (N-1 with users)
├─ id: UUID (PK)
├─ user_id: UUID (FK → users, indexed)
├─ type: VARCHAR (credit_purchase, subscription)
├─ amount: DECIMAL
├─ credits_added: INT
├─ stripe_payment_id: VARCHAR (indexed)
├─ status: VARCHAR (pending, completed, failed)
├─ description: TEXT
├─ created_at: TIMESTAMP
└─ completed_at: TIMESTAMP
```

### Audit & Operations Tables

```
audit_log
├─ id: UUID (PK)
├─ user_id: UUID (FK → users, indexed)
├─ action: ENUM (login, profile_update, application_submitted, etc)
├─ metadata: JSON
├─ ip_address: VARCHAR
├─ user_agent: TEXT
└─ created_at: TIMESTAMP (indexed)

job_queue (BullMQ state tracking)
├─ id: UUID (PK)
├─ user_id: UUID (FK → users)
├─ job_id: UUID (FK → jobs)
├─ queued_at: TIMESTAMP
├─ processed_at: TIMESTAMP
├─ priority: INT
├─ attempts: INT
├─ status: VARCHAR (pending, processing, completed, failed)
└─ last_error: TEXT
```

## 🏗️ Service Layer Architecture

### ResumeService
- `generateCustomizedResume()` - Claude integration
- `getOriginalResume()` - Fetch from profile
- `storeOriginalResume()` - Update in profile
- `getUserResumes()` - Query all versions
- `compareResumes()` - Side-by-side comparison
- `deleteResume()` - Clean up

### JobMatchingService
- `scoreJobsForUser()` - Batch score unscored jobs
- `getMatchedJobs()` - Filter by score threshold
- `getTopMatches()` - Get best N matches
- `checkJobMatch()` - Check preferences match
- `getJobScore()` - Get existing score
- `clearUserMatches()` - Refresh matches

### ApplicationService
- `createApplication()` - Record new application
- `getUserApplications()` - Query with job/resume data
- `getApplication()` - Get single with relations
- `updateApplicationStatus()` - Update status
- `getApplicationStats()` - Count by status
- `recordApplicationFailure()` - Log errors
- `deductCredit()` - Handle billing
- `getDailyApplicationCount()` - Rate limiting

### BillingService
- `createStripeCustomer()` - Set up Stripe
- `createCreditsCheckout()` - Credits purchase
- `createSubscriptionCheckout()` - Subscription
- `processPaymentSuccess()` - Webhook handler
- `getUserBilling()` - Get billing summary

## 🔐 Security Architecture

### Authentication
- **NextAuth.js** with JWT strategy
- Sessions stored in secure httpOnly cookies
- Automatic CSRF protection
- OAuth provider integration
- Password hashing with bcryptjs (10 rounds)

### Data Protection
- SQL injection prevention (Drizzle ORM)
- Encrypted sensitive data (tokens)
- Database SSL/TLS connections
- Environment variable isolation
- Rate limiting on auth endpoints

### API Security
- Authentication middleware
- Authorization checks per resource
- Input validation with Zod
- CORS configuration
- Helmet.js headers (recommended)

## 📦 Technology Decisions

### Why Next.js?
- Built-in API routes
- ServerComponents for performance
- Automatic code splitting
- Image optimization
- Deployment simplicity

### Why Drizzle ORM?
- Type-safe SQL queries
- Excellent TypeScript support
- Migration management
- Relations and joins
- Zero runtime overhead

### Why BullMQ?
- Battle-tested job queue
- Redis-backed persistence
- Advanced retry logic
- Job scheduling
- Real-time processing

### Why Claude API?
- SOTA capability for text tasks
- Excellent for resume tailoring
- Good job matching performance
- Reasonable pricing
- Easy integration

### Why Stripe?
- Industry standard
- Comprehensive documentation
- Webhook support
- Subscription management
- Payment compliance

## 🚀 Deployment Architecture

### Frontend (Vercel)
- Automatic deployments from GitHub
- Edge caching
- Serverless functions
- Environment variable management
- Log aggregation

### Database (Railway PostgreSQL)
- Managed service
- Automatic backups
- Connection pooling
- Metrics & monitoring
- Easy scaling

### Cache (Railway Redis)
- Session storage
- Job queue backing
- Real-time data
- Pub/sub support

### Background Workers (Railway)
- Multiple replicas
- Auto-restart on failure
- Environment parity with API
- Centralized logs
- Resource monitoring

## 📊 Performance Considerations

### Database Optimization
- Indexes on frequently filtered columns
- Pagination for large result sets
- Eager loading for relations
- Query timeouts
- Connection pool tuning

### API Optimization
- Response caching headers
- Gzip compression
- JSON size reduction
- Async processing
- Rate limiting

### Frontend Optimization
- Code splitting
- Image optimization
- CSS minification
- Dynamic imports
- Component lazy loading

## 🔄 Scaling Strategy

### Vertical Scaling
- Increase database resources
- Add Redis memory
- Increase worker memory/CPU

### Horizontal Scaling
- Multiple worker replicas
- Database read replicas
- CDN caching
- Load balancing

### Process Optimization
- Batch job processing
- Connection pooling
- Async/await patterns
- Queue prioritization

---

This architecture is designed to be:
- **Scalable** - Handle growth in users and jobs
- **Maintainable** - Clear separation of concerns
- **Testable** - Mockable services and APIs
- **Secure** - Multiple layers of protection
- **Performant** - Optimized for speed
- **Reliable** - Error handling and retries

Last updated: January 2024
