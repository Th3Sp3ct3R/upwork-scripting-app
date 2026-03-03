# vercel-deploy Examples

Real-world deployment scenarios with complete commands.

## Example 1: ResumeReach App (Next.js + OpenAI)

**Project:** ResumeReach builder app with AI resume enhancement

**Stack:** Next.js 14, React, OpenAI API, Stripe

```bash
vercel-deploy \
  --project resumereach \
  --path /Users/growthgod/.openclaw/workspace/resumereach-rebuild \
  --env OPENAI_API_KEY=sk-proj-abc123xyz789 \
  --env STRIPE_SECRET_KEY=sk_live_51234567890 \
  --env STRIPE_PUBLISHABLE_KEY=pk_live_xyz \
  --env NEXT_PUBLIC_API_URL=https://resumereach.vercel.app \
  --env DATABASE_URL=postgresql://user:pass@db.example.com:5432/resumereach
```

**Expected output:**
```
✓ Validating project...
✓ Setting up GitHub...
✓ Deploying to Vercel...
✓ Deployment completed
✓ Project URL: https://resumereach.vercel.app
```

**Time:** ~60-90 seconds

---

## Example 2: Agent Intelligence Engine (Node.js + Express)

**Project:** Multi-agent orchestration backend

**Stack:** Node.js 20, Express, MongoDB, JWT

```bash
vercel-deploy \
  --project agent-intelligence \
  --path /workspace/agent-intelligence-engine \
  --env NODE_ENV=production \
  --env JWT_SECRET=your-super-secret-jwt-key \
  --env MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db \
  --env LOG_LEVEL=info \
  --env API_PORT=3000
```

**package.json:**
```json
{
  "name": "agent-intelligence",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "build": "echo 'Building...' && npm install",
    "dev": "nodemon index.js"
  },
  "engines": {
    "node": "20.x"
  }
}
```

**Expected result:**
```
✓ Project validated
✓ GitHub repo created
✓ Environment variables set (5 total)
✓ Deployment URL: https://agent-intelligence.vercel.app
```

---

## Example 3: React Dashboard (Client-side SPA)

**Project:** Analytics dashboard built with React

**Stack:** React 18, TypeScript, React Query, Recharts

```bash
vercel-deploy \
  --project analytics-dashboard \
  --path ./dashboard \
  --env REACT_APP_API_URL=https://api.example.com \
  --env REACT_APP_AUTH_DOMAIN=auth.example.com \
  --env REACT_APP_CLIENT_ID=abc123xyz789
```

**Notes:**
- Environment variables must be prefixed with `REACT_APP_` to be available in browser
- Build command is standard: `npm run build`
- Output directory: `build/`

---

## Example 4: Using .env File

**Scenario:** Production deployment with multiple environments

**Command:**
```bash
vercel-deploy \
  --project my-app \
  --path . \
  --env-file .env.production
```

**.env.production:**
```
OPENAI_API_KEY=sk-proj-xxx
DATABASE_URL=postgresql://prod_user:secure_pass@prod-db.com:5432/myapp
REDIS_URL=redis://prod-redis.com:6379
JWT_SECRET=very-long-secure-secret-key
LOG_LEVEL=info
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

**Workflow:**
1. ✓ File validated
2. ✓ All variables extracted
3. ✓ Variables set in Vercel
4. ✓ Deployment with environment configured

---

## Example 5: Monorepo (Multiple Packages)

**Project structure:**
```
monorepo/
├── packages/
│   ├── web/        (Next.js frontend)
│   ├── api/        (Express backend)
│   └── shared/     (Shared utilities)
└── package.json
```

**Deploy frontend:**
```bash
vercel-deploy \
  --project my-web \
  --path ./packages/web \
  --env NEXT_PUBLIC_API_URL=https://my-api.vercel.app
```

**Deploy backend:**
```bash
vercel-deploy \
  --project my-api \
  --path ./packages/api \
  --env DATABASE_URL=postgresql://... \
  --env JWT_SECRET=...
```

**Notes:**
- Each package needs its own `package.json`
- Specify correct `--path` for each package
- Shared dependencies installed from monorepo root

---

## Example 6: Team Deployment

**Deploy to organization team:**
```bash
vercel-deploy \
  --project my-app \
  --path . \
  --team my-organization \
  --domain myapp.com
```

**Effects:**
- ✓ Project created under team
- ✓ Custom domain assigned
- ✓ Team billing applies
- ✓ Team members can manage deployment

---

## Example 7: Dry Run (Preview)

**Test deployment without actually deploying:**
```bash
vercel-deploy \
  --project my-app \
  --path . \
  --env OPENAI_API_KEY=sk-... \
  --dry-run
```

**Output:**
```
ℹ Step 1/5: Validating project...
✓ Project validation completed
ℹ Step 2/5: Setting up GitHub...
✓ GitHub setup completed
ℹ Step 3/5: Dry run (not deploying)
✓ Deployment preview complete (use without --dry-run to deploy)
```

**Use cases:**
- Verify configuration before real deployment
- Check for validation errors
- Preview environment setup

---

## Example 8: Redeployment (CI/CD)

**Automated deployment from GitHub workflow:**

**.github/workflows/deploy.yml:**
```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy with vercel-deploy
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: |
          bash script/deploy.sh \
            --project my-app \
            --path . \
            --env OPENAI_API_KEY=$OPENAI_API_KEY
```

**GitHub Secrets Setup:**
- Settings → Secrets and variables → Actions
- Add: GITHUB_TOKEN, VERCEL_TOKEN, OPENAI_API_KEY, etc.

---

## Example 9: Status Checking

**Check deployment status without redeploying:**
```bash
vercel-deploy --status --project resumereach
```

**Output:**
```
ℹ Checking deployment status for: resumereach
Url: https://resumereach.vercel.app
Status: READY
Created: 2024-02-13T15:30:45.000Z
Updated: 2024-02-13T15:35:22.000Z
```

**Useful for:**
- Verification scripts
- Health checks
- CI/CD pipelines

---

## Example 10: Full Deployment with All Options

**Complete example with everything:**
```bash
vercel-deploy \
  --project production-api \
  --path ./backend \
  --team enterprise-org \
  --domain api.company.com \
  --env NODE_ENV=production \
  --env LOG_LEVEL=info \
  --env DATABASE_URL="postgresql://user:pass@prod.db:5432/myapp" \
  --env REDIS_URL="redis://prod.redis:6379/0" \
  --env JWT_SECRET="$(openssl rand -base64 32)" \
  --env OPENAI_API_KEY="$OPENAI_API_KEY" \
  --env STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" \
  --env STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET" \
  --build-cmd "npm run build:prod" \
  --env-file .env.secrets
```

**What happens:**
1. ✓ Validates project at `./backend`
2. ✓ Sets up GitHub repository
3. ✓ Creates Vercel project under team
4. ✓ Assigns custom domain `api.company.com`
5. ✓ Sets 8 environment variables
6. ✓ Uses custom build command
7. ✓ Loads additional secrets from file
8. ✓ Deploys to production
9. ✓ Returns deployment URL

---

## Troubleshooting Examples

### Example: Fix Auth Error

```bash
# Error: GITHUB_TOKEN not set

# Solution:
export GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxx"
export VERCEL_TOKEN="xxxxxxxxxxxx"

vercel-deploy --project my-app --path .
```

### Example: Fix Invalid .env Format

```bash
# ✗ Invalid: spaces around =
--env KEY = VALUE

# ✓ Correct:
--env KEY=VALUE
```

### Example: Fix Missing Build Script

```bash
# Check package.json
cat package.json | jq '.scripts'

# If no build script, add it:
npm pkg set scripts.build="next build"

# Then deploy
vercel-deploy --project my-app --path .
```

### Example: Fix Deployment to Wrong Team

```bash
# Use --team to deploy to correct organization
vercel-deploy \
  --project my-app \
  --path . \
  --team correct-team-name
```

---

## Quick Reference

### For Next.js Apps
```bash
vercel-deploy \
  --project my-nextjs-app \
  --path . \
  --env NEXT_PUBLIC_API_URL=https://api.example.com
```

### For Express/Node Apps
```bash
vercel-deploy \
  --project my-express-api \
  --path . \
  --env DATABASE_URL=postgresql://...
```

### For React SPAs
```bash
vercel-deploy \
  --project my-react-app \
  --path . \
  --env REACT_APP_API_URL=https://api.example.com
```

### For Monorepos
```bash
vercel-deploy \
  --project my-web \
  --path ./packages/web

vercel-deploy \
  --project my-api \
  --path ./packages/api
```

### For Team Deployments
```bash
vercel-deploy \
  --project my-app \
  --path . \
  --team organization-name \
  --domain custom.domain.com
```

---

## Performance Tips

1. **Cache dependencies** — Use Vercel caching
2. **Skip validation** — If you trust your project: `--skip-validation`
3. **Skip GitHub** — If repo already exists: `--skip-github`
4. **Batch deployments** — Deploy multiple projects in sequence
5. **Use .env file** — Faster than multiple `--env` flags

---

## More Resources

- [SKILL.md](./SKILL.md) — Full API reference
- [README.md](./README.md) — Complete guide
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) — Solutions
- Vercel Docs: https://vercel.com/docs
