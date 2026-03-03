# vercel-deploy Skill

A reusable OpenClaw skill for deploying Next.js and Node.js projects to Vercel with a single command.

## Overview

The `vercel-deploy` skill automates the entire deployment pipeline:

```
Validate Project → Setup Git → Push to GitHub → Create Vercel Project → Set Env Vars → Deploy → Return URL
```

**Time:** ~50-140 seconds typical  
**Status:** Production Ready ✓

## Installation

1. **Ensure prerequisites are installed:**
   ```bash
   # Node.js and npm
   node --version  # v18+
   npm --version   # v9+

   # Git
   git --version

   # Vercel CLI
   npm install -g vercel

   # GitHub CLI (recommended but optional)
   brew install gh  # macOS
   ```

2. **Set up authentication tokens:**
   ```bash
   # GitHub token (https://github.com/settings/tokens/new)
   # Scopes needed: repo, user
   export GITHUB_TOKEN="ghp_xxxxxxxxxxxx"

   # Vercel token (https://vercel.com/account/tokens)
   export VERCEL_TOKEN="xxxxxxxxxxxx"
   ```

3. **Make scripts executable:**
   ```bash
   chmod +x /Users/growthgod/openclaw/skills/vercel-deploy/script/*.sh
   ```

## Quick Start

### Basic Deployment

```bash
cd /path/to/project

vercel-deploy \
  --project my-app \
  --path .
```

### With Environment Variables

```bash
vercel-deploy \
  --project resumereach \
  --path ./resumereach-rebuild \
  --env OPENAI_API_KEY=sk-... \
  --env STRIPE_SECRET_KEY=sk_live_... \
  --env DATABASE_URL=postgresql://...
```

### With .env File

```bash
vercel-deploy \
  --project my-app \
  --path ./my-app \
  --env-file .env.production
```

### Check Status

```bash
vercel-deploy --status --project my-app
```

### Dry Run (Preview)

```bash
vercel-deploy \
  --project my-app \
  --path ./my-app \
  --dry-run
```

## Usage Guide

### Command Syntax

```bash
vercel-deploy [OPTIONS]
```

### Core Options

| Option | Required | Description |
|--------|----------|-------------|
| `--project <name>` | Yes | Project name (used for repo & Vercel project) |
| `--path <path>` | No | Project directory (default: current directory) |
| `--env <KEY=VALUE>` | No | Environment variable (repeatable) |
| `--env-file <file>` | No | Load env vars from file |
| `--domain <domain>` | No | Custom domain to assign |
| `--team <team>` | No | Vercel team scope |
| `--build-cmd <cmd>` | No | Custom build command |

### Utility Options

| Option | Description |
|--------|-------------|
| `--status` | Show deployment status |
| `--config` | Show project configuration |
| `--deployments` | List all deployments |
| `--logs` | Show deployment logs |
| `--rollback <id>` | Rollback to previous deployment |

### Advanced Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Preview deployment without actually deploying |
| `--skip-validation` | Skip project validation |
| `--skip-github` | Skip GitHub setup (use existing repo) |
| `--help` | Show help message |

## Project Structure

The skill expects standard Node.js project structure:

```
my-app/
├── package.json          (required)
├── package-lock.json
├── .git/                 (optional, created if missing)
├── .gitignore            (recommended)
├── .env.example          (recommended)
├── README.md             (recommended)
├── vercel.json           (optional)
└── src/                  (project code)
```

## Environment Variables

Environment variables can come from multiple sources (in order of priority):

### 1. Command-line Arguments

```bash
vercel-deploy \
  --project my-app \
  --env KEY1=value1 \
  --env KEY2=value2
```

### 2. Environment File

```bash
vercel-deploy \
  --project my-app \
  --env-file .env.production
```

File format:
```
# .env.production
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_live_...
```

### 3. .env.example Template

If no variables provided, the skill looks for `.env.example`:

```
# .env.example
OPENAI_API_KEY=your-key-here
DATABASE_URL=your-database-url
STRIPE_SECRET_KEY=your-secret-key
```

## Framework Detection

The skill automatically detects your framework:

| Framework | Detection | Special Handling |
|-----------|-----------|------------------|
| Next.js | Looks for `next` in package.json | Uses Next.js output directory |
| React | Looks for `react` in package.json | Uses React build settings |
| Express | Looks for `express` in package.json | Uses Node.js settings |
| Generic Node | Fallback | Standard Node deployment |

## GitHub Integration

The skill automatically handles GitHub:

1. **Initializes Git** if not already initialized
2. **Creates GitHub repo** if doesn't exist
3. **Makes initial commit** with timestamp
4. **Pushes to GitHub** on the `main` branch
5. **Connects to Vercel** via GitHub import

### Using Existing Repository

```bash
vercel-deploy \
  --project my-app \
  --skip-github  # Use existing GitHub repo
```

## Deployment Process

### Step 1: Validation
- ✓ Checks project directory exists
- ✓ Verifies package.json is valid JSON
- ✓ Detects framework type
- ✓ Checks for build script
- ✓ Validates dependencies

### Step 2: GitHub Setup
- ✓ Initializes Git repository
- ✓ Creates initial commit
- ✓ Creates GitHub repository
- ✓ Pushes code to GitHub

### Step 3: Vercel Deployment
- ✓ Links project to Vercel
- ✓ Sets environment variables
- ✓ Triggers production build
- ✓ Deploys to production

### Step 4: Verification
- ✓ Confirms deployment success
- ✓ Returns live URL

## Error Handling

Exit codes indicate deployment status:

| Code | Status | Action |
|------|--------|--------|
| 0 | ✓ Success | Deployment complete |
| 1 | ✗ Validation Failed | Check project structure |
| 2 | ✗ Auth Failed | Verify GITHUB_TOKEN and VERCEL_TOKEN |
| 3 | ✗ Vercel Auth Failed | Check VERCEL_TOKEN |
| 4 | ✗ Deployment Failed | Check Vercel logs |
| 5 | ✗ Env Setup Failed | Verify environment variables |

## Logging

All operations are logged to:
```
~/.openclaw/logs/vercel-deploy.log
```

View logs in real-time:
```bash
tail -f ~/.openclaw/logs/vercel-deploy.log
```

## Examples

### Example 1: Deploy ResumeReach App

```bash
vercel-deploy \
  --project resumereach \
  --path /Users/growthgod/.openclaw/workspace/resumereach-rebuild \
  --env OPENAI_API_KEY=sk-proj-xxx \
  --env STRIPE_SECRET_KEY=sk_live_xxx \
  --env DATABASE_URL=postgresql://user:pass@host/db
```

### Example 2: Deploy with Existing .env File

```bash
vercel-deploy \
  --project agent-intelligence \
  --path ./agent-intelligence-engine \
  --env-file .env.production
```

### Example 3: Deploy to Team

```bash
vercel-deploy \
  --project my-app \
  --path . \
  --team my-org-team \
  --domain myapp.com
```

### Example 4: Dry Run

```bash
vercel-deploy \
  --project my-app \
  --path . \
  --dry-run  # Preview without deploying
```

### Example 5: Check Status

```bash
vercel-deploy --status --project resumereach
```

### Example 6: View Deployments

```bash
vercel-deploy --deployments --project my-app
```

## Troubleshooting

### Authentication Issues

**GitHub Token**
- Verify token at: https://github.com/settings/tokens
- Ensure scopes include: `repo`, `user`
- Regenerate token if expired

**Vercel Token**
- Verify token at: https://vercel.com/account/tokens
- Ensure it's not expired or revoked
- Regenerate if needed

### Build Failures

1. **Check build script exists:**
   ```bash
   cat package.json | jq '.scripts.build'
   ```

2. **Test build locally:**
   ```bash
   npm run build
   ```

3. **Check dependencies:**
   ```bash
   npm list
   ```

4. **View Vercel logs:**
   ```bash
   vercel logs --project my-app --token $VERCEL_TOKEN
   ```

### Environment Variable Issues

1. **Verify format (KEY=VALUE, no spaces):**
   ```bash
   vercel-deploy --status --project my-app
   ```

2. **Check all variables set:**
   ```bash
   vercel env ls --token $VERCEL_TOKEN --project my-app
   ```

3. **Escape special characters if needed:**
   ```bash
   vercel-deploy --project my-app --env "DATABASE_URL=postgresql://user:p@ss@host/db"
   ```

### GitHub Issues

1. **Check GitHub authentication:**
   ```bash
   gh auth status
   ```

2. **Login to GitHub:**
   ```bash
   gh auth login
   ```

3. **Check repository:**
   ```bash
   gh repo view
   ```

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for more solutions.

## Advanced Configuration

### Custom vercel.json

Create `vercel.json` in your project root for fine-grained control:

```json
{
  "buildCommand": "npm run build:prod",
  "outputDirectory": ".next",
  "env": {
    "OPENAI_API_KEY": "@openai_api_key"
  },
  "functions": {
    "api/**/*.js": {
      "maxDuration": 60
    }
  }
}
```

### Monorepo Support

For monorepos, specify the subdirectory:

```bash
vercel-deploy \
  --project my-api \
  --path ./packages/api
```

### Preview Deployments

Deployments from branches other than main create preview URLs:

```
https://my-app-branch-name.vercel.app
```

## Integration with OpenClaw

### Use in OpenClaw Workflows

```bash
# From OpenClaw agent
vercel-deploy \
  --project $PROJECT_NAME \
  --path $PROJECT_PATH \
  --env "OPENAI_API_KEY=${OPENAI_API_KEY}"
```

### Source Scripts Directly

```bash
source ~/openclaw/skills/vercel-deploy/script/utils.sh

# Use utility functions
validate_project_dir "/path/to/project"
detect_framework "/path/to/project"
```

## Support & Troubleshooting

- **Documentation:** [SKILL.md](./SKILL.md)
- **Examples:** [EXAMPLES.md](./EXAMPLES.md)
- **Troubleshooting:** [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **Tests:** Run `npm test`

## License

MIT

## Version

1.0.0 - Production Ready
