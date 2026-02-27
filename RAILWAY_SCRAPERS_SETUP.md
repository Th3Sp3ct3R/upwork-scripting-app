# Railway Scrapers JSON Setup

## Format (for SCRAPERS_JSON environment variable)

```json
[
  {
    "id": "scraper_01",
    "username": "ig_account_1",
    "userId": "123456789",
    "token": "Bearer IGT:2:ABC123...",
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "cookies": {
      "sessionid": "sessionid_value_here",
      "X-MID": "mid_value_here",
      "X-IG-WWW-Claim": "0",
      "IG-U-DS-USER-ID": "user_id_here",
      "ds_user_id": "user_id_here"
    }
  },
  {
    "id": "scraper_02",
    "username": "ig_account_2",
    "userId": "987654321",
    "token": "Bearer IGT:2:DEF456...",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "cookies": {
      "sessionid": "sessionid_value_2",
      "X-MID": "mid_value_2",
      "ds_user_id": "user_id_2"
    }
  }
]
```

---

## How to Get Credentials

### 1. Instagram Session ID + Cookies
```
Browser DevTools → Application → Cookies → instagram.com
Copy: sessionid, X-MID, ds_user_id, X-IG-WWW-Claim, IG-U-DS-USER-ID
```

### 2. Bearer Token (IGT:2)
```
From Instagram private API endpoints or scraper service
Format: Bearer IGT:2:{BASE64_ENCODED_TOKEN}
```

### 3. User Agent
```
Browser: User-Agent header from any Instagram request
Or use: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36
```

---

## How to Deploy to Railway

### Step 1: Prepare JSON
Create your 50-scraper JSON array (see format above).

**⚠️ IMPORTANT:**
- Remove all newlines/formatting → Single line JSON
- Escape quotes properly
- Test JSON validity: `jq . scrapers.json`

### Step 2: Set on Railway

**Via CLI:**
```bash
railway link  # Connect to project
railway variables set SCRAPERS_JSON '[{"id":"scraper_01",...}]'
```

**Via Web Dashboard:**
1. Go to: https://railway.app/project/d86c3d42-7778-412f-8268-249850ef96a0
2. Select `instagrowth-saas-production` service
3. Variables tab
4. Create new variable: `SCRAPERS_JSON`
5. Paste entire JSON array (single line)
6. Click Deploy

### Step 3: Verify Deployment

```bash
curl -X GET https://instagrowth-saas-production.up.railway.app/api/scrapers/status
```

Expected response:
```json
{
  "total": 50,
  "accounts": [
    {"id": "scraper_01", "username": "ig_account_1"},
    ...
  ]
}
```

---

## Example: 3-Scraper Minimum (for testing)

```json
[
  {
    "id": "scraper_01",
    "username": "test_account_1",
    "userId": "111111111",
    "token": "Bearer IGT:2:YWJjZGVmZ2hpamtsbW5vcA==",
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "cookies": {
      "sessionid": "abc123def456",
      "X-MID": "xyz789",
      "ds_user_id": "111111111"
    }
  },
  {
    "id": "scraper_02",
    "username": "test_account_2",
    "userId": "222222222",
    "token": "Bearer IGT:2:aGhpaWpqa2xtbm9wcA==",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "cookies": {
      "sessionid": "def456ghi789",
      "X-MID": "abc123",
      "ds_user_id": "222222222"
    }
  },
  {
    "id": "scraper_03",
    "username": "test_account_3",
    "userId": "333333333",
    "token": "Bearer IGT:2:amlqa2xtbm9wcHFy==",
    "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "cookies": {
      "sessionid": "ghi789jkl012",
      "X-MID": "def456",
      "ds_user_id": "333333333"
    }
  }
]
```

---

## Full 50-Scraper Template

To build your 50-scraper JSON, repeat the pattern 50 times with:
- `id`: `scraper_01` through `scraper_50`
- `username`: Your 50 Instagram account usernames
- `userId`: The numeric user ID for each account
- `token`: Bearer IGT:2 token for each account
- `cookies`: Session cookies for each account

**Total size:** ~15-20 KB for 50 accounts

---

## Security Best Practices

✅ **DO:**
- Store SCRAPERS_JSON as Railway environment variable (not in git)
- Use `.env.example` with placeholder values
- Rotate tokens weekly
- Monitor for rate limiting (indicates compromised token)
- Use different user agents per scraper (vary browser strings)

❌ **DON'T:**
- Commit SCRAPERS_JSON to git
- Share tokens in Slack/Discord
- Reuse tokens across environments
- Use same user agent for all scrapers (Instagram detects patterns)
- Store in database (use env var only)

---

## Validation Commands

```bash
# Check if JSON is valid
echo '[...]' | jq .

# Validate on Railway
railway variables get SCRAPERS_JSON | jq . | head -20

# Test scraper loading (after deploy)
curl https://instagrowth-saas-production.up.railway.app/api/scrapers/status

# Expected: {"total": 50, "accounts": [...]}
```

---

## Troubleshooting

### "SCRAPERS_JSON not set in environment"
- Ensure variable is set on Railway
- Redeploy backend: `git push origin main`
- Check Railway Variables tab

### "Failed to parse SCRAPERS_JSON"
- JSON syntax error — validate with `jq`
- Missing quotes around strings
- Unescaped special characters

### "0 scrapers loaded"
- JSON array is empty
- Accounts have invalid tokens (expired)
- Check Railway logs: `railway logs -f`

### "Rate limited (429 errors)"
- Reduce requests per scraper
- Add more scrapers to pool
- Rotate tokens (weekly)
- Vary user agents

---

## Next Steps

1. **Prepare credentials** for 50 (or 3-10 for testing) Instagram accounts
2. **Build JSON array** using format above
3. **Validate JSON** with `jq`
4. **Deploy to Railway** via web dashboard or CLI
5. **Verify** with `/api/scrapers/status` endpoint
6. **Test scraping** with `/api/scrapers/profile` endpoint

---

## Example Production Deployment

```bash
# Local validation
cat scrapers.json | jq . > /dev/null && echo "✅ Valid JSON"

# Deploy to Railway
railway link
railway variables set SCRAPERS_JSON "$(cat scrapers.json | jq -c .)"

# Verify
curl https://instagrowth-saas-production.up.railway.app/api/scrapers/status | jq .

# Expected: 50 scrapers loaded ✅
```

---

**Ready to deploy?** Prepare your scraper credentials and follow the steps above. 🚀
