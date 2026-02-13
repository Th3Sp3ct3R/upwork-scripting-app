# ResumeReach - AI-Powered Autonomous Job Application Platform

Automate your job search with AI-tailored resumes and intelligent job applications. ResumeReach leverages Claude AI to customize resumes for each job and autonomously submit applications on your behalf.

## 🚀 Features

### Core Features
- **AI-Powered Resume Tailoring** - Claude generates customized resumes for each job
- **Autonomous Job Applications** - Automated background job queue processes applications
- **Multi-Platform Support** - Integrates with LinkedIn, Indeed, and ZipRecruiter
- **Job Matching** - AI scores jobs against your profile (0-100 fit score)
- **Beautiful Dashboard** - Real-time application tracking and statistics
- **Subscription & Credits Model** - Flexible payment plans and credit system

### Technical Highlights
- **Full-Stack TypeScript** - Type-safe from database to frontend
- **NextAuth.js** - Secure OAuth and credentials-based authentication
- **PostgreSQL + Drizzle ORM** - Type-safe database queries
- **BullMQ** - Robust background job processing
- **Stripe Integration** - Seamless payment processing
- **Responsive Design** - Mobile-first Tailwind CSS UI

## 📋 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Next.js 15, TypeScript, Tailwind CSS, Shadcn/ui |
| **Backend** | Node.js, Next.js API Routes, Hono |
| **Database** | PostgreSQL, Drizzle ORM |
| **Queue** | BullMQ, Redis |
| **AI** | Claude API (Anthropic) |
| **Auth** | NextAuth.js (OAuth + Credentials) |
| **Payments** | Stripe |
| **Deployment** | Vercel (Frontend), Railway/AWS RDS (Database/Redis) |

## 🏗️ Architecture

### Database Schema

```
users
  ├── profiles
  ├── linked_accounts
  ├── job_preferences
  ├── resumes
  ├── applications
  │   ├── jobs
  │   └── resumes
  ├── credits
  ├── subscriptions
  ├── transactions
  └── audit_log

job_matches
job_queue
```

### Key Components

1. **Authentication** - NextAuth.js with Google, GitHub, and email/password
2. **Resume Service** - Generate customized resumes using Claude
3. **Job Matching Service** - Score jobs and find matches
4. **Application Service** - Handle application lifecycle
5. **Billing Service** - Stripe integration and credit management
6. **Background Jobs** - BullMQ workers for applications and resume generation

## 🔧 Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- API Keys:
  - Claude (Anthropic)
  - Stripe
  - Google OAuth
  - GitHub OAuth (optional)

### Setup Steps

1. **Clone the repository**
```bash
cd resumereach-rebuild
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

Fill in your API keys and database URL in `.env.local`:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/resumereach
NEXTAUTH_SECRET=$(openssl rand -base64 32)
ANTHROPIC_API_KEY=sk-ant-...
STRIPE_SECRET_KEY=sk_test_...
# ... other variables
```

4. **Create database and run migrations**
```bash
npm run db:push
```

5. **Start the development server**
```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

## 📖 API Documentation

### Authentication Endpoints

#### POST `/api/auth/signup`
Create a new user account.

```json
{
  "email": "user@example.com",
  "password": "secure_password",
  "name": "John Doe"
}
```

#### POST `/api/auth/signin` (NextAuth)
Sign in with credentials or OAuth.

### Profile Endpoints

#### GET `/api/profile`
Get user profile.

#### PUT `/api/profile`
Update user profile.

```json
{
  "skills": ["React", "Node.js", "Python"],
  "experience": { "years": 5 },
  "targetRoles": ["Senior Developer", "Tech Lead"],
  "locations": ["Remote", "San Francisco"],
  "bio": "Full-stack developer with 5 years of experience",
  "originalResume": "..."
}
```

### Job Preferences Endpoints

#### GET `/api/preferences`
Get job preferences.

#### POST `/api/preferences`
Update job preferences.

```json
{
  "targetRoles": ["Backend Developer"],
  "locations": ["Remote"],
  "salaryMin": 120000,
  "salaryMax": 180000,
  "keywords": ["AI", "Python"],
  "autoApplyEnabled": true,
  "applicationsPerDay": 5,
  "minJobFitScore": 75
}
```

### Resume Endpoints

#### GET `/api/resumes`
Get all user resumes.

#### POST `/api/resumes`
Generate a customized resume.

```json
{
  "jobDescription": "We're looking for a senior React developer...",
  "jobTitle": "Senior React Developer",
  "companyName": "TechCorp",
  "jobId": "uuid-of-job"
}
```

### Application Endpoints

#### GET `/api/applications`
Get all applications.

#### POST `/api/applications`
Create a new application.

```json
{
  "jobId": "uuid",
  "resumeId": "uuid",
  "appliedVia": "linkedin"
}
```

### Billing Endpoints

#### POST `/api/billing/credits`
Create a checkout session for credits.

```json
{
  "creditsPackageId": "credits_100"
}
```

## 🎯 Key Flows

### Job Application Flow
1. User sets preferences and uploads resume
2. System fetches jobs from job platforms
3. Claude scores each job against user profile (0-100)
4. High-scoring jobs are queued for application
5. BullMQ worker generates customized resume
6. Worker submits application via platform API or Puppeteer
7. Application status is tracked and displayed

### Resume Generation Flow
1. User provides original resume
2. Job description is analyzed for key requirements
3. Claude generates customized version highlighting relevant skills
4. Multiple versions are stored for comparison
5. User can preview before submitting application

### Monetization Flow
1. User selects credits package or subscription
2. Stripe checkout session is created
3. Payment is processed
4. Credits/subscription is activated
5. Each application costs 1 credit
6. User dashboard shows credit balance and usage

## 🚀 Deployment

### Deploy to Vercel

```bash
vercel deploy
```

### Deploy to Railway

See `DEPLOYMENT.md` for detailed instructions on setting up:
- Database (PostgreSQL)
- Redis cache
- Environment variables
- Background job workers

## 📊 Database Migrations

### Create a migration
```bash
npm run db:generate -- --name "migration_name"
```

### Apply migrations
```bash
npm run db:push
```

### Custom migrations
```bash
npm run db:migrate
```

## 🧪 Testing

### Run unit tests
```bash
npm run test
```

### Run end-to-end tests
```bash
npm run test:e2e
```

### Generate coverage report
```bash
npm run test:coverage
```

## 📦 Project Structure

```
resumereach/
├── app/                          # Next.js app directory
│   ├── (auth)/                   # Auth pages
│   ├── dashboard/                # Dashboard pages
│   ├── api/                      # API routes
│   ├── layout.tsx
│   └── globals.css
├── components/                   # React components
│   ├── auth/
│   ├── dashboard/
│   └── ui/
├── lib/
│   ├── auth.ts                   # NextAuth configuration
│   ├── claude.ts                 # Claude API wrapper
│   ├── db.ts                     # Database client
│   └── utils.ts
├── services/
│   ├── ResumeService.ts
│   ├── JobMatchingService.ts
│   ├── ApplicationService.ts
│   └── BillingService.ts
├── db/
│   ├── schema.ts                 # Drizzle schema
│   └── migrations/
├── jobs/
│   └── worker.ts                 # BullMQ workers
├── public/                       # Static assets
├── drizzle.config.ts
├── next.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

## 🔐 Security

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Sessions**: NextAuth.js with secure cookies
- **Database**: SQL injection protection via Drizzle ORM
- **API Routes**: All protected routes require authentication
- **Environment Secrets**: Stored in `.env.local` (never committed)
- **CORS**: Configured for API security
- **Rate Limiting**: Recommended for production (add nginx/Cloudflare)

## 📝 Environment Variables

```env
# Database
DATABASE_URL=postgresql://...

# NextAuth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000

# OAuth Providers
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# APIs
ANTHROPIC_API_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_PUBLISHABLE_KEY=...
STRIPE_WEBHOOK_SECRET=...

# Job Platforms
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
INDEED_API_KEY=...
ZIPRECRUITER_API_KEY=...

# Redis
REDIS_URL=redis://localhost:6379

# App
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 💡 Key Decisions

1. **NextAuth.js** - Built-in support for OAuth and session management
2. **Drizzle ORM** - Type-safe queries with excellent IDE support
3. **BullMQ** - Production-grade job queue with Redis
4. **Claude API** - State-of-the-art AI for resume generation
5. **Stripe** - Industry-standard payment processing
6. **Tailwind CSS** - Rapid UI development with consistency

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests: `npm run test`
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙋 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review API documentation

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] More job platforms (CareerBuilder, Glassdoor)
- [ ] Advanced filtering and job recommendations
- [ ] Interview preparation with Claude
- [ ] Salary negotiation assistant
- [ ] Team/organization features
- [ ] Analytics dashboard enhancements

---

**Made with ❤️ for job seekers everywhere**
