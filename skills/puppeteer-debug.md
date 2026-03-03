# Puppeteer Debug Skill

Debug and fix Puppeteer/Chrome launch issues on macOS.

## Common Issues

### 1. bootstrap_check_in Error (macOS)

**Symptom:**
```
ERROR:bootstrap.cc(65)] bootstrap_check_in org.chromium.crashpad.child_port_handshake.*: unknown error code (141)
ERROR:file_io.cc(94)] ReadExactly: expected 4, observed 0
```

**Cause:** macOS crashpad service limits reached due to:
- Too many Chrome processes running
- Orphaned Chrome processes from previous sessions
- Crashpad handler registration conflicts

**Fix:**

1. **Kill orphaned Chrome processes:**
```bash
pkill -f "Google Chrome for Testing"
```

2. **Add crashpad disable flags to Puppeteer launch:**
```typescript
const browser = await puppeteer.launch({
  headless: 'new',
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    // macOS crashpad workarounds
    '--disable-crashpad',
    '--disable-breakpad',
    '--disable-features=CrashReporting',
  ],
});
```

3. **Check for zombie processes:**
```bash
ps aux | grep -i "chrome" | grep puppeteer
```

### 2. EADDRINUSE Error

**Symptom:**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Fix:**
```bash
lsof -ti:3001 | xargs kill -9
```

### 3. Memory Issues

**Symptom:** Browser crashes with out of memory errors

**Fix:** Add memory limit flags:
```typescript
args: [
  '--js-flags=--max-old-space-size=512',
  '--disable-dev-shm-usage',
]
```

## Diagnostic Commands

```bash
# Check Puppeteer Chrome path
node -e "const p = require('puppeteer'); console.log(p.executablePath())"

# Test basic Puppeteer launch
node -e "
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-crashpad']
  });
  console.log('Browser launched!');
  await browser.close();
})();
"

# Check running Chrome processes
ps aux | grep -i chrome | grep -v grep

# Check port usage
lsof -i :3001
```

## VANTA Server Restart

When the VANTA server Puppeteer connection fails:

```bash
# 1. Kill all Chrome processes
pkill -f "Google Chrome for Testing"

# 2. Kill server
pkill -f "tsx.*server" || lsof -ti:3001 | xargs kill -9

# 3. Restart server
nohup npx tsx server/index.ts > /tmp/vanta-server.log 2>&1 &

# 4. Verify
curl -s http://localhost:3001/health
```

## Benchmark Results (Fixed)

After applying crashpad fixes:

| Method | Latency | Notes |
|--------|---------|-------|
| WebRTC Canvas | **170ms avg** | 33x faster than ADB |
| ADB Screenshot | 5646ms | Network latency to cloud |
| ADB UI Dump | 4069ms | Element detection |

## Files Modified

- `server/lib/connection-pool.ts` - Added crashpad disable flags
- `lib/hybrid-vision.ts` - Hybrid vision module using WebRTC + ADB

## Related

- [Puppeteer Troubleshooting](https://pptr.dev/troubleshooting)
- [Chrome Crashpad](https://chromium.googlesource.com/crashpad/crashpad/)
