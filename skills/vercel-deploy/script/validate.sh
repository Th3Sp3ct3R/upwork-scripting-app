#!/bin/bash

# Validation script for vercel-deploy
# Checks project structure and prerequisites

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/utils.sh"

# Default values
PROJECT_PATH="${1:-.}"
VERBOSE="${2:-0}"

validate_project() {
    log_info "Validating project at: $PROJECT_PATH"

    # Check directory exists
    if [[ ! -d "$PROJECT_PATH" ]]; then
        log_error "Project directory not found: $PROJECT_PATH"
        return 1
    fi

    # Check package.json exists
    if [[ ! -f "$PROJECT_PATH/package.json" ]]; then
        log_error "package.json not found in: $PROJECT_PATH"
        return 1
    fi

    log_success "package.json found"

    # Check if it's a valid JSON
    if ! jq empty "$PROJECT_PATH/package.json" 2>/dev/null; then
        log_error "package.json is not valid JSON"
        return 1
    fi

    log_success "package.json is valid JSON"

    # Get project name from package.json
    local project_name
    project_name=$(jq -r '.name // "unnamed"' "$PROJECT_PATH/package.json")
    log_info "Project name: $project_name"

    # Detect framework
    local framework
    framework=$(detect_framework "$PROJECT_PATH")
    log_info "Framework detected: $framework"

    # Check for build script
    if has_build_script "$PROJECT_PATH"; then
        log_success "Build script found in package.json"
    else
        log_warn "No build script found in package.json"
        log_info "Adding default build script..."
        # This will be handled by setup if needed
    fi

    # Check for important files/directories
    local checks=(
        "node_modules:optional"
        ".git:optional"
        ".gitignore:optional"
    )

    if [[ "$framework" == "next" ]]; then
        checks+=("pages:optional" "app:optional")
    fi

    for check in "${checks[@]}"; do
        local item="${check%:*}"
        local required="${check#*:}"
        local path="$PROJECT_PATH/$item"

        if [[ -e "$path" ]]; then
            log_success "$item exists"
        else
            if [[ "$required" == "required" ]]; then
                log_error "$item not found (required)"
                return 1
            else
                log_warn "$item not found (optional)"
            fi
        fi
    done

    # Check for dependencies
    log_info "Checking dependencies..."
    local missing_deps=0

    local required_deps=()
    if [[ "$framework" == "next" ]]; then
        required_deps=("next" "react" "react-dom")
    fi

    for dep in "${required_deps[@]}"; do
        if ! jq -e ".dependencies[\"$dep\"] or .devDependencies[\"$dep\"]" "$PROJECT_PATH/package.json" >/dev/null 2>&1; then
            log_warn "Dependency not found: $dep"
            missing_deps=$((missing_deps + 1))
        else
            log_success "Dependency found: $dep"
        fi
    done

    if [[ $missing_deps -gt 0 ]]; then
        log_warn "Missing $missing_deps dependencies"
    fi

    # Check for Vercel configuration
    if [[ -f "$PROJECT_PATH/vercel.json" ]]; then
        log_success "vercel.json configuration found"
        if [[ "$VERBOSE" == "1" ]]; then
            log_info "vercel.json content:"
            cat "$PROJECT_PATH/vercel.json" | jq '.' | sed 's/^/  /'
        fi
    else
        log_info "No vercel.json found (will use defaults)"
    fi

    # Check for environment configuration
    if [[ -f "$PROJECT_PATH/.env.example" ]]; then
        log_success ".env.example found"
        local env_count
        env_count=$(grep -c '=' "$PROJECT_PATH/.env.example" || echo 0)
        log_info "Environment variables template: $env_count variables"
    else
        log_warn ".env.example not found"
    fi

    # Check for README
    if [[ -f "$PROJECT_PATH/README.md" ]]; then
        log_success "README.md found"
    else
        log_warn "README.md not found"
    fi

    # Check for .gitignore
    if [[ -f "$PROJECT_PATH/.gitignore" ]]; then
        log_success ".gitignore found"
    else
        log_warn ".gitignore not found"
    fi

    log_success "Project validation completed successfully"
    return 0
}

# Output validation report
report_validation() {
    echo ""
    echo "╔════════════════════════════════════════╗"
    echo "║     Project Validation Report          ║"
    echo "╚════════════════════════════════════════╝"
    echo ""

    local project_name
    project_name=$(jq -r '.name // "unnamed"' "$PROJECT_PATH/package.json")
    local framework
    framework=$(detect_framework "$PROJECT_PATH")
    local has_build
    has_build_script "$PROJECT_PATH" && has_build="✓" || has_build="✗"

    echo "Project Name:        $project_name"
    echo "Framework:           $framework"
    echo "Build Script:        $has_build"
    echo "Path:                $PROJECT_PATH"
    echo ""

    echo "Prerequisites:"
    command_exists node && echo "  ✓ Node.js" || echo "  ✗ Node.js"
    command_exists npm && echo "  ✓ npm" || echo "  ✗ npm"
    command_exists git && echo "  ✓ git" || echo "  ✗ git"
    command_exists vercel && echo "  ✓ Vercel CLI" || echo "  ✗ Vercel CLI"
    [[ -n "${GITHUB_TOKEN:-}" ]] && echo "  ✓ GITHUB_TOKEN" || echo "  ✗ GITHUB_TOKEN"
    [[ -n "${VERCEL_TOKEN:-}" ]] && echo "  ✓ VERCEL_TOKEN" || echo "  ✗ VERCEL_TOKEN"

    echo ""
    echo "Files:"
    [[ -f "$PROJECT_PATH/package.json" ]] && echo "  ✓ package.json" || echo "  ✗ package.json"
    [[ -f "$PROJECT_PATH/.env.example" ]] && echo "  ✓ .env.example" || echo "  ✗ .env.example"
    [[ -f "$PROJECT_PATH/vercel.json" ]] && echo "  ✓ vercel.json" || echo "  ✗ vercel.json"
    [[ -f "$PROJECT_PATH/.gitignore" ]] && echo "  ✓ .gitignore" || echo "  ✗ .gitignore"
    [[ -f "$PROJECT_PATH/README.md" ]] && echo "  ✓ README.md" || echo "  ✗ README.md"
    [[ -d "$PROJECT_PATH/.git" ]] && echo "  ✓ .git directory" || echo "  ✗ .git directory"

    echo ""
}

main() {
    log_info "Starting project validation..."

    if validate_project; then
        report_validation
        log_success "✓ Project is ready for deployment"
        return 0
    else
        report_validation
        log_error "✗ Project validation failed"
        return 1
    fi
}

main "$@"
