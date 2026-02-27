#!/bin/bash

# Validate and format scrapers JSON for Railway deployment

set -e

if [ $# -eq 0 ]; then
  echo "Usage: ./validate-scrapers.sh <scrapers.json>"
  echo ""
  echo "Examples:"
  echo "  ./validate-scrapers.sh scrapers-50-example.json"
  echo "  ./validate-scrapers.sh my-scrapers.json"
  exit 1
fi

FILE="$1"

if [ ! -f "$FILE" ]; then
  echo "❌ File not found: $FILE"
  exit 1
fi

echo "🔍 Validating $FILE..."
echo ""

# Check JSON syntax
if ! jq . "$FILE" > /dev/null 2>&1; then
  echo "❌ Invalid JSON syntax"
  jq . "$FILE" 2>&1 | head -20
  exit 1
fi

echo "✅ Valid JSON syntax"

# Count scrapers
COUNT=$(jq 'length' "$FILE")
echo "✅ Found $COUNT scrapers"

# Check required fields
echo "✅ Checking required fields..."

if ! jq -e '.[] | select(.id and .username and .userId and .token and .cookies)' "$FILE" > /dev/null 2>&1; then
  echo "❌ Missing required fields in scrapers"
  echo "Required: id, username, userId, token, cookies"
  exit 1
fi

echo "✅ All required fields present"

# Check token format
echo "✅ Checking token format..."
INVALID_TOKENS=$(jq -r '.[] | select(.token | startswith("Bearer IGT:2:") | not) | .id' "$FILE" | wc -l)
if [ "$INVALID_TOKENS" -gt 0 ]; then
  echo "⚠️  $INVALID_TOKENS scrapers have invalid token format"
  echo "Expected: Bearer IGT:2:..."
  jq -r '.[] | select(.token | startswith("Bearer IGT:2:") | not) | .id' "$FILE"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ VALIDATION PASSED"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Generate single-line JSON for Railway
ONELINE=$(jq -c . "$FILE")
echo "📋 Single-line JSON (for Railway env var):"
echo ""
echo "$ONELINE"
echo ""

# Save to file
OUTPUTFILE="${FILE%.json}-railway.json"
echo "$ONELINE" > "$OUTPUTFILE"
echo "✅ Saved to: $OUTPUTFILE"
echo ""

echo "🚀 To deploy to Railway:"
echo ""
echo "  Option 1: CLI"
echo "    railway variables set SCRAPERS_JSON '$(echo $ONELINE | head -c 80)...'"
echo ""
echo "  Option 2: Web Dashboard"
echo "    1. Go to https://railway.app/project/d86c3d42-7778-412f-8268-249850ef96a0"
echo "    2. Select instagrowth-saas-production"
echo "    3. Variables tab → New variable"
echo "    4. Name: SCRAPERS_JSON"
echo "    5. Value: (paste content of $OUTPUTFILE)"
echo "    6. Deploy"
echo ""

echo "✅ To verify deployment:"
echo "  curl https://instagrowth-saas-production.up.railway.app/api/scrapers/status"
echo ""
echo "📊 Expected response:"
echo "  {\"total\": $COUNT, \"accounts\": [...]}"
