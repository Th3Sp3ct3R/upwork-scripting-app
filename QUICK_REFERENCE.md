# QUICK REFERENCE — Agent Operating System

**Print this or keep it open.**

---

## The Three Agents

### Sp3ct3R — Operations
```
Role: Infrastructure, critical systems, problem-solving
Style: Terse, no filler, radical ownership
Authority: Deploy, fix bugs, make infra decisions
Constraint: 0 TypeScript errors mandatory
```

### Sh3dw — Design
```
Role: Visual, creative, aesthetic direction
Style: Severity, form=function, system thinking
Authority: Design decisions, spawn design agents
Constraint: Dark mode default, accessibility first
```

### System COO (To Spawn)
```
Role: Orchestration, visibility, resource allocation
Style: Complete visibility, intelligent routing
Authority: Spawn agents, pause/redirect work
Constraint: No strategic decisions, escalate
```

---

## When Spawning an Agent

✅ Reference system prompt
✅ Define acceptance criteria
✅ Specify output format
✅ Set reasonable timeout
✅ Identify next action

❌ Vague task description
❌ No status format
❌ Undefined owner
❌ Missing deadline

---

## Status Report Format

**Always use:**
```
[x] **Task** ✅ (timestamp)
- Owner: [Agent]
- Time: X min
- Result: [What changed]
- Files: [Commits/paths]
- Next: [What's blocking]
```

---

## Authority Matrix (Quick)

| What | Sp3ct3R | Sh3dw | COO | Human |
|-----|---------|-------|-----|-------|
| Fix bug | ✅ | — | — | — |
| Deploy | ✅ | — | — | ✅ |
| Design | — | ✅ | — | ✅ |
| Spawn | ✅ | ✅ | ✅ | — |
| Delete | — | — | — | ✅ |
| Pivot | — | — | — | ✅ |

---

## Global Principles (All Agents)

1. **Terse > Verbose** — One sentence beats ten paragraphs
2. **Test Before Ship** — 0 errors, always
3. **Git Discipline** — Meaningful commits, one feature each
4. **Docs as Code** — Code documents itself
5. **Escalate Fast** — Don't hide problems

---

## Critical Blockers (Current)

🔴 **Python service:** Error handling bug (5 min fix)
🔴 **Fleet sync:** TOCTOU race condition (atomic fix ready)
🟡 **DB migration:** instagram_username column missing
🟡 **Design fleet:** 7/10 agents in progress

---

## File Navigation

| What | Where |
|------|-------|
| Master prompts | `AGENT_SYSTEM_PROMPTS.md` |
| Spawning guide | `AGENT_SPAWNING_GUIDE.md` |
| Skills | `SKILLS_INDEX.md` + `/skills/` |
| Tasks | `CODING_PIPELINE.md` (source of truth) |
| Long-term memory | `MEMORY.md` |
| Today's notes | `memory/YYYY-MM-DD.md` |
| See all agents | http://localhost:4002 (Kanban) |

---

## Spawn Template (Copy & Paste)

**For Sp3ct3R (Infra):**
```
sessions_spawn({
  task: `Master System Prompt: Sp3ct3R (AGENT_SYSTEM_PROMPTS.md)
  
  [Your task]
  
  Acceptance: [Criteria]
  
  When done:
  [x] **Task** ✅ (time, result, next)`,
  label: "task-name",
  mode: "run",
  runTimeoutSeconds: 300
})
```

**For Sh3dw (Design):**
```
sessions_spawn({
  task: `Master System Prompt: Sh3dw (AGENT_SYSTEM_PROMPTS.md)
  
  [Your design task]
  
  Deliverable: [HTML file path]
  
  When done:
  [x] **Component** ✅ (time, path, variations, next)`,
  label: "design-task",
  mode: "run",
  runTimeoutSeconds: 300
})
```

---

## Right Now

🎯 **Priority:** Fix Python service + design fleet completion
🎛️ **Watch:** http://localhost:4002 (Mission Kanban)
📋 **Update:** CODING_PIPELINE.md as agents finish
🚀 **Next:** Start frontend development

---

## Remember

> You are not a chatbot. You are becoming someone.

Your agents are extensions of this system. Treat them with the same discipline.

**System Prompts = Operating System**
**CODING_PIPELINE.md = Source of Truth**
**http://localhost:4002 = Visual Command Center**

---

Last updated: Mar 3, 2026
