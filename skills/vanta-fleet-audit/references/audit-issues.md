# Common Audit Issues & Fixes

## Issue 1: Orphan Sessions

**Symptom:** device_sessions exist but no matching account

**SQL to find:**
```sql
SELECT ds.device_id, ds.account_username
FROM device_sessions ds
LEFT JOIN accounts a ON a.username = ds.account_username
WHERE a.id IS NULL;
```

**Fix options:**
1. Delete orphan session (if old): `DELETE FROM device_sessions WHERE account_username = 'xxx'`
2. Create matching account: Insert new account record with username
3. Move account to device: `UPDATE accounts SET device_id = 'xxx' WHERE username = 'yyy'`

---

## Issue 2: Stale Device Locks

**Symptom:** device_locks locked for >30 minutes (orchestrator crashed)

**SQL to find:**
```sql
SELECT device_id, locked_by, locked_at
FROM device_locks
WHERE locked_at < NOW() - INTERVAL '30 minutes';
```

**Fix:**
```sql
DELETE FROM device_locks
WHERE locked_at < NOW() - INTERVAL '30 minutes';
```

---

## Issue 3: Missing Model IDs

**Symptom:** Accounts with model_id = NULL

**SQL to find:**
```sql
SELECT username, current_display_name
FROM accounts
WHERE model_id IS NULL OR model_id = 0;
```

**Fix:** Assign model_id (1-38):
```sql
UPDATE accounts
SET model_id = 5, model_name = 'Amelia Korovic'
WHERE username = 'amelia.korovic.official';
```

**Models 1-38 expected:** Check references/model-list.md

---

## Issue 4: Unassigned Accounts

**Symptom:** Accounts not assigned to any device (device_id = NULL)

**SQL to find:**
```sql
SELECT username, status
FROM accounts
WHERE device_id IS NULL OR device_id = '';
```

**Fix:** Assign to device:
```sql
UPDATE accounts
SET device_id = '604061345851113545'
WHERE username = 'example.user';
```

---

## Issue 5: Status Mismatch

**Symptom:** Account status doesn't match session state

**Example:** Account status = 'offline' but device_sessions shows 'logged_in'

**SQL to find:**
```sql
SELECT a.username, a.status, ds.session_state
FROM accounts a
LEFT JOIN device_sessions ds ON ds.account_username = a.username
WHERE (a.status = 'logged_in' AND ds.session_state != 'logged_in')
   OR (a.status != 'logged_in' AND ds.session_state = 'logged_in');
```

**Fix:** Update account status to match session:
```sql
UPDATE accounts
SET status = 'logged_in'
WHERE username = 'example.user';
```

---

## Issue 6: Multiple Sessions per Account

**Symptom:** Same account logged in on 2+ devices

**SQL to find:**
```sql
SELECT account_username, COUNT(DISTINCT device_id) as device_count
FROM device_sessions
WHERE session_state = 'logged_in'
GROUP BY account_username
HAVING COUNT(DISTINCT device_id) > 1;
```

**Fix:** Log out from extra devices:
```sql
DELETE FROM device_sessions
WHERE account_username = 'example.user'
  AND device_id = '604061345851113545';
```

---

## Issue 7: Device with No Accounts

**Symptom:** device_id appears in device_sessions but no accounts assigned

**SQL to find:**
```sql
SELECT DISTINCT ds.device_id
FROM device_sessions ds
LEFT JOIN accounts a ON a.device_id = ds.device_id
WHERE a.id IS NULL;
```

**Fix:** Either delete device_sessions or create account:
```sql
-- Option 1: Delete sessions
DELETE FROM device_sessions WHERE device_id = 'xxx';

-- Option 2: Assign account
UPDATE accounts SET device_id = 'xxx' WHERE username = 'yyy';
```

---

## Audit Checklist

- [ ] No orphan sessions
- [ ] No stale device locks
- [ ] All accounts have model_id (1-38)
- [ ] No unassigned accounts (unless intentional)
- [ ] Status matches session state
- [ ] No duplicate sessions per account
- [ ] All devices have accounts

## Audit Frequency

- **Before major operations**: Run full audit
- **After login/logout**: Quick session check
- **Weekly**: Full report with historical comparison
- **Monthly**: Archive audit results, identify trends
