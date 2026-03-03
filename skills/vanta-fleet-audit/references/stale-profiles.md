# Stale Profiles — Logged In But Not Posting

## What is a Stale Profile?

An account that is:
- ✅ Logged in on a device (active session)
- ✅ Ready to post
- ❌ BUT hasn't updated profile info in >24 hours

**Why it matters:** 
- Indicates account may not be actively posting
- Profile snapshot time tracks last bio/display name/pic change
- If stale = not being used for growth operations

---

## Detection

```bash
# Find stale profiles
npx tsx scripts/fleet-audit-enhanced.ts | grep -A 20 "STALE PROFILES"
```

**Output example:**
```
🚨 STALE PROFILES (Logged in but no recent changes)
──────────────────────────────────────────────────
(>24h since last profile snapshot)

@eva.long.official                     Model: 38 | Stale: 3d 5h
  Display: "Eva Long"
  Last snapshot: 2/23/2026

@sophie.lowel                          Model: 00 | Stale: 2d 8h
  Display: "Sophie Lowel"
  Last snapshot: 2/25/2026
```

---

## Why Profiles Go Stale

1. **Account idle** — Logged in but not being used for posting
2. **Profile locked** — Instagram restricted profile edits (rare)
3. **Profile setup complete** — No more changes planned
4. **Growth paused** — Account not in active rotation
5. **Device reset** — Session lost, needs re-login

---

## Fix Options

### Option 1: Update Profile Manually
Force a profile change to refresh snapshot:

```bash
# Update bio
# Update display name  
# Change profile picture
# Account should refresh profile_snapshot_at
```

### Option 2: Refresh via API
If automation controls the profile:

```sql
-- Force update profile_snapshot_at
UPDATE accounts
SET profile_snapshot_at = NOW()
WHERE username = 'eva.long.official';
```

### Option 3: Check if Account is Needed
Is this account still active?

```sql
-- Check pending posts
SELECT COUNT(*) as pending_posts
FROM scheduled_posts
WHERE account_id = (SELECT id FROM accounts WHERE username = 'eva.long.official')
  AND status = 'pending';

-- Check last post
SELECT last_posted_at, last_post_url
FROM accounts
WHERE username = 'eva.long.official';
```

If 0 pending posts and nothing posted recently → Account may be retired.

### Option 4: Re-login Account
Force fresh session:

```sql
-- Delete old session
DELETE FROM device_sessions
WHERE account_username = 'eva.long.official';

-- Account will need re-login on device
```

---

## Prevention

### Update Profile Regularly
Include profile changes in posting schedule:
- Every N posts, update bio (test new copy)
- Every M posts, rotate profile picture
- Every W posts, update display name

### Track Profile Snapshot Time
Monitor via audit:
```bash
# Weekly check
npx tsx scripts/fleet-audit-enhanced.ts | grep "profile_snapshot_at"
```

### Automated Updates
If profiles are managed via code:

```sql
-- Auto-update profile_snapshot_at after change
UPDATE accounts
SET profile_snapshot_at = NOW()
WHERE username = ? AND bio_changed_at > NOW() - INTERVAL '1 hour';
```

---

## Profile Snapshot Columns

| Column | Meaning |
|--------|---------|
| `bio_changed_at` | Last time bio was updated |
| `username_changed_at` | Last time username was changed |
| `profile_pic_changed_at` | Last time profile picture was updated |
| `profile_snapshot_at` | Last time ANY profile field was updated |
| `current_bio` | Current bio text |
| `current_display_name` | Current display name |
| `profile_pic_url` | Current profile picture URL |

---

## Stale Profile Threshold

**Default:** >24 hours stale

**Adjust if needed:**
```sql
-- Find profiles >48h stale
SELECT username, EXTRACT(HOUR FROM (NOW() - profile_snapshot_at))
FROM accounts
WHERE profile_snapshot_at < NOW() - INTERVAL '48 hours'
  AND (SELECT session_state FROM device_sessions WHERE account_username = accounts.username) = 'logged_in';
```

---

## Stale Profile Alert Rules

**Green (Fresh):** <12h stale
- Profile actively being updated
- Account in active rotation

**Yellow (Stale):** 12-48h
- Account likely in later rotation
- Check if still needed

**Red (Very Stale):** >48h
- Account probably inactive
- May need retirement or re-activation

---

## Why This Matters for Growth

- **Active profiles** = Tested bio, optimized copy, engaged audience
- **Stale profiles** = Old messaging, could be hurting growth
- **Regular updates** = A/B test bios, refresh audience interest, track what works

**Recommendation:** Update top 5 models' profiles weekly with new bio copy, rotation pics, test new CTAs.
