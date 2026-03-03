# vercel-deploy Setup Guide

Complete setup instructions for the vercel-deploy skill.

## Prerequisites

### System Requirements

- **OS:** macOS, Linux, or Windows with WSL
- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher
- **git:** v2.30.0 or higher
- **bash:** v4.0 or higher

### Check Prerequisites

```bash
# Check Node.js
node --version  # Should be v18+

# Check npm
npm --version   # Should be v9+

# Check git
git --version   # Should be v2.30+

# Check bash
bash --version  # Should be v4+
```

## Installation Steps

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

Verify installation:
```bash
vercel --version
```

### 2. Install GitHub CLI (Recommended)

```bash
# macOS
brew install gh

# Ubuntu/Debian
sudo apt-get install gh

# Arch
sudo pacman -S github-cli

# Windows
choco install gh
```

Verify installation:
```bash
gh --version
```

### 3. Create GitHub Personal Access Token

1. Visit: https://github.com/settings/tokens/new
2. **Token name:** `vercel-deploy`
3. **Expiration:** 90 days (or longer)
4. **Scopes:**
   - ✓ `repo` (Full control of private repositories)
   - ✓ `user` (Read user profile data)
5. Click "Generate token"
6. **Copy token** (you won't see it again!)

Set environment variable:
```bash
export GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxx"
```

### 4. Create Vercel API Token

1. Visit: https://vercel.com/account/tokens
2. **Token name:** `openclaw-deploy`
3. **Scope:** Full Access (recommended) or Account
4. Click "Create"
5. **Copy token**

Set environment variable:
```bash
export VERCEL_TOKEN="xxxxxxxxxxxxxxxxxxxx"
```

### 5. Authenticate with GitHub CLI

```bash
gh auth login
```

Follow prompts:
- Select: **GitHub.com**
- Select: **HTTPS**
- Select: **Paste an authentication token**
- Paste the GitHub token you created above
- Select: **git credentials** (recommended)

Verify:
```bash
gh auth status
```

### 6. Make Scripts Executable

```bash
chmod +x ~/openclaw/skills/vercel-deploy/script/*.sh
chmod +x ~/openclaw/skills/vercel-deploy/tests/*.sh
```

## Permanent Setup

To make tokens persistent across sessions, add to your shell profile:

### Bash/Zsh Setup

Edit `~/.bashrc` or `~/.zshrc`:

```bash
# Vercel Deploy Tokens
export GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxx"
export VERCEL_TOKEN="xxxxxxxxxxxxxxxxxxxx"

# Optional: Add skill to PATH
export PATH="$PATH:$HOME/openclaw/skills/vercel-deploy/script"
```

Then reload:
```bash
source ~/.bashrc  # or ~/.zshrc
```

## Quick Test

Test your setup:

```bash
# Test 1: Verify tokens are set
echo "GitHub Token: ${GITHUB_TOKEN:0:10}..."
echo "Vercel Token: ${VERCEL_TOKEN:0:10}..."

# Test 2: Test Vercel CLI
vercel whoami --token $VERCEL_TOKEN

# Test 3: Test GitHub CLI
gh auth status

# Test 4: Run unit tests
npm test -C ~/openclaw/skills/vercel-deploy
```

## Create Your First Alias

For easy command access:

```bash
# Add to ~/.bashrc or ~/.zshrc
alias vercel-deploy="$HOME/openclaw/skills/vercel-deploy/script/deploy.sh"

# Reload shell
source ~/.bashrc  # or ~/.zshrc

# Test
vercel-deploy --help
```

Or create a symlink:

```bash
ln -sf ~/openclaw/skills/vercel-deploy/script/deploy.sh /usr/local/bin/vercel-deploy
chmod +x /usr/local/bin/vercel-deploy

# Test
vercel-deploy --help
```

## Integration with OpenClaw

### Option 1: Source Directly

In OpenClaw scripts:

```bash
source ~/openclaw/skills/vercel-deploy/script/utils.sh

# Use utility functions
validate_project_dir "/path/to/project"
detect_framework "/path/to/project"
```

### Option 2: Use Command

In OpenClaw workflows:

```bash
~/openclaw/skills/vercel-deploy/script/deploy.sh \
  --project my-app \
  --path /path/to/project
```

## Verify Installation

Run the verification script:

```bash
# Verbose validation
bash ~/openclaw/skills/vercel-deploy/script/validate.sh . 1
```

Expected output:
```
╔════════════════════════════════════════╗
║     Project Validation Report          ║
╚════════════════════════════════════════╝

Project Name:        my-project
Framework:           next
Build Script:        ✓
Path:                /path/to/project

Prerequisites:
  ✓ Node.js
  ✓ npm
  ✓ git
  ✓ Vercel CLI
  ✓ GITHUB_TOKEN
  ✓ VERCEL_TOKEN
```

## Troubleshooting Setup

### "Command not found: gh"

```bash
# Install GitHub CLI
brew install gh

# Or verify it's in PATH
which gh
```

### "GITHUB_TOKEN not set"

```bash
# Check if set
echo $GITHUB_TOKEN

# If empty, set it
export GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxx"

# Make permanent - add to ~/.bashrc or ~/.zshrc
```

### "Permission denied"

```bash
# Make scripts executable
chmod +x ~/openclaw/skills/vercel-deploy/script/*.sh
chmod +x ~/openclaw/skills/vercel-deploy/tests/*.sh
```

### "Can't find npm"

```bash
# Check Node.js installation
node --version

# Reinstall Node.js if needed
# macOS: brew install node
# Ubuntu: sudo apt-get install nodejs npm
```

## Next Steps

1. **Read the docs:**
   - [README.md](./README.md) — User guide
   - [SKILL.md](./SKILL.md) — API reference
   - [EXAMPLES.md](./EXAMPLES.md) — Real-world examples

2. **Try your first deployment:**
   ```bash
   vercel-deploy \
     --project test-app \
     --path /path/to/your/project
   ```

3. **Check the logs:**
   ```bash
   tail -f ~/.openclaw/logs/vercel-deploy.log
   ```

4. **Run tests:**
   ```bash
   npm test -C ~/openclaw/skills/vercel-deploy
   ```

## Support

- **Documentation:** See [README.md](./README.md) and [SKILL.md](./SKILL.md)
- **Examples:** See [EXAMPLES.md](./EXAMPLES.md)
- **Troubleshooting:** See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **Logs:** Check `~/.openclaw/logs/vercel-deploy.log`

## Uninstall

To remove the skill:

```bash
# Remove skill directory
rm -rf ~/openclaw/skills/vercel-deploy

# Remove alias (if created)
# Edit ~/.bashrc or ~/.zshrc and remove the alias

# Remove symlink (if created)
rm /usr/local/bin/vercel-deploy
```

## Success!

You're now ready to deploy Next.js and Node.js projects to Vercel with a single command!

```bash
vercel-deploy \
  --project my-app \
  --path . \
  --env OPENAI_API_KEY=sk-...
```

Happy deploying! 🚀
