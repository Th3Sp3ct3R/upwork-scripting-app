# CLAUDE.md — Claude Code + LM Studio Configuration

**Status:** ✅ Configured (Mar 3, 2026)

## Current Setup

Claude Code (Codex, Cursor, Claude Code) is configured to use **LM Studio local models** instead of Anthropic API.

```
Claude Code
  ↓
LM Studio (http://localhost:1234)
  ├── Primary: qwen/qwen3.5-9b (9B, 128k context)
  └── Fallback: google/gemma-3-4b (4B, lighter)
```

## Configuration Files

### ~/.claude/settings.json
```json
{
  "ANTHROPIC_BASE_URL": "http://localhost:1234",
  "ANTHROPIC_AUTH_TOKEN": "lmstudio"
}
```

✅ **Already set** (Mar 3, 2026, 01:20 PST)

### ~/.openclaw/openclaw.json
```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "lmstudio/qwen/qwen3.5-9b"
      }
    }
  }
}
```

✅ **Already set** — All OpenClaw agents use Qwen 3.5 by default

---

## Using Claude Code

### Default (Uses Qwen 3.5)
```bash
claude
# Routes to LM Studio, uses qwen3.5-9b
```

### Specific Model
```bash
claude --model qwen/qwen3.5-9b
# Explicitly use Qwen 3.5 9B

claude --model google/gemma-3-4b
# Use Gemma 3 4B (lighter, faster)
```

---

## LM Studio Status

### Required
- **LM Studio running** at http://localhost:1234
- **API server enabled** (not just GUI)
- Model loaded in context

### How to Start LM Studio
```bash
# LM Studio (GUI) — usually in Applications or homebrew
open -a "LM Studio"

# Or if installed via brew:
lm-studio start-server
```

### Check Health
```bash
curl http://localhost:1234/v1/models
# Should return list of loaded models
```

---

## Available Models

**Currently Loaded:**
- `qwen/qwen3.5-9b` — Primary (fast, smart, 128k context)
- `google/gemma-3-4b` — Fallback (lighter, 8k context)
- `text-embedding-nomic-embed-text-v1.5` — Embeddings

**To Load Others:**
1. Open LM Studio GUI
2. Search model library
3. Download (Hugging Face model)
4. Load to context

---

## Why Local Models?

**Advantages:**
- ✅ No API costs
- ✅ No rate limits
- ✅ Privacy (code stays local)
- ✅ Fast (on-device inference)
- ✅ Full control

**Tradeoffs:**
- ⚠️ Slower than cloud (GPU-dependent)
- ⚠️ Requires LM Studio running
- ⚠️ Limited to loaded context (usually 8-128k)
- ⚠️ Quality varies by model

---

## Reverting to Anthropic

If LM Studio goes offline:

```bash
# Remove or comment out in ~/.claude/settings.json
# "ANTHROPIC_BASE_URL": "http://localhost:1234",
# "ANTHROPIC_AUTH_TOKEN": "lmstudio",
```

Claude Code will fall back to Anthropic API automatically.

---

## For Agents

**Sp3ct3R & Sh3dw:**
- Both use `lmstudio/qwen/qwen3.5-9b` by default
- Config: `~/.openclaw/openclaw.json` agents.defaults.model
- Override per-session: `model=gemma` (alias in config) or `model=lmstudio/google/gemma-3-4b` (full)

**Claude Code (Codex, Cursor, etc.):**
- Uses `ANTHROPIC_BASE_URL` → LM Studio
- Automatically routes all API calls to localhost:1234
- New sessions pick up config changes

---

## Performance Notes

- **Qwen 3.5 9B:** ~200-500ms per token (M1/M2 GPU)
- **Gemma 3 4B:** ~100-300ms per token (faster, lower quality)
- **Context limit:** 128k for Qwen, varies for others
- **Temperature:** Default 0.7 (can adjust per request)

---

## Troubleshooting

### "Failed to connect to localhost:1234"
```bash
# Check if LM Studio is running
curl http://localhost:1234/v1/models
# Should return JSON, not error

# If not running:
open -a "LM Studio"
# Then wait 10-30s for server to start
```

### "Model not found"
```bash
# List available models
curl http://localhost:1234/v1/models | jq '.data[].id'

# Load a model in LM Studio GUI if needed
```

### Claude Code still using Anthropic
```bash
# Verify settings file
cat ~/.claude/settings.json | grep ANTHROPIC

# If missing, add:
# "ANTHROPIC_BASE_URL": "http://localhost:1234",
# "ANTHROPIC_AUTH_TOKEN": "lmstudio",

# New session required (close + reopen Claude Code)
```

---

## Related Files

- `~/.openclaw/openclaw.json` — Agent model defaults
- `MEMORY.md` — Long-term configuration notes
- `TOOLS.md` — Local development setup
- `SOUL.md` — Agent personality (uses these models)

---

**Last Updated:** March 3, 2026 @ 01:20 PST  
**Status:** ✅ All agents routing to LM Studio
