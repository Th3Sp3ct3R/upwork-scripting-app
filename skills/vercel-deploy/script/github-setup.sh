#!/bin/bash

# GitHub setup script for vercel-deploy
# Creates/prepares GitHub repository

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/utils.sh"

PROJECT_NAME="${1:-}"
PROJECT_PATH="${2:-.}"
GITHUB_ORG="${3:-}"

create_github_repo() {
    local repo_name=$1
    local is_private=${2:-true}

    log_info "Creating GitHub repository: $repo_name"

    # Check if repo already exists
    if gh repo view "$repo_name" >/dev/null 2>&1; then
        log_info "Repository already exists: $repo_name"
        return 0
    fi

    # Create repository
    if gh repo create "$repo_name" \
        --private \
        --source=. \
        --remote=origin \
        --push \
        --description "Deployed via vercel-deploy"; then
        log_success "GitHub repository created: $repo_name"
        return 0
    else
        log_error "Failed to create GitHub repository"
        return 1
    fi
}

setup_github_repo() {
    log_info "Setting up GitHub repository for: $PROJECT_NAME"

    # Check authentication
    if ! check_auth; then
        log_error "Failed authentication check"
        return 2
    fi

    # Validate project directory
    if ! validate_project_dir "$PROJECT_PATH"; then
        return 1
    fi

    # Initialize git
    init_git_repo "$PROJECT_PATH"

    # Ensure initial commit exists
    ensure_initial_commit "$PROJECT_PATH"

    # Create GitHub repo if needed
    cd "$PROJECT_PATH"
    local origin
    origin=$(git config --get remote.origin.url 2>/dev/null || echo "")

    if [[ -z "$origin" ]]; then
        # No remote configured, create new repo
        local sanitized_name
        sanitized_name=$(sanitize_project_name "$PROJECT_NAME")

        if ! create_github_repo "$sanitized_name"; then
            return 1
        fi
    else
        log_info "Remote already configured: $origin"
    fi

    # Ensure we're on main branch
    if ! git rev-parse --verify main >/dev/null 2>&1; then
        log_info "Switching to/creating main branch..."
        git branch -M main
    fi

    # Push to remote
    log_info "Pushing code to GitHub..."
    if git push -u origin main --force; then
        log_success "Code pushed to GitHub"
    else
        log_warn "Failed to push to GitHub, but continuing..."
    fi

    # Get remote URL
    local repo_url
    repo_url=$(git config --get remote.origin.url)
    log_success "Repository URL: $repo_url"

    return 0
}

# Check GitHub CLI authentication
check_github_auth() {
    log_info "Checking GitHub authentication..."

    if ! check_github_cli; then
        log_error "GitHub CLI not installed"
        log_info "Install with: brew install gh"
        return 1
    fi

    if ! gh auth status >/dev/null 2>&1; then
        log_error "Not authenticated with GitHub"
        log_info "Run: gh auth login"
        return 1
    fi

    log_success "GitHub authentication verified"
    return 0
}

# Main execution
main() {
    if [[ -z "$PROJECT_NAME" ]]; then
        log_error "Project name is required"
        echo "Usage: $0 <project-name> [project-path] [github-org]"
        return 1
    fi

    log_info "Starting GitHub setup for: $PROJECT_NAME"

    if setup_github_repo; then
        log_success "GitHub setup completed"
        return 0
    else
        log_error "GitHub setup failed"
        return 1
    fi
}

main "$@"
