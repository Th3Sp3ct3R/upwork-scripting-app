# SKILLS_INDEX — Complete OpenClaw Skills Manifest

**Total:** 59 skills | **Location:** `/Users/growthgod/.openclaw/workspace/skills/`

Last updated: Mar 3, 2026

---

## 🔐 AUTHENTICATION & SECURITY

- **1password** — Apple 1Password vault access
- **clawhub** — Search, install, publish skills
- **skill-creator** — Build + package new skills

---

## 📝 NOTE TAKING & PRODUCTIVITY

- **apple-notes** — Apple Notes app integration
- **apple-reminders** — Apple Reminders task management
- **bear-notes** — Bear note-taking app
- **obsidian** — Obsidian vault access (markdown notes)
- **notion** — Notion database API access
- **things-mac** — Things 3 task manager
- **trello** — Trello board management

---

## 💬 COMMUNICATION

- **discord** — Discord chat, messages, reactions
- **imsg** — iMessage/Apple Messages
- **bluebubbles** — Android message relay
- **slack** — Slack integration (already in use)

---

## 🎨 MEDIA & CONTENT CREATION

- **openai-image-gen** — Generate images with DALL-E
- **openai-whisper** — Speech to text transcription
- **openai-whisper-api** — Whisper API wrapper
- **sag** — Text-to-speech (ElevenLabs) — **IN USE**
- **sherpa-onnx-tts** — Open-source TTS — **IN USE**
- **video-frames** — Extract frames from video — **IN USE**
- **video-transcript-downloader** — YouTube video/transcript download — **IN USE**
- **gifgrep** — Search + download GIFs
- **songsee** — Music/song information lookup

---

## 🌐 BROWSER & SCREENSHOTS

- **browser-use** — Web browser automation — **IN USE**
- **canvas** — Canvas rendering + export
- **camsnap** — Camera + screenshot capture
- **claude-chrome** — Claude with Chrome extension relay
- **peekaboo** — Screenshot tool
- **xurl** — URL utilities

---

## 💻 DEVELOPER TOOLS

- **github** — GitHub CLI integration — **IN USE**
- **gh-issues** — GitHub Issues management
- **vercel-deploy** — Deploy to Vercel — **IN USE**
- **model-usage** — Track LLM costs + usage
- **coding-agent** — Codex/Claude Code/OpenCode/Pi agent — **IN USE**
- **eightctl** — Mac system control
- **tmux** — tmux session remote control — **IN USE**
- **healthcheck** — Security audit + hardening — **IN USE**

---

## 🔧 DATA & INFRASTRUCTURE

- **nano-pdf** — PDF processing + generation
- **nano-banana-pro** — Banana ML inference
- **himalaya** — Terminal email client
- **mcporter** — Protocol port forwarding
- **ordercli** — Order/inventory management
- **session-logs** — Session history tracking
- **summarize** — Text summarization
- **goplaces** — Apple Maps + location data
- **blogwatcher** — Monitor blogs for new posts

---

## 🎮 ENTERTAINMENT & GAMING

- **gog** — GOG game library access
- **oracle** — Content curation/discovery
- **spotify-player** — Spotify playback control
- **sonoscli** — Sonos speaker control
- **openhue** — Philips Hue light control
- **wacli** — Apple Watch control

---

## 🛠️ VANTA INSTAGRAM FLEET (Custom)

- **vanta-fleet-audit** — Instagram account audit + repair — **CUSTOM**
- **firecrawl** — Web scraping + crawling — **CUSTOM**

---

## 🔍 SPECIAL/OBSERVABILITY

- **openclaw-watchdog** — Service health monitor
- **blucli** — Bluetooth CLI control
- **gemini** — Gemini API integration
- **weather** — Weather forecasts

---

## Usage

To use a skill, import it in your code:

```typescript
import { readSkillPath } from '@openclaw/tools'
const skillPath = readSkillPath('notion'); // /Users/growthgod/.openclaw/workspace/skills/notion
```

Or reference in task descriptions:

```
See SKILL.md for: /Users/growthgod/.openclaw/workspace/skills/{skill-name}/SKILL.md
```

---

## Currently Using (Marked ✅)

- **IN USE:** browser-use, canvas, claude-chrome, coding-agent, firecrawl, github, healthcheck, sag, sherpa-onnx-tts, skill-creator, tmux, vercel-deploy, video-frames, video-transcript-downloader
- **VANTA:** vanta-fleet-audit

---

## Recommended Next

For instagrowth-saas MVP:
1. **notion** — Store customer data + reports
2. **openai-image-gen** — Generate post images
3. **openai-whisper** — Auto-caption videos
4. **nano-pdf** — Export growth reports
5. **discord** — Alert system for milestones
6. **model-usage** — Track API spend

