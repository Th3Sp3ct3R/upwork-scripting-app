# vercel-deploy Skill - Complete Index

Comprehensive guide to all files and components in the vercel-deploy skill.

## Directory Structure

```
/Users/growthgod/openclaw/skills/vercel-deploy/
├── SKILL.md                    (Skill specification & API reference)
├── README.md                   (User guide & usage instructions)
├── SETUP.md                    (Installation & configuration)
├── EXAMPLES.md                 (Real-world deployment examples)
├── TROUBLESHOOTING.md          (Problems & solutions)
├── INDEX.md                    (This file)
├── package.json                (NPM configuration)
├── vercel-config.json          (Vercel template configuration)
├── script/
│   ├── deploy.sh               (Main deployment orchestrator)
│   ├── validate.sh             (Project validation)
│   ├── github-setup.sh         (GitHub integration)
│   ├── setup-env.sh            (Environment configuration)
│   └── utils.sh                (Shared utility functions)
└── tests/
    └── test-deploy.sh          (Unit & integration tests)
```

## File Guide

### 📋 Documentation Files

#### SKILL.md
**Purpose:** Skill specification and API reference  
**Content:**
- What the skill does
- Features list
- Command reference with all options
- Exit codes
- Environment variables
- GitHub integration details
- Advanced options
- Integration with OpenClaw

**When to read:** Need to understand skill capabilities or full API

---

#### README.md
**Purpose:** Complete user guide for deployment  
**Content:**
- Quick start guide
- Installation steps
- Usage examples
- Project structure expectations
- Framework detection
- GitHub integration workflow
- Deployment process steps
- Error handling
- Logging information
- Advanced configuration
- OpenClaw integration

**When to read:** Using the skill for the first time

---

#### SETUP.md
**Purpose:** Installation and configuration guide  
**Content:**
- System requirements checklist
- Step-by-step installation
- Token creation (GitHub & Vercel)
- Authentication setup
- Making tokens permanent
- Quick test procedures
- OpenClaw integration setup
- Troubleshooting common issues
- Next steps after setup

**When to read:** First time installing or setting up

---

#### EXAMPLES.md
**Purpose:** Real-world deployment examples  
**Content:**
- 10 complete, ready-to-use examples
- ResumeReach deployment
- Express backend deployment
- React frontend deployment
- .env file usage
- Monorepo deployments
- Team deployments
- Dry runs
- CI/CD integration
- Status checking
- Troubleshooting examples
- Quick reference for different frameworks

**When to read:** Need a concrete example for your use case

---

#### TROUBLESHOOTING.md
**Purpose:** Solutions for common problems  
**Content:**
- Authentication issues
- Project validation errors
- GitHub setup problems
- Vercel deployment failures
- Environment variable issues
- Build-specific problems
- Next.js issues
- React issues
- Express issues
- Logging & debugging
- Performance optimization
- Getting help

**When to read:** Something went wrong or you need help

---

### 🔧 Script Files

#### script/deploy.sh
**Purpose:** Main deployment orchestrator  
**Responsibility:**
- Parse command-line arguments
- Validate inputs
- Check authentication
- Execute full deployment pipeline
- Handle status/config commands
- Provide help information

**Usage:**
```bash
./script/deploy.sh --project my-app --path . --env KEY=VALUE
```

**Key options:**
- `--project` (required)
- `--path`
- `--env` / `--env-file`
- `--status`, `--config`, `--deployments`
- `--dry-run`, `--help`

---

#### script/validate.sh
**Purpose:** Project validation  
**Responsibility:**
- Check directory exists
- Verify package.json validity
- Detect framework type
- Check build script existence
- Validate dependencies
- Check for configuration files

**Usage:**
```bash
bash script/validate.sh /path/to/project [verbose]
```

**Output:**
- Validation report
- Prerequisites check
- File inventory
- Dependency list

---

#### script/github-setup.sh
**Purpose:** GitHub integration  
**Responsibility:**
- Initialize git repository
- Create GitHub repository
- Push code to GitHub
- Handle existing repositories
- Manage branches

**Usage:**
```bash
bash script/github-setup.sh project-name /path/to/project
```

**Requires:**
- GITHUB_TOKEN environment variable
- GitHub CLI (gh) installed and authenticated

---

#### script/setup-env.sh
**Purpose:** Environment variable configuration  
**Responsibility:**
- Set environment variables in Vercel
- Load from .env files
- Validate .env.example template
- List existing variables
- Handle special characters

**Usage:**
```bash
bash script/setup-env.sh project-name /path/to/project \
  --env KEY1=value1 \
  --env KEY2=value2
```

**Requires:**
- VERCEL_TOKEN environment variable
- Vercel CLI installed

---

#### script/utils.sh
**Purpose:** Shared utility functions  
**Responsibility:**
- Logging functions (info, success, warn, error)
- Command detection
- Authentication checking
- Project validation
- Framework detection
- Git operations
- Environment parsing

**Usage:**
```bash
source script/utils.sh

# Use functions
log_success "Deployment completed"
detect_framework "/path/to/project"
validate_project_dir "/path/to/project"
```

**Key functions:**
- `log_info`, `log_success`, `log_warn`, `log_error`
- `command_exists`, `check_auth`
- `validate_project_dir`
- `detect_framework`, `has_build_script`
- `init_git_repo`, `ensure_initial_commit`
- `parse_env_vars`
- `wait_for_deployment`, `get_deployment_url`

---

### 📦 Configuration Files

#### package.json
**Purpose:** NPM package configuration  
**Contains:**
- Package metadata
- Dependency list
- Script definitions
- Engine requirements

**Key fields:**
- `name`: "vercel-deploy-skill"
- `version`: "1.0.0"
- `scripts.test`: Runs test suite
- `dependencies.vercel`: Vercel CLI

---

#### vercel-config.json
**Purpose:** Vercel deployment template  
**Contains:**
- Build command configuration
- Environment variables template
- Output directory settings
- API routes configuration
- Cron jobs setup
- Header settings
- Regional deployment config

**Use cases:**
- Copy to project as `vercel.json` base
- Reference for advanced configuration
- Custom build command setup

---

### 🧪 Test Files

#### tests/test-deploy.sh
**Purpose:** Unit and integration testing  
**Covers:**
- Utility function testing
- Framework detection
- Project validation
- Environment parsing
- Script file verification
- Documentation completeness
- Log file creation

**Usage:**
```bash
# Run tests
npm test

# Or directly
bash tests/test-deploy.sh
```

**Output:**
- Test summary
- Pass/fail counts
- Detailed error messages

---

## Quick Reference Table

| Need | File | Section |
|------|------|---------|
| Get started | SETUP.md | All |
| Learn how to use | README.md | Quick Start + Usage |
| Need an example | EXAMPLES.md | All |
| Find API reference | SKILL.md | Command Reference |
| Something broke | TROUBLESHOOTING.md | Relevant section |
| Understand structure | This file (INDEX.md) | All |
| Run tests | tests/test-deploy.sh | All |

## Learning Path

### For First-Time Users
1. Start with [SETUP.md](./SETUP.md)
2. Read [README.md](./README.md) Quick Start
3. Try an [EXAMPLES.md](./EXAMPLES.md) example
4. Run your first deployment

### For Experienced Users
1. Skim [README.md](./README.md) for syntax
2. Jump to [EXAMPLES.md](./EXAMPLES.md) for your use case
3. Check [SKILL.md](./SKILL.md) for advanced options
4. Reference [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) if needed

### For Developers
1. Read [SKILL.md](./SKILL.md) for specifications
2. Study [script/utils.sh](./script/utils.sh) for patterns
3. Review test cases in [tests/test-deploy.sh](./tests/test-deploy.sh)
4. Check [script/deploy.sh](./script/deploy.sh) for architecture

## Core Concepts

### Deployment Pipeline
```
Validate → GitHub Setup → Environment Configuration → Deploy → Verify
```

### Framework Detection
- Looks for dependencies in package.json
- Supports: Next.js, React, Express, generic Node
- Auto-selects appropriate build settings

### Environment Variables
Can come from:
1. Command-line: `--env KEY=VALUE`
2. File: `--env-file .env.production`
3. Template: `.env.example`

### Authentication
Requires:
- `GITHUB_TOKEN`: For repo creation and pushing
- `VERCEL_TOKEN`: For Vercel project linking and deployment

## File Sizes

```
SKILL.md                ~6.4 KB   (Specification)
README.md               ~9.5 KB   (User guide)
SETUP.md                ~6.1 KB   (Installation)
EXAMPLES.md             ~8.7 KB   (Examples)
TROUBLESHOOTING.md     ~12.4 KB   (Troubleshooting)
deploy.sh              ~9.5 KB   (Main script)
validate.sh            ~6.2 KB   (Validation)
github-setup.sh        ~3.4 KB   (GitHub)
setup-env.sh           ~5.4 KB   (Environment)
utils.sh               ~7.1 KB   (Utilities)
test-deploy.sh         ~8.3 KB   (Tests)
package.json           ~0.9 KB   (NPM config)
vercel-config.json     ~1.0 KB   (Vercel template)

TOTAL: ~94.4 KB
```

## Dependencies

### System Requirements
- Node.js v18+
- npm v9+
- git v2.30+
- bash v4+

### Required Tools
- Vercel CLI (`npm install -g vercel`)
- GitHub CLI (`brew install gh`)

### Required Credentials
- GitHub Personal Access Token (repo, user scopes)
- Vercel API Token (full access)

## Common Commands Reference

```bash
# Deploy with env vars
vercel-deploy --project my-app --path . --env KEY=VALUE

# Deploy with .env file
vercel-deploy --project my-app --path . --env-file .env.prod

# Check status
vercel-deploy --status --project my-app

# Dry run
vercel-deploy --project my-app --path . --dry-run

# Validate project
bash script/validate.sh /path/to/project

# Run tests
npm test -C ~/openclaw/skills/vercel-deploy

# View logs
tail -f ~/.openclaw/logs/vercel-deploy.log
```

## Support & Updates

### Getting Help
1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Review [EXAMPLES.md](./EXAMPLES.md) for similar use case
3. Check logs: `~/.openclaw/logs/vercel-deploy.log`
4. Run validation: `bash script/validate.sh /path/to/project 1`

### Reporting Issues
When reporting issues, include:
- Error message (full)
- Command used
- Project structure
- Relevant logs
- System info (node --version, npm --version, etc.)

### Version History
- **1.0.0** (Current) - Production ready
  - Full deployment pipeline
  - GitHub integration
  - Environment management
  - Error handling
  - Comprehensive documentation
  - Test suite

---

**Total Documentation:** ~94 KB of scripts, tests, and guides  
**Status:** Production Ready ✓  
**Last Updated:** 2024-02-13
