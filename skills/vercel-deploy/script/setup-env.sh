#!/bin/bash

# Environment setup script for vercel-deploy
# Configures environment variables in Vercel

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/utils.sh"

PROJECT_NAME="${1:-}"
PROJECT_PATH="${2:-.}"
shift 2 || true

setup_environment_variables() {
    local project_name=$1
    local project_path=$2
    shift 2
    local env_vars=("$@")

    log_info "Setting up environment variables for: $project_name"

    if [[ ${#env_vars[@]} -eq 0 ]]; then
        log_warn "No environment variables provided"
        return 0
    fi

    # Verify Vercel CLI
    if ! command_exists vercel; then
        log_error "Vercel CLI not found"
        return 1
    fi

    # Set each variable
    local failed=0
    for env_var in "${env_vars[@]}"; do
        if [[ -z "$env_var" ]]; then
            continue
        fi

        # Parse KEY=VALUE
        local key="${env_var%=*}"
        local value="${env_var#*=}"

        if [[ -z "$key" || -z "$value" ]]; then
            log_warn "Invalid environment variable format: $env_var (expected KEY=VALUE)"
            continue
        fi

        log_info "Setting: $key (masked for security)"

        if vercel env add "$key" --value "$value" \
            --token "$VERCEL_TOKEN" \
            --project "$project_name" \
            --yes 2>/dev/null; then
            log_success "Environment variable set: $key"
        else
            log_warn "Failed to set environment variable: $key"
            failed=$((failed + 1))
        fi
    done

    if [[ $failed -gt 0 ]]; then
        log_warn "Failed to set $failed environment variable(s)"
        return 1
    fi

    return 0
}

list_environment_variables() {
    local project_name=$1

    log_info "Environment variables for: $project_name"

    if vercel env ls --token "$VERCEL_TOKEN" --project "$project_name" 2>/dev/null; then
        return 0
    else
        log_warn "Failed to list environment variables"
        return 1
    fi
}

validate_env_vars() {
    local project_path=$1
    local env_example="$project_path/.env.example"

    if [[ ! -f "$env_example" ]]; then
        log_warn "No .env.example found"
        return 0
    fi

    log_info "Validating environment variables against .env.example"

    local required_vars=()
    while IFS= read -r line; do
        # Skip comments and empty lines
        [[ "$line" =~ ^# ]] && continue
        [[ -z "$line" ]] && continue

        # Extract variable name
        local var_name="${line%=*}"
        required_vars+=("$var_name")
    done < "$env_example"

    log_info "Required environment variables: ${#required_vars[@]}"
    for var in "${required_vars[@]}"; do
        echo "  - $var"
    done

    return 0
}

# Extract env vars from .env file
extract_env_from_file() {
    local env_file=$1

    if [[ ! -f "$env_file" ]]; then
        log_error "Environment file not found: $env_file"
        return 1
    fi

    log_info "Extracting environment variables from: $env_file"

    local env_vars=()
    while IFS= read -r line; do
        # Skip comments and empty lines
        [[ "$line" =~ ^[[:space:]]*# ]] && continue
        [[ -z "$line" ]] && continue

        # Trim whitespace
        line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"

        # Extract KEY=VALUE
        if [[ "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]]; then
            env_vars+=("$line")
        fi
    done < "$env_file"

    printf '%s\n' "${env_vars[@]}"
}

# Main execution
main() {
    if [[ -z "$PROJECT_NAME" ]]; then
        log_error "Project name is required"
        echo "Usage: $0 <project-name> <project-path> [--env KEY=VALUE ...] [--env-file FILE]"
        return 1
    fi

    # Check authentication
    if ! check_auth; then
        return 2
    fi

    # Validate project
    if ! validate_project_dir "$PROJECT_PATH"; then
        return 1
    fi

    # Collect environment variables
    local env_vars=()
    local env_file=""

    while [[ $# -gt 0 ]]; do
        case "$1" in
            --env)
                shift
                env_vars+=("$1")
                ;;
            --env-file)
                shift
                env_file="$1"
                # Extract variables from file
                while IFS= read -r line; do
                    env_vars+=("$line")
                done < <(extract_env_from_file "$env_file")
                ;;
            --list)
                list_environment_variables "$PROJECT_NAME"
                return 0
                ;;
            --validate)
                validate_env_vars "$PROJECT_PATH"
                return 0
                ;;
            *)
                log_warn "Unknown option: $1"
                ;;
        esac
        shift || true
    done

    # If no env vars provided, try .env.example
    if [[ ${#env_vars[@]} -eq 0 ]]; then
        log_info "No environment variables provided, checking for .env.example..."
        if [[ -f "$PROJECT_PATH/.env.example" ]]; then
            while IFS= read -r line; do
                [[ "$line" =~ ^[^#]*= ]] && env_vars+=("$line")
            done < "$PROJECT_PATH/.env.example"
        fi
    fi

    # Setup variables
    if setup_environment_variables "$PROJECT_NAME" "$PROJECT_PATH" "${env_vars[@]}"; then
        log_success "Environment variables configured"
        return 0
    else
        log_error "Environment setup failed"
        return 1
    fi
}

main "$@"
