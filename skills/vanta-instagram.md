# VANTA Instagram Fleet Skill

You have access to the VANTA GeeLark fleet for Instagram automation via HTTP API.

**Last Updated:** 2026-02-04

## API Configuration

**Base URL:**
```
http://localhost:3001
```

**Required Headers for POST requests:**
```
Authorization: Bearer 9497b43687eb3b4e3c56bc9a390d0ad38681b40c6f9c4005f88bfc6d63f81946
Content-Type: application/json
```

## Quick Reference - Ready Accounts

| Account | Model | Device | Status | Notes |
|---------|-------|--------|--------|-------|
| @mac.harper.official | Mac Harper | Device 4 | logged_in | Primary test account |
| @eva.long.official | Eva Long | - | logged_in | |
| @hailey.whitmore.official | Hailey Whitmore | - | logged_in | |
| @isabella.marentes.official | Isabella Marentes | Device 2 | logged_in | |
| @ariana_solis_official3 | Ariana Solis | Device 3 | restricted | Reel posting blocked |

## Device Status

| Device | ADB Address | Account | Status |
|--------|-------------|---------|--------|
| Device 3 | 98.98.125.37:21702 | @ariana_solis_official3 | Reel restricted |
| Device 4 | 98.98.125.37:21669 | @mac.harper.official | Fully working |

## Post Photo or Reel (Immediate)

**POST** `/api/schedule/immediate`

Request body:
```json
{
  "username": "mac.harper.official",
  "caption": "Living my best life",
  "imageUrl": "https://pub-d0265d7548fe44a7a31f15075526d9f2.r2.dev/models/mac-harper/scheduled/032.png"
}
```

**Auto-detection:** The `postType` is automatically detected from the URL:
- `.mp4`, `.mov`, `.webm`, `.avi`, `.mkv`, `.m4v` → `reel`
- `.png`, `.jpg`, `.jpeg`, etc. → `photo`

You can override by explicitly passing `"postType": "reel"` or `"postType": "photo"`.

If `imageUrl` is omitted, a random unposted image from the model's content will be used.

**Reel Posting Notes:**
- Some accounts may have reel restrictions (check device status above)
- Device 3 (@ariana_solis_official3) cannot post reels - use photos instead
- Device 4 (@mac.harper.official) works for both photos and reels
- Reels take longer to upload (~20 seconds vs ~15 for photos)

Example curl:
```bash
curl -X POST http://localhost:3001/api/schedule/immediate \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer 9497b43687eb3b4e3c56bc9a390d0ad38681b40c6f9c4005f88bfc6d63f81946' \
  -d '{"username": "mac.harper.official"}'
```

Response:
```json
{
  "success": true,
  "message": "Post scheduled for immediate execution",
  "data": {
    "postId": 123,
    "username": "mac.harper.official",
    "deviceId": "604061352796880970",
    "imageUrl": "https://...",
    "scheduledAt": "2026-02-02T18:00:00.000Z",
    "status": "pending"
  }
}
```

The post will be picked up by the post-executor daemon within 60 seconds.

## Query Accounts

**GET** `/api/schedule/accounts/query`

Query params:
- `username` - partial match
- `modelName` - partial match
- `status` - exact match (logged_in, active, warming, etc.)
- `limit` - max results (default 20)

Example:
```bash
curl "http://localhost:3001/api/schedule/accounts/query?modelName=mac%20harper"
```

## Query Content

**GET** `/api/schedule/content/query`

Query params:
- `modelName` - required, partial match
- `limit` - max results (default 10)
- `unpostedOnly` - true/false (default true)

Example:
```bash
curl "http://localhost:3001/api/schedule/content/query?modelName=mac%20harper&limit=5"
```

## Bulk Schedule Posts

**POST** `/api/schedule/run`

Creates posts for all active accounts for the next N days.

Request body:
```json
{
  "days": 7,
  "postsPerAccountPerDay": 6,
  "activeHoursStart": 9,
  "activeHoursEnd": 21,
  "dryRun": false
}
```

Example:
```bash
curl -X POST http://localhost:3001/api/schedule/run \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer 9497b43687eb3b4e3c56bc9a390d0ad38681b40c6f9c4005f88bfc6d63f81946' \
  -d '{"days": 7, "dryRun": false}'
```

## Check Schedule Stats

**GET** `/api/schedule/stats`

Returns total and today's post counts by status.

## List Scheduled Posts

**GET** `/api/schedule`

Query params: `status`, `accountId`, `deviceId`, `from`, `to`, `limit`

## CDN URLs

All model content is on R2:
- **Base URL**: `https://pub-d0265d7548fe44a7a31f15075526d9f2.r2.dev/`
- **Pattern**: `models/{model-slug}/scheduled/{filename}`

Examples:
- Mac Harper: `models/mac-harper/scheduled/032.png`
- Eva Long: `models/eva-long/scheduled/001.png`

## Example Prompts and Responses

**User says**: "Post something for Mac Harper"
```bash
curl -X POST http://localhost:3001/api/schedule/immediate \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer 9497b43687eb3b4e3c56bc9a390d0ad38681b40c6f9c4005f88bfc6d63f81946' \
  -d '{"username": "mac.harper.official"}'
```

**User says**: "Show me Eva Long's content"
```bash
curl "http://localhost:3001/api/schedule/content/query?modelName=Eva%20Long"
```

**User says**: "Schedule posts for all accounts for a week"
```bash
curl -X POST http://localhost:3001/api/schedule/run \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer 9497b43687eb3b4e3c56bc9a390d0ad38681b40c6f9c4005f88bfc6d63f81946' \
  -d '{"days": 7}'
```

**User says**: "Which accounts are logged in?"
```bash
curl "http://localhost:3001/api/schedule/accounts/query?status=logged_in"
```

**User says**: "Change Mac Harper's bio to 'your sweet neighbor'"
```bash
curl -X POST http://localhost:3001/api/node/invoke \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer 9497b43687eb3b4e3c56bc9a390d0ad38681b40c6f9c4005f88bfc6d63f81946' \
  -d '{"command": "instagram.changeBio", "args": {"username": "mac.harper.official", "newBio": "your sweet neighbor"}}'
```

**User says**: "Update Eva Long's profile bio"
```bash
curl -X POST http://localhost:3001/api/node/invoke \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer 9497b43687eb3b4e3c56bc9a390d0ad38681b40c6f9c4005f88bfc6d63f81946' \
  -d '{"command": "instagram.changeBio", "args": {"username": "eva.long.official", "newBio": "lifestyle | travel | vibes"}}'
```

## Change Bio

**POST** `/api/node/invoke`

Changes an account's Instagram bio.

Request body:
```json
{
  "command": "instagram.changeBio",
  "args": {
    "username": "mac.harper.official",
    "newBio": "your sweet neighbor 💕"
  }
}
```

Example curl:
```bash
curl -X POST http://localhost:3001/api/node/invoke \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer 9497b43687eb3b4e3c56bc9a390d0ad38681b40c6f9c4005f88bfc6d63f81946' \
  -d '{"command": "instagram.changeBio", "args": {"username": "mac.harper.official", "newBio": "your sweet neighbor"}}'
```

Response:
```json
{
  "success": true,
  "username": "mac.harper.official",
  "newBio": "your sweet neighbor",
  "deviceId": "604061352796880970",
  "message": "Bio changed successfully"
}
```

## Change Profile (Full)

**POST** `/api/node/invoke`

Changes multiple profile fields at once. Currently only `bio` is fully implemented.

Request body:
```json
{
  "command": "instagram.changeProfile",
  "args": {
    "username": "mac.harper.official",
    "bio": "new bio text",
    "displayName": "Mac Harper",
    "website": "https://example.com",
    "isPrivate": false
  }
}
```

Note: `displayName`, `website`, `profilePhotoUrl`, and `isPrivate` are not yet fully implemented - only `bio` works reliably.

## Safety Rules

1. Max 6 posts per account per day
2. Captions should be clean - no emojis (ADB doesn't support unicode well)
3. Posts are executed by the post-executor daemon (runs every 60 seconds)
4. Check post status via `/api/schedule?status=pending` or `/api/schedule?status=posted`
5. Avoid Device 3 for reels - use Device 4 (Mac Harper) instead

## Source of Truth

All posting logic is in `lib/instagram-post-flow.ts`:

| Function | Purpose |
|----------|---------|
| `postToInstagram()` | Photo posting |
| `postReelToInstagram()` | Reel/video posting |
| `INSTAGRAM_COORDS` | Photo flow coordinates |
| `REEL_COORDS` | Reel flow coordinates |

### Caption Input (Verified Working)

Caption input via ADB works correctly. Flow:
1. Tap caption field at (360, 613)
2. Wait 1 second for focus
3. Enter text: `adb shell input text "Hello%sWorld"` (spaces = %s)
4. Tap OK or press back to dismiss keyboard

### Key Coordinates (720x1440)

**Photo Posting:**
| Element | Position | Notes |
|---------|----------|-------|
| Create (+) | (40, 80) | Top left |
| POST option | (200, 630) | Create menu |
| Gallery image | (100, 550) | First image |
| Next (gallery) | (670, 45) | Top right |
| Next (filter) | (646, 1327) | **BOTTOM RIGHT** |
| Caption field | (360, 613) | Tap to focus |
| Share | (360, 1326) | Blue pill |

**Reel Posting:**
| Element | Position | Notes |
|---------|----------|-------|
| REEL tab | (300, 628) | POST/STORY/REEL tabs |
| Gallery video | (135, 493) | First video |
| Next (gallery) | (345, 22) | Top right |
| Next (edit) | (620, 1320) | Bottom right |
| Caption field | (360, 623) | Tap to focus |
| Share | (535, 1236) | Blue button |

## Post Flow

1. Call `/api/schedule/immediate` to create pending post
2. Post-executor picks it up within 60 seconds
3. Executor downloads image, pushes to device via ADB
4. Opens Instagram, creates post via UI automation
5. Updates post status to `posted` or `failed`

## Database Connection (for direct queries)

PostgreSQL (Neon):
```
DATABASE_URL=postgresql://neondb_owner:npg_wJ45xvEnZOMu@ep-young-term-ah8ht9vw-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```
