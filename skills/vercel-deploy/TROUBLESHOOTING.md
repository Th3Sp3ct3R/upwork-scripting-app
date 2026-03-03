# Troubleshooting Guide

Common issues and solutions for vercel-deploy.

## Authentication & Access

### Issue: "GITHUB_TOKEN not set"

**Error Message:**
```
✗ GITHUB_TOKEN not set
✗ Missing required authentication tokens
```

**Solutions:**

1. **Set GitHub token:**
   ```bash
   export GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxx"
   ```

2. **Generate token:**
   - Visit: https://github.com/settings/tokens/new
   - Create "Personal Access Token"
   - Select scopes: `repo`, `user`
   - Copy token and set environment variable

3. **Verify token is set:**
   ```bash
   echo $GITHUB_TOKEN
   ```

4. **Verify token permissions:**
   ```bash
   curl -H "Authorization: token $GITHUB_TOKEN" \
     https://api.github.com/user
   ```

---

### Issue: "VERCEL_TOKEN not set"

**Error Message:**
```
✗ VERCEL_TOKEN not set
✗ Vercel auth failed
```

**Solutions:**

1. **Set Vercel token:**
   ```bash
   export VERCEL_TOKEN="xxxxxxxxxxxxxxxxxxxx"
   ```

2. **Generate token:**
   - Visit: https://vercel.com/account/tokens
   - Create new token
   - Select "Full Access"
   - Copy and set environment variable

3. **Verify token:**
   ```bash
   vercel whoami --token $VERCEL_TOKEN
   ```

4. **Check token expiration:**
   - Visit: https://vercel.com/account/tokens
   - Regenerate if expired

---

### Issue: "GitHub authentication failed"

**Error Message:**
```
✗ GitHub auth failed
Error: Invalid token
```

**Solutions:**

1. **Check GitHub CLI is installed:**
   ```bash
   gh --version
   ```

2. **Login to GitHub:**
   ```bash
   gh auth login
   # Select: GitHub.com
   # Select: HTTPS
   # Paste token when prompted
   ```

3. **Verify authentication:**
   ```bash
   gh auth status
   ```

4. **Update credentials if needed:**
   ```bash
   gh auth logout
   gh auth login
   ```

---

## Project Validation Issues

### Issue: "Project directory not found"

**Error Message:**
```
✗ Project directory not found: /path/to/project
```

**Solutions:**

1. **Check path exists:**
   ```bash
   ls -la /path/to/project
   ```

2. **Use absolute path:**
   ```bash
   vercel-deploy \
     --project my-app \
     --path "$(pwd)/my-app"
   ```

3. **Check current directory:**
   ```bash
   pwd
   vercel-deploy --project my-app --path .
   ```

---

### Issue: "package.json not found"

**Error Message:**
```
✗ package.json not found in: /path/to/project
```

**Solutions:**

1. **Verify project is Node.js:**
   ```bash
   ls -la package.json
   ```

2. **Create package.json if missing:**
   ```bash
   cd /path/to/project
   npm init -y
   ```

3. **Check correct directory:**
   ```bash
   # For monorepo, specify subdirectory
   vercel-deploy --project my-app --path ./packages/api
   ```

---

### Issue: "package.json is not valid JSON"

**Error Message:**
```
✗ package.json is not valid JSON
```

**Solutions:**

1. **Validate JSON:**
   ```bash
   jq . package.json
   ```

2. **Fix JSON errors:**
   ```bash
   # Use JSON linter
   npx jsonlint package.json
   ```

3. **Check for trailing commas:**
   ```bash
   cat package.json | grep -n ','
   ```

---

### Issue: "No build script found"

**Warning Message:**
```
⚠ No build script found in package.json
```

**Solutions:**

1. **Add build script:**
   ```bash
   # Next.js
   npm pkg set scripts.build="next build"

   # React
   npm pkg set scripts.build="react-scripts build"

   # Generic Node
   npm pkg set scripts.build="echo 'No build needed'"
   ```

2. **Verify script works:**
   ```bash
   npm run build
   ```

3. **Use custom build command:**
   ```bash
   vercel-deploy \
     --project my-app \
     --path . \
     --build-cmd "custom build command"
   ```

---

### Issue: "Missing dependencies"

**Warning Message:**
```
⚠ Dependency not found: next
```

**Solutions:**

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Check package.json:**
   ```bash
   cat package.json | jq '.dependencies'
   ```

3. **Add missing dependencies:**
   ```bash
   npm install next react react-dom
   ```

4. **Update package.json manually:**
   ```json
   {
     "dependencies": {
       "next": "^14.0.0",
       "react": "^18.0.0",
       "react-dom": "^18.0.0"
     }
   }
   ```

---

## GitHub Issues

### Issue: "Failed to create GitHub repository"

**Error Message:**
```
✗ Failed to create GitHub repository
```

**Solutions:**

1. **Check GitHub CLI is authenticated:**
   ```bash
   gh auth status
   ```

2. **Verify repository doesn't exist:**
   ```bash
   gh repo list | grep my-app
   ```

3. **Try manual creation:**
   ```bash
   gh repo create my-app --private --source=. --push
   ```

4. **Check rate limits:**
   ```bash
   gh api rate_limit
   ```

---

### Issue: "Repository already exists"

**Error Message:**
```
ℹ Repository already exists: my-app
```

**Solution:**
This is not an error—the script detected existing repository and used it.

To use different repository:
```bash
vercel-deploy \
  --project my-app \
  --path . \
  --skip-github  # Use existing repo without changes
```

---

### Issue: "Failed to push to GitHub"

**Error Message:**
```
✗ Failed to push to GitHub
```

**Solutions:**

1. **Check remote is configured:**
   ```bash
   git remote -v
   ```

2. **Add remote if missing:**
   ```bash
   git remote add origin https://github.com/user/repo.git
   ```

3. **Verify authentication:**
   ```bash
   gh auth status
   ```

4. **Try manual push:**
   ```bash
   git branch -M main
   git push -u origin main --force
   ```

5. **Check branch exists:**
   ```bash
   git branch -a
   ```

---

## Vercel Deployment Issues

### Issue: "Build failed on Vercel"

**Error Message:**
```
✗ Deployment failed
✗ Build failed
```

**Solutions:**

1. **Check build logs:**
   ```bash
   vercel logs --project my-app --tail
   ```

2. **Test build locally:**
   ```bash
   npm run build
   ```

3. **Check build command:**
   ```bash
   cat package.json | jq '.scripts.build'
   ```

4. **Verify all dependencies installed:**
   ```bash
   npm install
   npm run build
   ```

5. **Check for environment variables:**
   - Some builds need env vars to succeed
   - Set via `--env` flag or vercel.json

---

### Issue: "Deployment timeout"

**Error Message:**
```
⚠ Deployment timeout after 120s
```

**Solutions:**

1. **Increase timeout:**
   - Large projects may need more time
   - Check Vercel logs for actual status

2. **Optimize build:**
   - Reduce bundle size
   - Check for large dependencies
   - Use build caching

3. **Check project size:**
   ```bash
   du -sh .
   ```

4. **Skip unnecessary files:**
   - Add to `.gitignore`
   - Add to `vercel.json` ignore list

---

### Issue: "Cannot link to Vercel project"

**Error Message:**
```
✗ Failed to link Vercel project
```

**Solutions:**

1. **Check token is valid:**
   ```bash
   vercel whoami --token $VERCEL_TOKEN
   ```

2. **Verify project doesn't exist:**
   ```bash
   vercel projects list --token $VERCEL_TOKEN
   ```

3. **Create project manually:**
   ```bash
   vercel link --project my-app --token $VERCEL_TOKEN
   ```

4. **Use existing project:**
   ```bash
   vercel-deploy \
     --project existing-project \
     --path .
   ```

---

## Environment Variable Issues

### Issue: "Invalid environment variable format"

**Error Message:**
```
⚠ Invalid environment variable format: KEY = VALUE
```

**Solutions:**

1. **Correct format (no spaces):**
   ```bash
   # ✗ Wrong
   --env KEY = VALUE

   # ✓ Correct
   --env KEY=VALUE
   ```

2. **Special characters must be quoted:**
   ```bash
   --env "DATABASE_URL=postgresql://user:p@ss@host/db"
   ```

3. **Use .env file for complex values:**
   ```bash
   vercel-deploy \
     --project my-app \
     --path . \
     --env-file .env.production
   ```

---

### Issue: "Environment variable not available at build time"

**Problem:**
Variable works locally but not in Vercel build.

**Solutions:**

1. **For Next.js, prefix with `NEXT_PUBLIC_`:**
   ```bash
   --env NEXT_PUBLIC_API_URL=https://api.example.com
   ```

2. **For React, prefix with `REACT_APP_`:**
   ```bash
   --env REACT_APP_API_URL=https://api.example.com
   ```

3. **Check vercel.json:**
   ```json
   {
     "env": {
       "API_URL": "@api_url"
     }
   }
   ```

4. **Use .env.local instead of .env:**
   ```bash
   # Not committed, doesn't affect build
   echo "SECRET=value" > .env.local
   ```

---

### Issue: ".env.example format error"

**Error Message:**
```
⚠ Failed to parse .env.example
```

**Solutions:**

1. **Fix .env.example format:**
   ```
   # .env.example
   KEY1=default_value1
   KEY2=default_value2
   # Comments are OK
   PRIVATE_KEY=****
   ```

2. **Verify no extra spaces:**
   ```bash
   grep -n '=' .env.example | head
   ```

3. **Use `--env-file` instead:**
   ```bash
   vercel-deploy \
     --project my-app \
     --path . \
     --env-file .env.production
   ```

---

## Build-Specific Issues

### Next.js Issues

#### Build fails: "Cannot find module 'next'"

**Solutions:**
```bash
# Install Next.js
npm install next react react-dom

# Verify in package.json
npm pkg get dependencies
```

#### ".next folder not found"

**Solutions:**
```bash
# Build locally first
npm run build

# Check output directory
ls -la .next/

# Verify in next.config.js
cat next.config.js | grep -i output
```

---

### React Issues

#### Build fails: "PUBLIC_URL not set"

**Solutions:**
```bash
# Set environment variable
--env "REACT_APP_PUBLIC_URL=/"

# Or in package.json
npm pkg set scripts.build="PUBLIC_URL=/ react-scripts build"
```

---

### Express Issues

#### "Cannot find entry point"

**Solutions:**
```bash
# Check main field in package.json
cat package.json | jq '.main'

# Verify file exists
ls -la index.js  # or server.js, app.js, etc.

# Update if needed
npm pkg set main="server.js"
```

---

## Logging & Debugging

### View All Logs

```bash
tail -f ~/.openclaw/logs/vercel-deploy.log
```

### Check Git Status

```bash
git status
git log --oneline -5
git remote -v
```

### Verify Vercel Project

```bash
vercel projects list --token $VERCEL_TOKEN
vercel env ls --project my-app --token $VERCEL_TOKEN
```

### View Deployment History

```bash
vercel-deploy --deployments --project my-app
```

---

## Performance Issues

### Deployment Takes Too Long

**Reasons:**
- First deployment is slowest (cold start)
- Large node_modules
- Slow build process
- Network issues

**Optimizations:**
```bash
# 1. Install dependencies first locally
npm install

# 2. Add .vercelignore
echo "node_modules" > .vercelignore

# 3. Use build caching
# vercel.json with buildCache

# 4. Optimize dependencies
npm audit
npm dedupe
```

---

## Getting Help

### Debug Mode

Enable verbose logging:
```bash
# View validation details
bash script/validate.sh /path/to/project 1

# View deployment logs
vercel logs --project my-app --tail
```

### Check Logs

```bash
# OpenClaw logs
tail -f ~/.openclaw/logs/vercel-deploy.log

# Vercel logs
vercel logs --project my-app

# Git logs
git log --oneline -10
```

### Collect Debug Info

```bash
# System info
uname -a
node --version
npm --version

# Project info
cat package.json | jq '.name, .version, .scripts'

# Auth check
gh auth status
vercel whoami --token $VERCEL_TOKEN

# Environment
env | grep -E "(GITHUB|VERCEL)_TOKEN"
```

### Contact Support

- Vercel: https://vercel.com/support
- GitHub: https://support.github.com
- OpenClaw: Check documentation and community

---

## Common Patterns

### Safe Re-deployment

```bash
# 1. Check current status
vercel-deploy --status --project my-app

# 2. Dry run first
vercel-deploy \
  --project my-app \
  --path . \
  --dry-run

# 3. Deploy if all checks pass
vercel-deploy \
  --project my-app \
  --path .
```

### Testing Locally First

```bash
# 1. Validate project
bash script/validate.sh .

# 2. Build locally
npm run build

# 3. Test build output
npm start  # or similar

# 4. Then deploy
vercel-deploy --project my-app --path .
```

### Monitoring

```bash
# Set up monitoring script
while true; do
  vercel-deploy --status --project my-app
  sleep 300  # Check every 5 minutes
done
```

---

## Still Stuck?

1. **Check logs:** `tail -f ~/.openclaw/logs/vercel-deploy.log`
2. **Test manually:** Run individual script files
3. **Read docs:** Check [README.md](./README.md) and [SKILL.md](./SKILL.md)
4. **Review examples:** See [EXAMPLES.md](./EXAMPLES.md)
5. **Inspect project:** `bash script/validate.sh /path/to/project 1`
