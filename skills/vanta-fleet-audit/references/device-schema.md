# VANTA Device Schema

## Core Tables

### accounts
Tracks all Instagram accounts and their device assignments.

| Column | Type | Purpose |
|--------|------|---------|
| id | SERIAL | Account ID |
| device_id | VARCHAR | Device UUID or VANTA model name |
| username | VARCHAR | Instagram username |
| current_display_name | VARCHAR | Instagram display name |
| status | VARCHAR | logged_in, active, offline, quarantine, banned, session_pending, checkpoint, failed_login, paused, profile_setup, device_assigned |
| model_id | INTEGER | Model/creator ID (1-38 expected) |
| model_name | VARCHAR | Creator/model name |

### device_sessions
Tracks active Instagram sessions on each device.

| Column | Type | Purpose |
|--------|------|---------|
| id | SERIAL | Session ID |
| device_id | VARCHAR | Device UUID |
| account_username | VARCHAR | Username logged in |
| session_state | VARCHAR | logged_in, session_expired, banned |
| last_activity_at | TIMESTAMP | Last action on this account |
| session_cookies | TEXT | Login cookies |
| instagram_app_version | VARCHAR | App version on device |

### device_locks (Fleet Orchestration)
Prevents concurrent execution on same device.

| Column | Type | Purpose |
|--------|------|---------|
| device_id | VARCHAR (PK) | Device UUID |
| locked_by | VARCHAR | Executor ID holding lock |
| locked_at | TIMESTAMP | When lock was acquired |
| release_at | TIMESTAMP | Auto-cleanup time (locked_at + 30min) |

## Key Queries

### Device Status Summary
```sql
SELECT 
  device_id,
  COUNT(*) as account_count,
  SUM(CASE WHEN status = 'logged_in' THEN 1 ELSE 0 END) as logged_in_count
FROM accounts
WHERE device_id IS NOT NULL
GROUP BY device_id;
```

### Logged-In Accounts per Device
```sql
SELECT
  a.device_id,
  a.username,
  a.current_display_name,
  ds.session_state
FROM accounts a
LEFT JOIN device_sessions ds ON ds.account_username = a.username
WHERE a.device_id IS NOT NULL
  AND ds.session_state = 'logged_in';
```

### Orphan Sessions (Account not found for session)
```sql
SELECT DISTINCT
  ds.device_id,
  ds.account_username
FROM device_sessions ds
LEFT JOIN accounts a ON a.username = ds.account_username
WHERE a.id IS NULL;
```

### Unassigned Accounts (No device)
```sql
SELECT id, username, status
FROM accounts
WHERE device_id IS NULL OR device_id = '';
```

## Account Status Codes

| Status | Meaning |
|--------|---------|
| logged_in | Device has active session |
| active | Account assigned, session ready |
| offline | Not on any device |
| quarantine | Instagram restricted |
| banned | Account permanently banned |
| session_pending | Awaiting login |
| checkpoint | Verification required |
| failed_login | Login failed, retry needed |
| paused | Intentionally paused |
| profile_setup | Setting up profile |
| device_assigned | Assigned but not activated |

## Device Naming Convention

- **VANTA-XX**: Main fleet (VANTA-01 to VANTA-39)
- **gl-XX**: GeeLark cloud devices (gl-19, gl-24, etc.)
- **UUID**: Other device identifiers (608339415068049487, etc.)

## Audit Rules

1. **One account per session**: Each device_session should have matching account
2. **No concurrent locks**: device_locks should have 0 or 1 row per device_id
3. **Status consistency**: Account status should match device_sessions.session_state when logged in
4. **No orphans**: All device_sessions.account_username should exist in accounts.username
5. **Model coverage**: All accounts should have model_id (2-38 expected)
