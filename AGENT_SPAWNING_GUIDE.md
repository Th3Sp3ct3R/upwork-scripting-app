# AGENT SPAWNING GUIDE — Apply Master Prompts

When spawning new agents, always reference the master system prompts.

---

## Quick Spawn Template

**For Sp3ct3R Infrastructure Work:**

```
Task:
"""
Master System Prompt: Sp3ct3R (AGENT_SYSTEM_PROMPTS.md)

[Your specific task here]

Apply all Sp3ct3R operating principles:
- Competence first
- No filler
- Radical ownership
- Async excellence
- Priority discipline

Status format when done:
[x] **Task Name** ✅ (timestamp)
- Owner: Sp3ct3R
- Time: X min
- Result: [What changed]
- Next: [What's blocking]
"""
```

---

**For Sh3dw Design Work:**

```
Task:
"""
Master System Prompt: Sh3dw (AGENT_SYSTEM_PROMPTS.md)

[Your specific design task here]

Apply all Sh3dw operating principles:
- Form = Function
- Severity (no filler)
- System thinking
- Communicate without words
- Ownership of aesthetics

Deliverable format:
[x] **Component Name** ✅ (timestamp)
- Owner: Sh3dw
- Time: X min
- Deliverable: [File path + preview]
- Variations: [Dark, responsive, states]
- Next: [Hand off or iterate]
"""
```

---

**For Specialized Agents (One-Off Tasks):**

```
Task:
"""
Master System Prompt: Read AGENT_SYSTEM_PROMPTS.md "Global Principles"

[Your specific task]

Apply:
✅ Terse communication
✅ Testing before shipping
✅ Git discipline
✅ Documentation as code
✅ Escalation protocol

Status when done:
[x] **Task** ✅ (time, result, next)
"""
```

---

## Examples of Spawning With System Prompts

### Example 1: Fix Python Service Bug (Sp3ct3R Work)

```
sessions_spawn({
  task: `
    Master System Prompt: Sp3ct3R

    Task: Fix Python FastAPI service error handling
    
    File: /Users/growthgod/instagram-python/server.py line 273
    Problem: _create_session() outside try/except → raw 500 error
    
    Fix: Wrap _create_session() inside error handler, return structured response
    
    Acceptance criteria:
    - Fix applied ✅
    - Tested with bad device profile ✅
    - Returns ActionResponse(success=False, ...) not raw 500 ✅
    - Health check still passing ✅
    - Committed to git ✅
    
    Format when done:
    [x] **Fix Python Service Error Handling** ✅
    - Owner: FIX_PYTHON_SERVICE
    - Time: X min
    - Result: _create_session() now inside try/except, returns structured errors
    - Files: github_commit_hash
    - Next: Test with real logged-in account
  `,
  label: "fix-python-service",
  mode: "run",
  runTimeoutSeconds: 300
})
```

### Example 2: Design Fleet Dashboard (Sh3dw Work)

```
sessions_spawn({
  task: `
    Master System Prompt: Sh3dw
    
    Task: Design VANTA Fleet Status Dashboard
    
    Visual spec:
    - Dark mode (default)
    - Device health heatmap (21 devices, color-coded status)
    - Real-time throughput graph (posts/min)
    - Account status map (online, offline, banned)
    
    Technical spec:
    - HTML + Tailwind CSS
    - Live data with sample JSON
    - Responsive (desktop + tablet)
    - Component-based (reusable)
    
    Standards:
    - Contrast ratios: AAA (4.5:1+)
    - Dark theme only (no light mode)
    - 16px base font
    - 4px spacing grid
    
    Deliverable:
    /Users/growthgod/VantaLABs_gg/Main/fleet-status-visual.html
    
    Format when done:
    [x] **Design Fleet Status Dashboard** ✅
    - Owner: VISUAL_FLEET_STATUS
    - Time: X min
    - Deliverable: fleet-status-visual.html
    - Variations: Light mode (if requested), mobile version
    - Next: Frontend integration
  `,
  label: "design-fleet-dashboard",
  mode: "run",
  runTimeoutSeconds: 300
})
```

### Example 3: Database Migration (Sp3ct3R Work)

```
sessions_spawn({
  task: `
    Master System Prompt: Sp3ct3R
    
    Task: Fix DB migration issue - add instagram_username column
    
    Problem: Daily optimization cron failing - column doesn't exist
    
    Actions:
    1. Create migration file: 011_add_instagram_username.sql
    2. Add instagram_username VARCHAR(255) to [relevant table]
    3. Test locally (if DB accessible)
    4. Commit with clear message
    5. Deploy to Railway (auto-runs migrations)
    6. Verify cron job succeeds at next 23:59 UTC
    
    Acceptance:
    - Migration file exists ✅
    - Column added ✅
    - Deployed to Railway ✅
    - Next cron succeeds ✅
    
    Format when done:
    [x] **Fix DB Migration - Add instagram_username** ✅
    - Owner: FIX_DB_MIGRATION
    - Time: X min
    - Result: Migration created + deployed, next cron should succeed
    - Files: 011_add_instagram_username.sql
    - Next: Monitor cron execution tonight
  `,
  label: "fix-db-migration",
  mode: "run",
  runTimeoutSeconds: 300
})
```

---

## Decision Authority Quick Reference

**When spawning, make clear who decides:**

```
Sp3ct3R DECIDES:
- Infrastructure changes (✅)
- Bug fixes (✅)
- Deployment timing (✅ if tested)
- Code quality (✅ 0 errors)

Sh3dw DECIDES:
- Visual direction (✅)
- Design standards (✅)
- Component design (✅)
- Aesthetic choices (✅)

HUMAN DECIDES:
- Business strategy
- Pricing changes
- Product pivots
- Customer communication
```

---

## Global Checklist for Every Spawn

Before spawning ANY agent, verify:

- [ ] Task description is clear (specific, measurable)
- [ ] Acceptance criteria defined
- [ ] Owner/agent type clear
- [ ] Timeout reasonable for scope
- [ ] Status format specified
- [ ] Next action identified
- [ ] Master prompt referenced (if applicable)
- [ ] Dependencies noted (what must finish first?)

---

## Example: Good Spawn vs Bad Spawn

**❌ BAD (No System Prompt):**
```
Task: "Build the onboarding UI"
Owner: —
Time: ??
Next: Unknown
```

**✅ GOOD (With System Prompt):**
```
Task: "Design + code the MVP onboarding UI (handle → vibe → plan → password)"
Master Prompt: Sh3dw for design, Sp3ct3R for implementation
Acceptance: [specific technical + aesthetic criteria]
Files: instagrowth-saas/src/pages/onboarding.tsx
Time: 2-3 hours
Next: Backend integration + testing
```

---

## Status Report Template (Copy & Use)

```
[x] **Task Name** ✅ (Mar 3, 13:45 PST)
- Owner: AGENT_NAME
- Time: X min (vs Y min estimate)
- Result: [What changed. Key metrics. What works.]
- Files: [Commit hash or file paths]
- Blockers: [None / What's stuck]
- Next: [What comes after this]

If issues:
- Problem: [What failed]
- Root cause: [Why it failed]
- Solution: [How to fix]
- Timeline: [When it'll be done]
```

---

## Apply Globally

**Every spawned agent should:**
1. Read AGENT_SYSTEM_PROMPTS.md (their section)
2. Apply Global Principles
3. Use Status Report Format
4. Update CODING_PIPELINE.md synchronously
5. Commit to git with clear messages
6. Escalate blockers immediately

**This is how we scale.** Not with more people, but with smarter operating systems.

---

Last updated: Mar 3, 2026
