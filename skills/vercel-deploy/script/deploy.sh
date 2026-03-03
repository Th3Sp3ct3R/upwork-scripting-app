#!/bin/bash

# Main deployment script for vercel-deploy
# Orchestrates the entire deployment pipeline

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/utils.sh"

# Default values
PROJECT_NAME=""
PROJECT_PATH="."
CUSTOM_DOMAIN=""
TEAM=""
BUILD_CMD=""
DRY_RUN=0
SHOW_STATUS=0
SHOW_CONFIG=0
SHOW_DEPLOYMENTS=0
SHOW_LOGS=0
ROLLBACK=""
SKIP_GITHUB=0
SKIP_VALIDATION=0

# Declare arrays for options that repeat
declare -a ENV_VARS=()
ENV_FILE=""

# Parse command-line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --project)
                shift
                PROJECT_NAME="$1"
                ;;
            --path)
                shift
                PROJECT_PATH="$1"
                ;;
            --env)
                shift
                ENV_VARS+=("$1")
                ;;
            --env-file)
                shift
                ENV_FILE="$1"
                ;;
            --domain)
                shift
                CUSTOM_DOMAIN="$1"
                ;;
            --team)
                shift
                TEAM="$1"
                ;;
            --build-cmd)
                shift
                BUILD_CMD="$1"
                ;;
            --dry-run)
                DRY_RUN=1
                ;;
            --status)
                SHOW_STATUS=1
                ;;
            --config)
                SHOW_CONFIG=1
                ;;
            --deployments)
                SHOW_DEPLOYMENTS=1
                ;;
            --logs)
                SHOW_LOGS=1
                ;;
            --rollback)
                shift
                ROLLBACK="$1"
                ;;
            --skip-github)
                SKIP_GITHUB=1
                ;;
            --skip-validation)
                SKIP_VALIDATION=1
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                log_warn "Unknown option: $1"
                ;;
        esac
        shift || true
    done
}

# Show help
show_help() {
    cat << 'EOF'
vercel-deploy - Deploy Next.js and Node.js projects to Vercel

USAGE:
  vercel-deploy [OPTIONS]

OPTIONS:
  --project <name>          Project name (required)
  --path <path>             Project directory (default: current directory)
  --env <KEY=VALUE>         Environment variable (repeatable)
  --env-file <file>         Load environment variables from file
  --domain <domain>         Custom domain
  --team <team>             Vercel team
  --build-cmd <cmd>         Custom build command
  --dry-run                 Preview without deploying
  --skip-github             Skip GitHub setup
  --skip-validation         Skip validation
  --status                  Show deployment status
  --config                  Show configuration
  --deployments             List deployments
  --logs                    Show deployment logs
  --rollback <id>           Rollback to deployment
  --help                    Show this help

EXAMPLES:
  # Simple deployment
  vercel-deploy --project my-app --path ./my-app

  # With environment variables
  vercel-deploy \
    --project my-app \
    --path ./my-app \
    --env OPENAI_API_KEY=sk-... \
    --env DATABASE_URL=postgresql://...

  # With .env file
  vercel-deploy \
    --project my-app \
    --path ./my-app \
    --env-file .env.production

  # Check status
  vercel-deploy --status --project my-app

  # Dry run
  vercel-deploy --dry-run --project my-app --path ./my-app

ENVIRONMENT:
  GITHUB_TOKEN              GitHub personal access token
  VERCEL_TOKEN              Vercel API token

EOF
}

# Validate inputs
validate_inputs() {
    if [[ -z "$PROJECT_NAME" ]]; then
        log_error "Project name is required (--project)"
        return 1
    fi

    # Normalize path
    PROJECT_PATH="$(cd "$PROJECT_PATH" && pwd)"

    if [[ ! -d "$PROJECT_PATH" ]]; then
        log_error "Project directory not found: $PROJECT_PATH"
        return 1
    fi

    log_success "Inputs validated"
    return 0
}

# Show status
show_deployment_status() {
    log_info "Checking deployment status for: $PROJECT_NAME"

    if ! command_exists vercel; then
        log_error "Vercel CLI not installed"
        return 1
    fi

    if vercel status --token "$VERCEL_TOKEN" --project "$PROJECT_NAME" 2>/dev/null; then
        return 0
    else
        log_error "Failed to fetch deployment status"
        return 1
    fi
}

# Show configuration
show_deployment_config() {
    log_info "Configuration for: $PROJECT_NAME"

    if ! command_exists vercel; then
        log_error "Vercel CLI not installed"
        return 1
    fi

    echo ""
    echo "Project: $PROJECT_NAME"
    echo "Path: $PROJECT_PATH"
    [[ -n "$CUSTOM_DOMAIN" ]] && echo "Domain: $CUSTOM_DOMAIN"
    [[ -n "$TEAM" ]] && echo "Team: $TEAM"
    [[ -n "$BUILD_CMD" ]] && echo "Build Command: $BUILD_CMD"
    echo ""

    if [[ -f "$PROJECT_PATH/vercel.json" ]]; then
        echo "Vercel Config:"
        jq '.' "$PROJECT_PATH/vercel.json" | sed 's/^/  /'
    fi

    return 0
}

# Deploy to Vercel
deploy_to_vercel() {
    log_info "Starting deployment to Vercel..."

    if ! check_vercel_cli; then
        log_error "Vercel CLI required but not available"
        return 1
    fi

    # Set up Vercel project
    cd "$PROJECT_PATH"

    log_info "Linking to Vercel project: $PROJECT_NAME"

    local vercel_args=("--confirm" "--token" "$VERCEL_TOKEN")

    if [[ -n "$TEAM" ]]; then
        vercel_args+=("--scope" "$TEAM")
    fi

    # Link project
    if ! vercel link --project "$PROJECT_NAME" "${vercel_args[@]}" 2>/dev/null; then
        log_warn "Project linking failed or already linked, continuing..."
    fi

    # Set environment variables
    if [[ ${#ENV_VARS[@]} -gt 0 ]] || [[ -n "$ENV_FILE" ]]; then
        log_info "Setting environment variables..."

        local all_env_vars=("${ENV_VARS[@]}")

        if [[ -n "$ENV_FILE" && -f "$ENV_FILE" ]]; then
            while IFS= read -r line; do
                [[ "$line" =~ ^[^#]*= ]] && all_env_vars+=("$line")
            done < "$ENV_FILE"
        fi

        for env_var in "${all_env_vars[@]}"; do
            local key="${env_var%=*}"
            local value="${env_var#*=}"
            log_info "Setting environment variable: $key"
            vercel env add "$key" --value "$value" --token "$VERCEL_TOKEN" 2>/dev/null || true
        done
    fi

    # Deploy
    log_info "Deploying to production..."

    local deploy_args=("--prod" "--token" "$VERCEL_TOKEN")

    if [[ -n "$BUILD_CMD" ]]; then
        deploy_args+=("--build-env" "BUILD_CMD=$BUILD_CMD")
    fi

    if vercel deploy "${deploy_args[@]}"; then
        log_success "Deployment completed"

        # Get URL
        local url
        url=$(get_deployment_url "$PROJECT_NAME")
        log_success "Project URL: $url"

        return 0
    else
        log_error "Deployment failed"
        return 1
    fi
}

# Execute deployment pipeline
execute_deployment() {
    log_info "╔════════════════════════════════════════╗"
    log_info "║  Starting Vercel Deployment Pipeline   ║"
    log_info "╚════════════════════════════════════════╝"
    echo ""

    # Step 1: Validate project
    if [[ $SKIP_VALIDATION -eq 0 ]]; then
        log_info "Step 1/5: Validating project..."
        if ! bash "$SCRIPT_DIR/validate.sh" "$PROJECT_PATH" 0; then
            log_error "Validation failed"
            return 1
        fi
        echo ""
    else
        log_warn "Skipping validation"
    fi

    # Step 2: GitHub setup
    if [[ $SKIP_GITHUB -eq 0 ]]; then
        log_info "Step 2/5: Setting up GitHub..."
        if ! bash "$SCRIPT_DIR/github-setup.sh" "$PROJECT_NAME" "$PROJECT_PATH"; then
            log_warn "GitHub setup failed, but continuing..."
        fi
        echo ""
    else
        log_warn "Skipping GitHub setup"
    fi

    # Step 3: Dry run check
    if [[ $DRY_RUN -eq 1 ]]; then
        log_info "Step 3/5: Dry run (not deploying)"
        echo ""
        log_success "✓ Deployment preview complete (use without --dry-run to deploy)"
        return 0
    fi

    # Step 4: Deploy
    log_info "Step 4/5: Deploying to Vercel..."
    if ! deploy_to_vercel; then
        log_error "Deployment failed"
        return 1
    fi
    echo ""

    # Step 5: Verify
    log_info "Step 5/5: Verifying deployment..."
    sleep 3
    if show_deployment_status; then
        log_success "✓ Deployment verified"
    else
        log_warn "Could not verify deployment status"
    fi

    echo ""
    log_info "╔════════════════════════════════════════╗"
    log_info "║    Deployment Completed Successfully!  ║"
    log_info "╚════════════════════════════════════════╝"

    return 0
}

# Main execution
main() {
    parse_args "$@"

    # Handle status/config/info commands
    if [[ $SHOW_STATUS -eq 1 ]]; then
        if [[ -z "$PROJECT_NAME" ]]; then
            log_error "Project name required for --status"
            return 1
        fi
        show_deployment_status
        return $?
    fi

    if [[ $SHOW_CONFIG -eq 1 ]]; then
        if [[ -z "$PROJECT_NAME" ]]; then
            log_error "Project name required for --config"
            return 1
        fi
        show_deployment_config
        return $?
    fi

    # Validate inputs
    if ! validate_inputs; then
        return 1
    fi

    # Check authentication
    if ! check_auth; then
        return 2
    fi

    # Execute deployment
    execute_deployment
}

# Run main function
main "$@"
