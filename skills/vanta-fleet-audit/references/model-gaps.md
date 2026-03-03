# Model Status & Gaps

## Model Inventory (1-38 Expected)

### Currently Online (✅)
- Model 01: Adriana Kind (1/1 logged in)
- Model 03: ALINA VOIGT (1/2 logged in)
- Model 04: Alisa Drovnik (1/1 logged in)
- Model 05: Amelia Korovic (1/1 logged in)
- Model 10: Ella Lovel (1/1 logged in)
- Model 13: Gabbie Montez (1/1 logged in)
- Model 15: Gwen Sanders (1/1 logged in)
- Model 16: Isabella Marentes (1/1 logged in)
- Model 23: Mac Harper (1/1 logged in)
- Model 25: Nadia Ramires (1/1 logged in)
- Model 28: Alina Mendoza (1/1 logged in)
- Model 38: Eva Long (1/1 logged in)

**Online: 12/38 models**

### Currently Offline (❌)
- Model 06: ARIANA SOLIS (0/1)
- Model 07: AUBRIE WISE (0/1)
- Model 17: AUBRIE WISE (0/1)
- Model 18: Alisa Drovnik (0/1)
- Model 21: Lauren Elridge (0/1)
- Model 22: Mac Harper (0/1)
- Model 24: ARIANA SOLIS (0/1)
- Model 27: SABBI YARN (0/1)
- Model 29: Sarina Hoshino (0/1)
- Model 37: Hailey Whitmore (0/1)

**Offline: 10/38 models**

### Missing from System (❌ Not Created)
- Model 2
- Model 14
- Model 31
- Model 32
- Model 33
- Model 34
- Model 35
- Model 36

**Missing: 8/38 models**

### Unknown Models (No model_name)
- Model 08 (0/1)
- Model 09 (0/1)
- Model 11 (0/1)
- Model 12 (0/1)
- Model 19 (0/1)
- Model 20 (0/1)
- Model 23 (duplicate entry)
- Model 26 (0/1)
- Model 30 (0/1)

---

## Action Items

### Critical: Get Offline Models Online
These models exist in system but have no active sessions. Likely reasons: quarantine, lost password, or device reset.

```sql
-- Find offline model accounts
SELECT DISTINCT
  a.model_id,
  a.model_name,
  a.username,
  a.status,
  a.device_id,
  COUNT(*) as account_count
FROM accounts a
LEFT JOIN device_sessions ds ON ds.account_username = a.username
WHERE a.model_id IN (6, 7, 17, 18, 21, 22, 24, 27, 29, 37)
  AND ds.session_state IS NULL
GROUP BY a.model_id, a.model_name, a.username, a.status, a.device_id;
```

**Recovery options:**
1. **Reset login** — Force logout and re-login on device
2. **Assign new device** — Move account to working device
3. **Check status** — Is account quarantined/banned?
4. **Verify credentials** — Are 2FA codes still valid?

---

### High Priority: Create Missing Models (2, 14, 31-36)
These model IDs are missing completely. They may represent creator accounts not yet added.

```sql
-- Check if these models are referenced but not created
SELECT model_id, COUNT(*) 
FROM accounts 
WHERE model_id IN (2, 14, 31, 32, 33, 34, 35, 36)
GROUP BY model_id;
```

If count is 0, models need to be created:

```sql
-- Create missing model records
INSERT INTO accounts (username, model_id, model_name, status, device_id)
VALUES
  ('model_02_account', 2, 'Model 02', 'profile_setup', NULL),
  ('model_14_account', 14, 'Model 14', 'profile_setup', NULL),
  ('model_31_account', 31, 'Model 31', 'profile_setup', NULL),
  ('model_32_account', 32, 'Model 32', 'profile_setup', NULL),
  ('model_33_account', 33, 'Model 33', 'profile_setup', NULL),
  ('model_34_account', 34, 'Model 34', 'profile_setup', NULL),
  ('model_35_account', 35, 'Model 35', 'profile_setup', NULL),
  ('model_36_account', 36, 'Model 36', 'profile_setup', NULL);
```

---

### Medium: Fix Duplicate Model Entries
Some models appear multiple times (e.g., Model 23 = "Mac Harper" + "???"). Consolidate or clarify:

```sql
-- Find duplicate model IDs
SELECT model_id, model_name, COUNT(*) as count
FROM accounts
WHERE model_id IS NOT NULL
GROUP BY model_id, model_name
HAVING COUNT(*) > 1;

-- Merge duplicates (example)
UPDATE accounts
SET model_name = 'Mac Harper'
WHERE model_id = 23 AND model_name = '???';
```

---

### Low: Update Unknown Models
Models 8, 9, 11, 12, 19, 20, 26, 30 have no `model_name`. Add names:

```sql
UPDATE accounts
SET model_name = 'Model Name Here'
WHERE model_id IN (8, 9, 11, 12, 19, 20, 26, 30)
  AND model_name IS NULL;
```

---

## Model Status Summary

| Status | Count | Example | Action |
|--------|-------|---------|--------|
| Online (logged in) | 12 | Model 1: Adriana Kind | Keep running |
| Offline (in system) | 10 | Model 6: ARIANA SOLIS | Recover or retire |
| Missing (not created) | 8 | Model 2, 14, 31-36 | Create if needed |
| Unknown (no name) | 9 | Model 8, 9, etc. | Rename/clarify |

---

## Recovery Commands

### Quick: List All Model Status
```bash
npx tsx scripts/fleet-audit-enhanced.ts | grep "Model "
```

### Get Login Credentials for Offline Model
```sql
SELECT model_id, username, email, password
FROM accounts
WHERE model_id = 6
LIMIT 1;
```

### Reassign Account to New Device
```sql
UPDATE accounts
SET device_id = '598195068796403854'
WHERE model_id = 6 AND username = 'example.user';
```

### Force Re-login
```sql
DELETE FROM device_sessions
WHERE account_username IN (
  SELECT username FROM accounts WHERE model_id = 6
);
```

---

## Monitoring

### Daily Check
```bash
# See which models are online
npx tsx scripts/fleet-audit-enhanced.ts | grep "Model " | grep "✅"
```

### Weekly Review
- Are offline models still offline? (Investigate why)
- Any new models added? (Check missing list)
- Model names updated? (Keep consistent)

### Monthly Report
- Archive model status
- Identify offline models >7 days
- Plan model recovery or retirement
