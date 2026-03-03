# vercel-deploy Skill

**Name:** vercel-deploy  
**Purpose:** Deploy Next.js and Node.js projects to Vercel with a single command  
**Status:** Production Ready

## Quick Start

```bash
vercel-deploy \
  --project my-app \
  --path /path/to/project \
  --env OPENAI_API_KEY=sk-... \
  --env DATABASE_URL=postgresql://...
```

## What It Does

The skill automates the entire deployment pipeline:

1. **Validates** project structure (package.json, build script, Next.js detection)
2. **Initializes** Git repo if needed
3. **Creates** GitHub repository (if not already connected)
4. **Pushes** code to GitHub
5. **Creates** Vercel project from GitHub
6. **Configures** environment variables
7. **Deploys** to production
8. **Returns** live URL and deployment status

## Features

| Feature | Status | Notes |
|---------|--------|-------|
| One-command deployment | ✅ | Full pipeline automation |
| Next.js detection | ✅ | Auto-detects framework |
| GitHub integration | ✅ | Auto-creates repos |
| Environment variables | ✅ | Via CLI, .env file, or .env.example |
| Deployment tracking | ✅ | Real-time status |
| Rollback support | ✅ | Revert to previous deployments |
| Custom domains | ✅ | Assign custom domains |
| Error handling | ✅ | Comprehensive logging |
| Monorepo support | ✅ | Works with monorepos |
| Preview deployments | ✅ | Auto-preview on PRs |

## Installation

```bash
# Install Vercel CLI globally
npm install -g vercel

# Or install locally in your project
npm install --save-dev vercel
```

## Authentication

The skill requires two sets of credentials:

### GitHub Token
```bash
export GITHUB_TOKEN="ghp_xxxxxxxxxxxx"
```

Get token: https://github.com/settings/tokens/new  
Required scopes: `repo`, `user`

### Vercel Token
```bash
export VERCEL_TOKEN="xxxxxxxxxxxx"
```

Get token: https://vercel.com/account/tokens  
Scopes: `full`

## Command Reference

### Deploy with Environment Variables

```bash
vercel-deploy \
  --project resumereach \
  --path ./resumereach-rebuild \
  --env OPENAI_API_KEY=sk-... \
  --env STRIPE_SECRET_KEY=sk_live_...
```

**Options:**
- `--project`: Project name (used for GitHub repo & Vercel project)
- `--path`: Path to project directory (default: current directory)
- `--env`: Environment variables (repeatable, format: KEY=VALUE)

### Deploy with .env File

```bash
vercel-deploy \
  --project my-app \
  --path ./my-app \
  --env-file .env.production
```

### Check Status Only

```bash
vercel-deploy --status --project resumereach
```

Returns:
- Deployment status
- Live URL
- Last deployment time
- Environment variables summary

### Show Configuration

```bash
vercel-deploy --config --project resumereach
```

### List Deployments

```bash
vercel-deploy --deployments --project resumereach
```

### Rollback to Previous Deployment

```bash
vercel-deploy --rollback --project resumereach --deployment <deployment-id>
```

## Exit Codes

| Code | Meaning | Action |
|------|---------|--------|
| 0 | Success | Deployment complete |
| 1 | Validation failed | Check project structure |
| 2 | GitHub auth failed | Verify GITHUB_TOKEN |
| 3 | Vercel auth failed | Verify VERCEL_TOKEN |
| 4 | Deployment failed | Check Vercel logs |
| 5 | Environment setup failed | Verify env vars |

## Logs

All operations are logged to `~/.openclaw/logs/vercel-deploy.log`

View logs:
```bash
tail -f ~/.openclaw/logs/vercel-deploy.log
```

## Environment Variables

The skill can read environment variables from:

1. **Command-line arguments** (highest priority)
   ```bash
   vercel-deploy --env KEY=VALUE
   ```

2. **.env.local** (project-specific, not committed)
   ```bash
   OPENAI_API_KEY=sk-...
   DATABASE_URL=postgresql://...
   ```

3. **.env.example** (template, committed to repo)
   ```bash
   # .env.example
   OPENAI_API_KEY=your-key-here
   DATABASE_URL=your-database-url
   ```

4. **Environment file** (via --env-file)
   ```bash
   vercel-deploy --env-file .env.production
   ```

## Advanced Options

### Deploy to Specific Team

```bash
vercel-deploy \
  --project my-app \
  --team my-org-team
```

### Custom Build Command

```bash
vercel-deploy \
  --project my-app \
  --build-cmd "npm run build:prod"
```

### Set Custom Domain

```bash
vercel-deploy \
  --project my-app \
  --domain myapp.com
```

### Dry Run (Preview without deploying)

```bash
vercel-deploy \
  --project my-app \
  --dry-run
```

## GitHub Integration

The skill creates a GitHub repository automatically:

- **Naming:** Follows GitHub naming rules (slugified project name)
- **Visibility:** Private by default (use `--public` for public repos)
- **Initial commit:** Automatic with timestamp
- **Branch:** Defaults to `main`

To use existing repository:

```bash
vercel-deploy \
  --project my-app \
  --github-repo existing-owner/existing-repo
```

## Troubleshooting

### Auth Issues
- **GitHub:** Check GITHUB_TOKEN is valid and has `repo` scope
- **Vercel:** Check VERCEL_TOKEN is valid and not expired

### Build Failures
- Check `build` script in package.json
- Verify all dependencies are listed (including dev dependencies)
- Review Vercel build logs: `vercel-deploy --logs --project name`

### Environment Variable Issues
- Verify syntax: `KEY=VALUE` (no spaces around `=`)
- Check for special characters (may need escaping)
- Verify variables are available during build

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for more help.

## Integration with OpenClaw

Use the skill from OpenClaw workflows:

```typescript
// Example: Deploy from OpenClaw agent
const { exec } = require('child_process');

exec(`vercel-deploy \
  --project ${projectName} \
  --path ${projectPath} \
  --env OPENAI_API_KEY=${process.env.OPENAI_API_KEY}`, 
  (error, stdout, stderr) => {
    if (error) console.error(error);
    console.log(stdout);
  }
);
```

Or invoke directly:

```bash
# From OpenClaw workspace
source ~/openclaw/skills/vercel-deploy/script/deploy.sh
deploy_project "my-app" "/path/to/project"
```

## Performance

- **Validation:** ~2 seconds
- **GitHub setup:** ~5 seconds
- **Vercel link:** ~10 seconds
- **Environment setup:** ~2 seconds
- **Deployment:** 30-120 seconds (varies by project size)

**Total:** 50-140 seconds typical

## Support

- Documentation: [README.md](./README.md)
- Examples: [EXAMPLES.md](./EXAMPLES.md)
- Troubleshooting: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

## License

MIT
