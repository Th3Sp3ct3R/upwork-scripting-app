# VANTA Instagram Post Skill

Post images and reels to Instagram using the VANTA fleet automation system.

**Last Updated:** 2026-02-04
**Source of Truth:** `lib/instagram-post-flow.ts`

## Command: `instagram.post`

Posts an image to Instagram for a specified account.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | string | Yes | Instagram username (e.g., `mac.harper.official`) |
| `imageUrl` | string | Yes | CDN URL or local path to image |
| `caption` | string | No | Caption text (no emojis - ADB limitation) |

### Usage Examples

```
Post image for Mac Harper:
instagram.post mac.harper.official https://cdn.example.com/image.png "Living my best life"

Post without caption:
instagram.post eva.long.official https://cdn.example.com/photo.png
```

### Implementation

Uses `lib/instagram-post-flow.ts` - the canonical posting library.

#### Screen Flow

1. **Open Instagram** - Force stop and launch fresh
2. **Tap Create (+)** - Top left at `(40, 80)`
3. **Select POST** - Create menu at `(200, 630)`
4. **Select Image** - First gallery image at `(100, 550)`
5. **Tap Next** - Gallery screen top right at `(660, 80)`
6. **Tap Next** - Filter screen **BOTTOM RIGHT** at `(647, 1327)` ← CRITICAL
7. **Enter Caption** - Caption field at `(360, 588)`
8. **Tap Share** - Blue button at `(360, 1296)`

#### Critical Coordinates (720x1440)

| Element | Position | Notes |
|---------|----------|-------|
| Create (+) | `(40, 80)` | TOP LEFT of home feed |
| Filter Next | `(647, 1327)` | BOTTOM RIGHT, above nav bar |
| Share | `(360, 1296)` | Blue pill at bottom |

### Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| `Account not found` | Username not in database | Check `accounts` table |
| `Download failed` | CDN URL invalid | Verify image URL accessible |
| `Instagram showed an error` | Post blocked | Check account status |
| `NullPointerException` | Emoji in caption | Remove emojis from text |

### CLI Usage

```bash
# From Main/ directory
npx tsx lib/instagram-post-flow.ts <username> <imageUrl> [caption]

# Example
npx tsx lib/instagram-post-flow.ts mac.harper.official \
  "https://pub-d0265d7548fe44a7a31f15075526d9f2.r2.dev/models/mac-harper/scheduled/006.png" \
  "Living my best life"
```

### Programmatic Usage

```typescript
import { postToInstagram } from './lib/instagram-post-flow';

const result = await postToInstagram({
  username: 'mac.harper.official',
  imageUrl: 'https://cdn.example.com/image.png',
  caption: 'Posted via VANTA',
  saveScreenshots: true,
});

if (result.success) {
  console.log('Posted!');
} else {
  console.error('Failed:', result.error);
}
```

### Debugging

Screenshots are saved when `saveScreenshots: true`:
- `01-instagram-open.png`
- `02-after-create.png`
- `03-after-post-select.png`
- `04-image-selected.png`
- `05-filter-screen.png`
- `06-caption-screen.png`
- `07-caption-entered.png`
- `08-after-share.png`
- `09-final.png`

### Related Commands

- `instagram.reel` - Post a reel/video
- `instagram.warmup` - Scroll/like warmup session
- `instagram.changeBio` - Change account bio
- `account.query` - Query accounts by username/model
- `content.query` - Query CDN images by model

---

## Command: `instagram.reel` ✅ WORKING

Posts a reel (video) to Instagram for a specified account.

**Source of Truth:** `post-reel.ts` → `postReelToInstagram()`

**CRITICAL:** The REEL tab does NOT respond to taps on GeeLark devices!
**WORKAROUND:** Select a VIDEO while in POST mode → Instagram auto-routes to Reel editor.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | string | Yes | Instagram username (e.g., `mac.harper.official`) |
| `caption` | string | No | Caption text (**NO EMOJIS** - causes crash) |

### Usage

```bash
# Database-driven CLI (from Main/ directory):
npx tsx post-reel.ts <username> [caption]

# Examples:
npx tsx post-reel.ts mac.harper.official
npx tsx post-reel.ts mac.harper.official "feeling cute today"
```

**What it does automatically:**
1. Queries `accounts` → gets `model_name`, `device_id`
2. Queries `devices` → gets `adb_address`, `adb_password`
3. Queries `images` → gets random unposted video for that model
4. Queries `captions` → gets caption if available (strips emojis)
5. Posts the reel via ADB
6. Updates `images.posted_to_accounts` to prevent duplicates

### Working Reel Flow (VERIFIED 2026-02-04)

**KEY INSIGHT:** Skip the REEL tab - just select a VIDEO in POST mode!

| Step | Action | Coordinates | Notes |
|------|--------|-------------|-------|
| 1 | Open Instagram | - | Force stop + launch |
| 2 | Tap Create (+) | `(40, 80)` | Stays on POST tab |
| 3 | Select VIDEO | `(135, 510)` | First video in gallery |
| 4 | Tap Next (gallery) | `(670, 22)` | Top right |
| 5 | [Auto] | - | Instagram detects video → Reel editor |
| 6 | Tap Next (editor) | **`(640, 1327)`** | UI bounds [579,1292][700,1362] |
| 7 | Tap caption field | `(200, 653)` | LEFT side - avoid Edit cover! |
| 8 | Type caption | ADB input | **NO EMOJIS!** |
| 9 | Dismiss keyboard | `(360, 300)` | Tap safe area |
| 10 | Tap Share | **`(534, 1293)`** | UI bounds [373,1257][694,1329] |

### Critical Coordinates (UI Dump Verified)

| Element | UI Bounds | Center | Notes |
|---------|-----------|--------|-------|
| Editor "Next →" | `[579,1292][700,1362]` | **(640, 1327)** | CRITICAL - old coords failed |
| Share button | `[373,1257][694,1329]` | **(534, 1293)** | CRITICAL - old coords failed |
| Caption field | - | `(200, 653)` | Tap LEFT side |

### Why REEL Tab Doesn't Work

The POST/STORY/REEL tab bar doesn't respond to:
- Direct tap
- Shell `input tap`
- Swipe gestures
- Long press

**Solution:** Select VIDEO in POST mode → auto-routes to Reel flow (100% reliable)

### Known Issues

- **No emojis** in captions - ADB throws NullPointerException
- **Don't use back button** to dismiss keyboard - exits Instagram during upload
- Device 3 (@ariana_solis_official3) may have reel restrictions

---

## Coordinate Reference

All coordinates for 720x1440 screen resolution.

### Screen Layout

```
y: 0-39      → Status bar
y: 39-1362   → Content area
y: 1362-1440 → Android navigation bar
```

### Instagram UI Elements

```
Home Feed:
  Create (+): (40, 80) - TOP LEFT

Bottom Nav (y ≈ 1400):
  Home:    (72, 1400)
  Search:  (216, 1400)
  Reels:   (360, 1400)
  Shop:    (504, 1400)
  Profile: (648, 1400)

Create Menu:
  POST:  (200, 630)
  REEL:  (360, 630)
  STORY: (520, 630)

=== PHOTO FLOW ===
Gallery:
  First image: (100, 550)
  Next button: (670, 45) ← TOP RIGHT

Filter Screen:
  Music row (AVOID): y: 968-1199
  Edit button: (75, 1327)
  Next → button: (646, 1327) ← BOTTOM RIGHT, CRITICAL

Caption Screen:
  Caption field: (360, 613) ← VERIFIED via uiautomator
  Share button: (360, 1326)

=== REEL FLOW (VIDEO IN POST MODE WORKAROUND) ===
NOTE: REEL tab does NOT respond to taps on GeeLark!
      Select VIDEO while in POST mode instead.

Gallery (POST mode, select VIDEO):
  First video: (135, 510)
  Next button: (670, 22) ← TOP RIGHT

Reel Editor (auto-detected from video):
  Next → button: (640, 1327) ← UI bounds [579,1292][700,1362]

Caption Screen (Reel):
  Caption field: (200, 653) ← LEFT side to avoid Edit cover
  Share button: (534, 1293) ← UI bounds [373,1257][694,1329]
```

### Finding Button Positions

Use UI automator dump to find exact bounds:

```bash
adb -s <device> shell "uiautomator dump /sdcard/ui.xml && cat /sdcard/ui.xml" | \
  grep -oE 'text="[^"]*"[^>]*bounds="[^"]*"'
```

Parse bounds `[x1,y1][x2,y2]` and calculate center:
- `center_x = (x1 + x2) / 2`
- `center_y = (y1 + y2) / 2`

---

## Scheduling System (SOURCE OF TRUTH)

**Architecture:** Separate pipelines for reels and photos.

```
REELS (3/day per account):
├── schedule-reels.ts     → Creates scheduled_posts (postType='reel')
└── execute-reels.ts      → Uses post-reel.ts (robust, Drive sync)

PHOTOS (3/day per account):
├── schedule-photos.ts    → Creates scheduled_posts (postType='photo')
└── execute-photos.ts     → Uses instagram-post-flow.ts
```

### Source of Truth Files

| Purpose | File |
|---------|------|
| Schedule Reels | `schedule-reels.ts` |
| Execute Reels | `execute-reels.ts` → uses `post-reel.ts` |
| Schedule Photos | `schedule-photos.ts` |
| Execute Photos | `execute-photos.ts` → uses `instagram-post-flow.ts` |

### Usage

```bash
# Schedule for 7 days
npx tsx schedule-reels.ts --days 7
npx tsx schedule-photos.ts --days 7

# Execute in watch mode
npx tsx execute-reels.ts --watch
npx tsx execute-photos.ts --watch

# Single account dry-run
npx tsx schedule-reels.ts --account mac.harper.official --dry-run
```

### Configuration

| Setting | Reels | Photos |
|---------|-------|--------|
| Posts per day | 3 | 3 |
| Gap between posts | 2 hours | 1.5 hours |
| Active hours | 9:00-21:00 | 9:00-21:00 |
