#!/bin/bash

# Test suite for vercel-deploy
# Run with: npm test or bash tests/test-deploy.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SCRIPT_DIR/script/utils.sh"

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test functions
test_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
}

test_case() {
    local name="$1"
    TESTS_RUN=$((TESTS_RUN + 1))
    echo -e "${YELLOW}Test $TESTS_RUN: $name${NC}"
}

assert_equal() {
    local expected="$1"
    local actual="$2"
    local message="${3:-Values should be equal}"

    if [[ "$expected" == "$actual" ]]; then
        echo -e "${GREEN}  ✓ $message${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}  ✗ $message${NC}"
        echo "    Expected: $expected"
        echo "    Actual: $actual"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

assert_true() {
    local condition="$1"
    local message="${2:-Condition should be true}"

    if eval "$condition"; then
        echo -e "${GREEN}  ✓ $message${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}  ✗ $message${NC}"
        echo "    Condition: $condition"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

assert_file_exists() {
    local file="$1"
    local message="${2:-File should exist: $file}"

    if [[ -f "$file" ]]; then
        echo -e "${GREEN}  ✓ $message${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}  ✗ $message${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Test 1: Utility functions
test_header "Utility Functions"

test_case "command_exists should detect installed commands"
assert_true "command_exists bash" "bash is installed"

test_case "command_exists should handle missing commands"
assert_true "! command_exists nonexistent_command_xyz" "nonexistent command not found"

test_case "sanitize_project_name should convert to lowercase"
local result=$(sanitize_project_name "MyProject")
assert_equal "myproject" "$result" "Project name sanitized to lowercase"

test_case "sanitize_project_name should replace spaces with hyphens"
local result=$(sanitize_project_name "My Project Name")
assert_equal "my-project-name" "$result" "Spaces replaced with hyphens"

# Test 2: Framework detection
test_header "Framework Detection"

# Create test project directories
TEST_TMPDIR=$(mktemp -d)
trap "rm -rf $TEST_TMPDIR" EXIT

test_case "detect_framework should identify Next.js"
mkdir -p "$TEST_TMPDIR/nextjs"
echo '{"name": "test", "dependencies": {"next": "^14.0.0"}}' > "$TEST_TMPDIR/nextjs/package.json"
local framework=$(detect_framework "$TEST_TMPDIR/nextjs")
assert_equal "next" "$framework" "Next.js detected"

test_case "detect_framework should identify React"
mkdir -p "$TEST_TMPDIR/react"
echo '{"name": "test", "dependencies": {"react": "^18.0.0"}}' > "$TEST_TMPDIR/react/package.json"
local framework=$(detect_framework "$TEST_TMPDIR/react")
assert_equal "react" "$framework" "React detected"

test_case "detect_framework should identify Express"
mkdir -p "$TEST_TMPDIR/express"
echo '{"name": "test", "dependencies": {"express": "^4.0.0"}}' > "$TEST_TMPDIR/express/package.json"
local framework=$(detect_framework "$TEST_TMPDIR/express")
assert_equal "express" "$framework" "Express detected"

test_case "detect_framework should fallback to Node"
mkdir -p "$TEST_TMPDIR/generic"
echo '{"name": "test", "dependencies": {}}' > "$TEST_TMPDIR/generic/package.json"
local framework=$(detect_framework "$TEST_TMPDIR/generic")
assert_equal "node" "$framework" "Fallback to Node"

# Test 3: Project validation
test_header "Project Validation"

test_case "validate_project_dir should check directory exists"
assert_true "! validate_project_dir /nonexistent/path" "Rejects nonexistent directory"

test_case "validate_project_dir should check package.json exists"
mkdir -p "$TEST_TMPDIR/no-package"
assert_true "! validate_project_dir $TEST_TMPDIR/no-package" "Rejects missing package.json"

test_case "validate_project_dir should accept valid project"
mkdir -p "$TEST_TMPDIR/valid"
echo '{"name": "test"}' > "$TEST_TMPDIR/valid/package.json"
assert_true "validate_project_dir $TEST_TMPDIR/valid" "Accepts valid project"

# Test 4: Environment variable parsing
test_header "Environment Variable Parsing"

test_case "parse_env_vars should extract command-line variables"
local result=$(parse_env_vars "$TEST_TMPDIR" --env KEY1=value1 --env KEY2=value2)
local count=$(echo "$result" | wc -l)
assert_equal "2" "$count" "Two environment variables parsed"

test_case "parse_env_vars should read from .env file"
mkdir -p "$TEST_TMPDIR/with-env"
echo '{"name": "test"}' > "$TEST_TMPDIR/with-env/package.json"
echo -e "KEY1=value1\nKEY2=value2" > "$TEST_TMPDIR/with-env/.env.example"
local result=$(parse_env_vars "$TEST_TMPDIR/with-env" --env-file "$TEST_TMPDIR/with-env/.env.example")
local count=$(echo "$result" | grep -c '=' || echo 0)
assert_equal "2" "$count" "Variables read from .env file"

# Test 5: Script files
test_header "Script Files"

test_case "All script files should exist"
assert_file_exists "$SCRIPT_DIR/script/deploy.sh" "deploy.sh exists"
assert_file_exists "$SCRIPT_DIR/script/validate.sh" "validate.sh exists"
assert_file_exists "$SCRIPT_DIR/script/github-setup.sh" "github-setup.sh exists"
assert_file_exists "$SCRIPT_DIR/script/setup-env.sh" "setup-env.sh exists"
assert_file_exists "$SCRIPT_DIR/script/utils.sh" "utils.sh exists"

test_case "Script files should be executable"
assert_true "[[ -x $SCRIPT_DIR/script/deploy.sh ]]" "deploy.sh is executable"
assert_true "[[ -x $SCRIPT_DIR/script/validate.sh ]]" "validate.sh is executable"
assert_true "[[ -x $SCRIPT_DIR/script/github-setup.sh ]]" "github-setup.sh is executable"
assert_true "[[ -x $SCRIPT_DIR/script/setup-env.sh ]]" "setup-env.sh is executable"

# Test 6: Documentation files
test_header "Documentation Files"

test_case "All documentation files should exist"
assert_file_exists "$SCRIPT_DIR/SKILL.md" "SKILL.md exists"
assert_file_exists "$SCRIPT_DIR/README.md" "README.md exists"
assert_file_exists "$SCRIPT_DIR/EXAMPLES.md" "EXAMPLES.md exists"
assert_file_exists "$SCRIPT_DIR/TROUBLESHOOTING.md" "TROUBLESHOOTING.md exists"

test_case "Configuration files should exist"
assert_file_exists "$SCRIPT_DIR/package.json" "package.json exists"
assert_file_exists "$SCRIPT_DIR/vercel-config.json" "vercel-config.json exists"

# Test 7: Help command
test_header "Help Command"

test_case "deploy.sh should show help"
local help_output=$($SCRIPT_DIR/script/deploy.sh --help 2>/dev/null || true)
assert_true "[[ -n '$help_output' ]]" "Help text is displayed"

# Test 8: Validation script
test_header "Validation Script"

test_case "validate.sh should work with valid project"
mkdir -p "$TEST_TMPDIR/valid-project"
cat > "$TEST_TMPDIR/valid-project/package.json" << 'EOF'
{
  "name": "test-project",
  "version": "1.0.0",
  "description": "Test project",
  "main": "index.js",
  "scripts": {
    "build": "echo 'Building...'",
    "start": "node index.js"
  },
  "dependencies": {
    "next": "^14.0.0"
  }
}
EOF
assert_true "bash $SCRIPT_DIR/script/validate.sh $TEST_TMPDIR/valid-project 0" "Validation passes for valid project"

# Test 9: Log file creation
test_header "Logging"

test_case "Log file should be created"
log_info "Test log message"
assert_file_exists "$LOG_FILE" "Log file is created"

test_case "Log file should contain messages"
assert_true "grep -q 'Test log message' $LOG_FILE" "Log message is written"

# Results
test_header "Test Summary"

local total=$((TESTS_PASSED + TESTS_FAILED))
local pass_rate=$((TESTS_PASSED * 100 / total))

echo ""
echo "Total Tests: $total"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
echo "Pass Rate: $pass_rate%"
echo ""

if [[ $TESTS_FAILED -eq 0 ]]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
