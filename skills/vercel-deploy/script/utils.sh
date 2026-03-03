#!/bin/bash

# vercel-deploy utility functions
# Shared helpers for all scripts

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging
LOG_FILE="${HOME}/.openclaw/logs/vercel-deploy.log"
mkdir -p "$(dirname "$LOG_FILE")"

log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[${timestamp}] [${level}] ${message}" >> "$LOG_FILE"
}

log_info() {
    echo -e "${BLUE}ℹ${NC} $@"
    log "INFO" "$@"
}

log_success() {
    echo -e "${GREEN}✓${NC} $@"
    log "SUCCESS" "$@"
}

log_warn() {
    echo -e "${YELLOW}⚠${NC} $@"
    log "WARN" "$@"
}

log_error() {
    echo -e "${RED}✗${NC} $@"
    log "ERROR" "$@"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Require command
require_command() {
    if ! command_exists "$1"; then
        log_error "Command not found: $1"
        return 1
    fi
}

# Check authentication tokens
check_auth() {
    local missing=0

    if [[ -z "${GITHUB_TOKEN:-}" ]]; then
        log_error "GITHUB_TOKEN not set"
        missing=1
    fi

    if [[ -z "${VERCEL_TOKEN:-}" ]]; then
        log_error "VERCEL_TOKEN not set"
        missing=1
    fi

    if [[ $missing -eq 1 ]]; then
        log_error "Missing required authentication tokens"
        echo "Set the following environment variables:"
        echo "  export GITHUB_TOKEN=\"your-github-token\""
        echo "  export VERCEL_TOKEN=\"your-vercel-token\""
        return 3
    fi

    return 0
}

# Validate project directory
validate_project_dir() {
    local project_path="$1"

    if [[ ! -d "$project_path" ]]; then
        log_error "Project directory not found: $project_path"
        return 1
    fi

    if [[ ! -f "$project_path/package.json" ]]; then
        log_error "package.json not found in: $project_path"
        return 1
    fi

    log_success "Project directory validated: $project_path"
    return 0
}

# Detect framework type
detect_framework() {
    local project_path="$1"
    local package_json="$project_path/package.json"

    if grep -q '"next"' "$package_json"; then
        echo "next"
        return 0
    elif grep -q '"react"' "$package_json"; then
        echo "react"
        return 0
    elif grep -q '"express"' "$package_json"; then
        echo "express"
        return 0
    else
        echo "node"
        return 0
    fi
}

# Check build script exists
has_build_script() {
    local project_path="$1"
    grep -q '"build"' "$project_path/package.json"
}

# Sanitize project name for GitHub
sanitize_project_name() {
    local name="$1"
    # Convert to lowercase, replace spaces and underscores with hyphens
    echo "$name" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g' | sed 's/^-\|-$//'
}

# Get repository owner from git config
get_git_owner() {
    git config --global user.name 2>/dev/null || echo "openclaw-user"
}

# Initialize git repository
init_git_repo() {
    local project_path="$1"

    cd "$project_path"

    if [[ ! -d .git ]]; then
        log_info "Initializing git repository..."
        git init
        git config user.name "OpenClaw Bot"
        git config user.email "bot@openclaw.local"
        log_success "Git repository initialized"
    else
        log_info "Git repository already exists"
    fi
}

# Create initial commit if needed
ensure_initial_commit() {
    local project_path="$1"

    cd "$project_path"

    if ! git rev-parse HEAD >/dev/null 2>&1; then
        log_info "Creating initial commit..."
        git add .
        git commit -m "Initial commit from vercel-deploy"
        log_success "Initial commit created"
    fi
}

# Parse environment variables from various sources
parse_env_vars() {
    local env_vars=()
    local env_file=""
    local env_example_file=""
    local project_path="${1:-.}"

    # Look for .env.example in project
    if [[ -f "$project_path/.env.example" ]]; then
        env_example_file="$project_path/.env.example"
    fi

    # Parse command-line arguments
    shift || true
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --env)
                shift
                env_vars+=("$1")
                ;;
            --env-file)
                shift
                env_file="$1"
                ;;
            *)
                ;;
        esac
        shift
    done

    # If env file specified, read from it
    if [[ -n "$env_file" && -f "$env_file" ]]; then
        while IFS= read -r line; do
            [[ "$line" =~ ^[^#]*= ]] && env_vars+=("$line")
        done < "$env_file"
    fi

    # If no env vars provided, try .env.example
    if [[ ${#env_vars[@]} -eq 0 && -n "$env_example_file" ]]; then
        log_warn "No environment variables provided, using .env.example as template"
        while IFS= read -r line; do
            [[ "$line" =~ ^[^#]*= ]] && env_vars+=("$line")
        done < "$env_example_file"
    fi

    # Output all collected env vars
    printf '%s\n' "${env_vars[@]}"
}

# Check if Vercel CLI is installed
check_vercel_cli() {
    if ! command_exists vercel; then
        log_warn "Vercel CLI not installed, installing..."
        npm install -g vercel || {
            log_error "Failed to install Vercel CLI"
            return 1
        }
        log_success "Vercel CLI installed"
    fi
}

# Check if GitHub CLI is installed
check_github_cli() {
    if ! command_exists gh; then
        log_warn "GitHub CLI not installed"
        return 1
    fi
}

# Get current branch
get_current_branch() {
    git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main"
}

# Wait for deployment
wait_for_deployment() {
    local project_name="$1"
    local timeout="${2:-120}" # 2 minutes default
    local elapsed=0
    local interval=5

    log_info "Waiting for deployment to complete (timeout: ${timeout}s)..."

    while [[ $elapsed -lt $timeout ]]; do
        if vercel status --token "$VERCEL_TOKEN" --project "$project_name" >/dev/null 2>&1; then
            log_success "Deployment completed"
            return 0
        fi
        sleep "$interval"
        elapsed=$((elapsed + interval))
        echo -n "."
    done

    log_warn "Deployment timeout after ${timeout}s"
    return 1
}

# Get Vercel deployment URL
get_deployment_url() {
    local project_name="$1"
    vercel status --token "$VERCEL_TOKEN" --project "$project_name" 2>/dev/null | grep "Url:" | awk '{print $2}' || echo "unknown"
}

# Cleanup on exit
cleanup() {
    local exit_code=$?
    if [[ $exit_code -ne 0 ]]; then
        log_error "Script failed with exit code: $exit_code"
    fi
    return $exit_code
}

trap cleanup EXIT

export LOG_FILE
export -f log log_info log_success log_warn log_error
export -f command_exists require_command check_auth
export -f validate_project_dir detect_framework has_build_script
export -f sanitize_project_name get_git_owner
export -f init_git_repo ensure_initial_commit
export -f parse_env_vars check_vercel_cli check_github_cli
export -f get_current_branch wait_for_deployment get_deployment_url
