# Deployment Guide - ResumeReach

Complete guide to deploying ResumeReach to production across frontend, database, and background workers.

## 🎯 Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CDN / Cloudflare                      │
└─────────────────────────────────────────────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
    ┌────▼────┐      ┌──────▼──────┐     ┌────▼────┐
    │ Vercel  │      │  Vercel API │     │ Vercel  │
    │ (Next.js)      │  (Routes)    │     │(Webhooks)
    │ Frontend│      │              │     │         │
    └─────────┘      └──────┬───────┘     └────┬────┘
                            │                   │
                     ┌──────▼──────────────────▼──┐
                     │    Railway / AWS RDS       │
                     │   PostgreSQL Database      │
                     └──────┬────────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
    ┌────▼────┐      ┌──────▼──────┐     ┌────▼────┐
    │ Railway │      │  Railway    │     │ Railway │
    │ Worker 1│      │  Worker 2   │     │ Redis   │
    │(BullMQ) │      │  (BullMQ)    │     │         │
    └─────────┘      └─────────────┘     └─────────┘
```

## 📋 Prerequisites

- GitHub account (for deployment)
- Vercel account (free tier)
- Railway account (free tier with $5 credit)
- API keys:
  - Anthropic Claude
  - Stripe
  - Google OAuth
  - GitHub OAuth
  - LinkedIn API (for job scraping)
  - Indeed API (for job scraping)

## 🚀 Step 1: Prepare the Repository

### 1.1 Create GitHub Repository

```bash
cd resumereach-rebuild
git init
git add .
git commit -m "Initial commit: ResumeReach full-stack application"
git branch -M main
git remote add origin https://github.com/yourusername/resumereach.git
git push -u origin main
```

### 1.2 Verify Files

Ensure these key files exist:
- `.gitignore` - Excludes node_modules, .env files
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript config
- `next.config.mjs` - Next.js config
- `.env.example` - Environment template

## 📦 Step 2: Deploy Database (Railway)

### 2.1 Create Railway PostgreSQL

1. Go to [Railway.app](https://railway.app)
2. Click "New Project"
3. Select "Provision PostgreSQL"
4. Configure:
   - Region: Closest to your users
   - Database name: `resumereach`

### 2.2 Get Database URL

From Railway dashboard:
1. Click on PostgreSQL database
2. Copy "DATABASE_PUBLIC_URL"
3. It will look like: `postgresql://username:password@host:port/resumereach`

### 2.3 Run Migrations

1. In your local environment:
```bash
DATABASE_URL="postgresql://..." npm run db:push
```

2. Verify tables are created:
```bash
psql your_database_url -c "\dt"
```

## 🔄 Step 3: Set Up Redis Cache (Railway)

### 3.1 Add Redis to Project

1. In Railway project, click "Add Service"
2. Select "Redis"
3. Configure:
   - Version: Latest stable

### 3.2 Get Redis URL

1. Click on Redis database
2. Copy connection string
3. It will look like: `redis://username:password@host:port`

## 🌐 Step 4: Deploy Frontend (Vercel)

### 4.1 Connect GitHub Repository

1. Go to [Vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Select `resumereach-rebuild` folder as root

### 4.2 Configure Environment Variables

In Vercel deployment settings, add:

```env
# Database
DATABASE_URL=postgresql://...

# NextAuth
NEXTAUTH_SECRET=(generate with: openssl rand -base64 32)
NEXTAUTH_URL=https://yourdomain.vercel.app

# OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# APIs
ANTHROPIC_API_KEY=sk-ant-...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Job Platforms
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
INDEED_API_KEY=...
ZIPRECRUITER_API_KEY=...

# Redis
REDIS_URL=redis://...

# App
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.vercel.app
```

### 4.3 Deploy

```bash
vercel deploy --prod
```

Vercel will automatically deploy your Next.js frontend and API routes.

## 👷 Step 5: Deploy Background Workers (Railway)

### 5.1 Create Worker Service on Railway

1. In your Railway project, add a new service
2. Select "Deploy from GitHub repo"
3. Connect your resumereach repository
4. Configure start command:
```
npm run worker
```

### 5.2 Add Environment Variables

Add the same environment variables as frontend:
- DATABASE_URL
- REDIS_URL
- ANTHROPIC_API_KEY
- All OAuth and API keys

### 5.3 Scale Workers (Optional)

In Railway, you can create multiple worker instances:

1. Click on worker service
2. Adjust "Replica Count" to 3-5 for production
3. Set CPU and memory limits

## 🔑 Step 6: Configure OAuth Providers

### 6.1 Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project
3. Enable OAuth 2.0
4. Create OAuth 2.0 Client ID:
   - Type: Web application
   - Authorized redirect URIs:
     - `https://yourdomain.vercel.app/api/auth/callback/google`
     - `http://localhost:3000/api/auth/callback/google` (dev)
5. Copy Client ID and Secret

### 6.2 GitHub OAuth

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Create new OAuth App:
   - Application name: ResumeReach
   - Homepage URL: `https://yourdomain.vercel.app`
   - Authorization callback URL: `https://yourdomain.vercel.app/api/auth/callback/github`
3. Copy Client ID and Client Secret

### 6.3 Add to Environment

Add to Vercel and Railway:
```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

## 💳 Step 7: Configure Stripe

### 7.1 Get Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Get API keys from Developers → API Keys
3. Copy Secret Key and Publishable Key

### 7.2 Create Products

In Stripe Dashboard, create products:

**Credits**:
- 30 credits for $10
- 100 credits for $25
- 250 credits for $50

**Subscriptions**:
- Basic: $9.99/month (5 apps/day)
- Pro: $24.99/month (20 apps/day)
- Basic Yearly: $99.99/year
- Pro Yearly: $249.99/year

### 7.3 Set Webhook

1. Go to Webhooks section
2. Add endpoint: `https://yourdomain.vercel.app/api/webhooks/stripe`
3. Subscribe to events:
   - `charge.succeeded`
   - `checkout.session.completed`
   - `customer.subscription.updated`

### 7.4 Add to Environment

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 🧪 Step 8: Verification

### 8.1 Test Endpoints

```bash
# Health check
curl https://yourdomain.vercel.app/api/health

# Signup
curl -X POST https://yourdomain.vercel.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'

# Get profile
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://yourdomain.vercel.app/api/profile
```

### 8.2 Check Logs

**Vercel**:
```bash
vercel logs
```

**Railway**:
1. Click on service
2. Go to "Logs" tab
3. Check for errors

### 8.3 Database Verification

```bash
psql your_database_url
\dt  # List tables
\d users  # Describe users table
SELECT COUNT(*) FROM users;  # Check data
```

## 📊 Monitoring & Maintenance

### 8.1 Monitor Application

**Vercel Analytics**:
- Go to project settings
- Enable Web Analytics
- View real-time metrics

**Railway Metrics**:
- CPU, memory, network usage
- Database connection count
- Redis usage

### 8.2 Set Up Alerts

**Railway Alerts**:
1. Project settings
2. Add alert for:
   - High memory usage (>90%)
   - High CPU usage (>80%)
   - Low disk space

**Sentry Integration** (optional):
1. Create Sentry account
2. Add to environment: `SENTRY_DSN=...`
3. Monitor errors and performance

## 🔄 Continuous Deployment

### 8.3 GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: npm run test:coverage
      - name: Deploy to Vercel
        run: vercel deploy --prod
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

## 🔐 Security Checklist

- [ ] All API keys are in environment variables
- [ ] `.env.local` is in `.gitignore`
- [ ] Database has SSL/TLS enabled
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] CSRF protection is active
- [ ] Sensitive routes require authentication
- [ ] Database backups are configured
- [ ] Logs are aggregated
- [ ] Monitoring alerts are set up

## 🚨 Troubleshooting

### Issue: Database Connection Timeout

**Solution**:
1. Verify DATABASE_URL in environment
2. Check Railway PostgreSQL service is running
3. Ensure firewall allows connections

### Issue: Redis Connection Error

**Solution**:
1. Verify REDIS_URL format
2. Check Railway Redis service status
3. Ensure correct region

### Issue: Workers Not Processing Jobs

**Solution**:
1. Check worker logs in Railway
2. Verify Redis connection
3. Ensure correct queue names
4. Check BullMQ job status

### Issue: OAuth Not Working

**Solution**:
1. Verify callback URLs match exactly
2. Check client ID and secret
3. Ensure NEXTAUTH_SECRET is set
4. Check NEXTAUTH_URL matches domain

## 📈 Scaling for Production

### Database Scaling

1. **Read Replicas**: Add read replicas for high-traffic reads
2. **Connection Pooling**: Enable PgBouncer
3. **Backups**: Configure automated daily backups

### Worker Scaling

1. **Replicas**: Increase worker replicas in Railway
2. **Concurrency**: Adjust BullMQ concurrency settings
3. **Memory**: Increase per-worker memory allocation

### API Scaling

1. **Caching**: Add caching headers
2. **CDN**: Enable Vercel Edge Caching
3. **Rate Limiting**: Add rate limiting middleware

## 📞 Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [PostgreSQL Hosting](https://www.postgresql.org/support/)
- [Stripe API Docs](https://stripe.com/docs/api)

---

**Successfully deployed? Great! You're running ResumeReach on production! 🎉**
