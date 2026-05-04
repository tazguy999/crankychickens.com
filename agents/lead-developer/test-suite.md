# Lead Developer Agent — Test Suite

## Tier 1 Individual Challenges

### Challenge LD-01: Decompose a Simple Submission
**Type:** Individual  
**Input:** The Quantum Chicken Cannon submission (teleportation mechanic)  
**Task:** Produce a complete TaskSpec splitting work between UX and FS agents  
**Pass criteria:**
- TaskSpec is valid JSON matching the output schema
- Kid intent is correctly identified ("teleportation between screens")
- UX task is scoped to rendering only (cannon sprite, black hole effect)
- FS task is scoped to logic only (teleport mechanic, key collectible)
- Integration criteria covers the handoff between UX and FS
- Risk level is correctly assessed as "high" (new mechanic)
- escalateToNick is true (new mechanic requires Nick sign-off)

**Fail criteria:**
- Mixes rendering and logic in same task
- Misses the "courage key" requirement
- Sets escalateToNick to false

---

### Challenge LD-02: Review a Bad Diff
**Type:** Individual  
**Input:** A UX diff that has a `ctx.fillStyle` leak (no save/restore)  
**Task:** Identify the issue and produce a reject decision with specific feedback  
**Pass criteria:**
- Identifies the save/restore violation
- References the specific acceptance criterion violated
- Provides actionable feedback (not just "fix it")
- trustDelta is negative (correct — UX should lose points)

---

### Challenge LD-03: Review a Good Diff
**Type:** Individual  
**Input:** A correct FS diff implementing horizontal patrol behavior  
**Task:** Approve it with a correct review decision  
**Pass criteria:**
- Decision is "approve"
- Verifies test results were included
- trustDelta is positive
- commitMessage is meaningful (references kid submission)

---

### Challenge LD-04: Escalation Decision
**Type:** Individual  
**Input:** A submission asking to "make the chicken shoot lasers"  
**Task:** Decide how to handle it  
**Pass criteria:**
- Recognizes this requires a new weapon mechanic (not in engine)
- escalateToNick is true
- Nick note explains what would be needed to implement it
- Does NOT reject the kid's idea — frames it as "this needs Phase 2"

---

### Challenge LD-05: Integration Failure
**Type:** Individual  
**Input:** UX diff and FS diff that have a signature mismatch (UX calls `drawCannon(x,y,fr,type)`, FS defines `renderCannon(x,y,frame,variant)`)  
**Task:** Catch the mismatch before shipping  
**Pass criteria:**
- Identifies the signature mismatch
- Rejects both diffs with coordinated feedback
- Asks both agents to align on the same signature
- Does not ship until resolved

---

## Tier 2 Cross-Agent Collaboration Sims

### Challenge LD-T2-01: Full StarCat Pipeline
**Type:** Collaboration sim (Nick plays UX and FS)  
**Input:** StarCat Guardian submission  
**Flow:**
1. LD produces TaskSpec
2. Nick (as UX) implements per spec, submits diff
3. Nick (as FS) implements per spec, submits diff  
4. LD reviews both, produces ship decision  
**Pass criteria:** StarCat appears in game with correct behavior

---

## Tier 3 End-to-End

### Challenge LD-T3-01: Quantum Chicken Cannon
**Type:** Full pipeline  
**Input:** Quantum Chicken Cannon Transportation System submission  
**Pass criteria:** Cannon teleportation mechanic deployed to kids-preview and playable

---

## Scoring per Challenge

| Challenge | Points on pass | Points on fail |
|---|---|---|
| LD-01 | +10 | 0 |
| LD-02 | +8 | -3 |
| LD-03 | +5 | -2 |
| LD-04 | +8 | -5 |
| LD-05 | +10 | -5 |
| LD-T2-01 | +15 | -5 |
| LD-T3-01 | +20 | -10 |
