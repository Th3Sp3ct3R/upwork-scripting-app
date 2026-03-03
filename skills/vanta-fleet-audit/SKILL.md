---
name: vanta-fleet-audit
description: Scan VANTA fleet devices, audit account assignments, detect orphan sessions, and generate comprehensive device status reports. Use to diagnose fleet health, identify session mismatches, verify device-account mappings, find unassigned accounts, and troubleshoot posting failures. Returns device manifests with logged-in sessions and issue flags.
---

# VANTA Fleet Audit

## Quick Start

Run the enhanced audit script to scan all devices:

```bash
npx tsx scripts/fleet-audit-enhanced.ts
```

Output includes:
- **Device Summary** — Total devices, accounts, logged-in sessions
- **Model Status** — Which models (creators) are online vs offline (1-38 expected)
- **Missing Models** — Models 2, 14, 31-36 not yet created
- **Stale Profiles** — Accounts logged in but not updating profile (>24h old)
- **Device Details** — Per-device account list with session states
- **JSON Output** — Machine-readable data for automation

## Common Tasks

### Check Fleet Health
```bash
npx tsx scripts/fleet-audit-enhanced.ts | head -40
```
See device count, model status, stale profiles, and logged-in accounts.

### Find Offline Models
```bash
npx tsx scripts/fleet-audit-enhanced.ts | grep "Model" | grep "❌"
```
Lists models that exist in system but have no logged-in accounts.

### Find Stale Profiles (Not Updating)
```bash
npx tsx scripts/fleet-audit-enhanced.ts | grep "STALE PROFILES" -A 50
```
Shows accounts logged in but not changing their profile info (>24h).

### Check Specific Model Status
```bash
npx tsx scripts/fleet-audit-enhanced.ts | grep "Model 23"
```
See if Model 23 is online, how many accounts, etc.

### Generate HTML Report
```bash
npx tsx scripts/fleet-audit-enhanced.ts > audit-output.json
# Then process JSON through assets/report-template.html
```

### Find Specific Issues
Use references/ for detailed guides:
- **model-gaps.md** — Missing models (2, 14, 31-36), offline models, recovery options
- **audit-issues.md** — Orphan sessions, stale locks, unassigned accounts, fixes

## Database Schema

See references/device-schema.md for:
- **accounts** table (device assignments, status codes)
- **device_sessions** table (active logins)
- **device_locks** table (orchestration locks)
- Key queries for common audits

## Audit Checklist

Before major operations, verify:

**Device & Session Health:**
- [ ] No orphan sessions (`device_sessions` without matching account)
- [ ] No stale locks (`device_locks` >30 min old)
- [ ] No unassigned accounts (device_id = NULL)
- [ ] Account status matches session state
- [ ] No duplicate sessions per account

**Model Status:**
- [ ] 12+ models online (logged in)
- [ ] Missing models noted: 2, 14, 31-36 (create if needed)
- [ ] Offline models identified (check why: quarantine, password, device issue?)
- [ ] All online models have non-NULL model_name

**Profile Activity:**
- [ ] No accounts >24h stale (logged in but not updating profile)
- [ ] Recent profile snapshots for active models
- [ ] Bio/display name changes being tracked

## Typical Issues & Fixes

**Orphan sessions:** Device logged in but no account record
```bash
# Find them
SELECT ds.device_id, ds.account_username
FROM device_sessions ds
LEFT JOIN accounts a ON a.username = ds.account_username
WHERE a.id IS NULL;

# Delete or reassign
DELETE FROM device_sessions WHERE account_username = 'xxx';
```

**Missing model IDs:** Accounts with model_id = NULL
```bash
UPDATE accounts
SET model_id = 5, model_name = 'Amelia Korovic'
WHERE username = 'amelia.korovic.official';
```

**Stale locks:** Orchestrator crash left device locked
```bash
DELETE FROM device_locks
WHERE locked_at < NOW() - INTERVAL '30 minutes';
```

See references/audit-issues.md for complete troubleshooting guide.

## Output Format

### Console Output
```
=== VANTA FLEET AUDIT ===

DEVICE SUMMARY:
Total devices: 34
Total accounts on devices: 77
Logged in: 24
Active: 0

DEVICES:
📱 598195068796403854
   Accounts: 10 | Logged in: 7
   ✅ Logged in:
      • sophie.lowel (Sophie Lowel)
      • eva.long.official (Eva Long)
      ...

⚠️  ORPHAN SESSIONS:
   604061359524544586: @eliana.marek.official (logged_in)

=== JSON OUTPUT ===
{
  "devices": [...],
  "accounts": [...],
  "orphans": [...]
}
```

### JSON Structure
```json
{
  "devices": [
    {
      "device_id": "598195068796403854",
      "account_count": "10",
      "logged_in_count": "7",
      "active_count": "0"
    }
  ],
  "accounts": [
    {
      "device_id": "598195068796403854",
      "username": "sophie.lowel",
      "current_display_name": "Sophie Lowel",
      "status": "logged_in",
      "session_state": "logged_in",
      "last_activity_at": null
    }
  ],
  "orphans": [
    {
      "device_id": "604061359524544586",
      "account_username": "eliana.marek.official",
      "session_state": "logged_in"
    }
  ]
}
```

## Environment

Requires:
- `DATABASE_URL` environment variable (Neon PostgreSQL)
- `@neondatabase/serverless` package
- Node.js 18+
- `npx tsx` for TypeScript execution

## Running Periodically

### Cron (Daily Health Check)
```bash
0 2 * * * cd /path/to/vanta && npx tsx scripts/fleet-audit.ts >> logs/audit.log 2>&1
```

### GitHub Actions (Scheduled)
```yaml
- name: Fleet Audit
  run: npx tsx scripts/fleet-audit.ts > audit-report.json
```

### Manual (Before Major Operations)
```bash
npx tsx scripts/fleet-audit.ts | tee audit-$(date +%Y%m%d-%H%M%S).log
```

## References

- **device-schema.md** — Database structure, tables, columns, key queries
- **model-gaps.md** — Model inventory (1-38), online/offline status, missing models (2, 14, 31-36), recovery procedures
- **stale-profiles.md** — Accounts logged in but not updating profile info (>24h), why it happens, how to fix
- **audit-issues.md** — Common problems (orphan sessions, stale locks, etc.), SQL detection, fix procedures

## Assets

- **report-template.html** — HTML report generator (inject JSON via `{{AUDIT_JSON}}`)

---

**Next:** See references/audit-issues.md for troubleshooting specific fleet problems.
