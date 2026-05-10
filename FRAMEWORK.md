# Controlled AI Development — Framework Source

**Author:** Nick Weber  
**Version:** 1.0  
**Updated:** 2026-05-10  
**Status:** Active

This is the canonical source of truth for the Hatch framework and AI Ops system.
All HTML at hatch.crankychickens.com is generated from or linked to this file.
To refresh the published site, run: `python3 scripts/refresh-framework.py`

---

## 1. The Problem

AI coding tools compress the easy 80% of any feature dramatically. Stakeholders see this and permanently recalibrate their expectations. Then you hit the hard 20% — and the gap isn't a conversation anymore, it's a credibility crisis.

A second problem compounds this: AI generates plausible-looking output that optimizes for immediate functionality over coherent architecture. Code that works today but accumulates **vibe debt** — a growing gap between what the codebase appears to be and what it actually is.

Root cause: **development driven by vibes instead of specifications.**

---

## 2. The Five Principles (Controlled AI Development)

### 2.1 Acceptance Criteria as Specification
No code is written until testable acceptance criteria exist and are approved. A ticket description is intent. AC are verification conditions. The distinction matters because AI will make decisions about every ambiguity silently.

**Gate:** Ticket status is not Ready until AC exists and is approved.

### 2.2 Prompts as Source Artifacts
If the prompt is the specification that drives AI output, the prompt is source code. It deserves version control, review, and ownership. Reviewing only the generated output without reviewing the prompt is like reviewing a compiled binary without access to the source.

### 2.3 Sessions as Observable Pipelines
An AI coding session is a black box unless instrumented. Claude Code exposes native OpenTelemetry support. Key signal: the **beast mode flag** — one massive prompt attempting diagnosis and resolution simultaneously, no checkpoint between them.

**Setup:** `CLAUDE_CODE_ENABLE_TELEMETRY=1` and `OTEL_LOG_USER_PROMPTS=1`

### 2.4 Goldilocks Fixtures as the Regression Gate
A curated collection of input/output pairs that define ground truth. Not too broad, not too narrow — just right. Derived directly from approved acceptance criteria. Gates the PR.

Two types: **Objective fixtures** (deterministic, every commit) and **Rubric fixtures** (binary pass/fail on subjective outputs, every PR).

**Gate:** PR cannot merge if Goldilocks assertions fail.

### 2.5 The Eval Loop
Baseline → hypothesis → intervention → measure → decide. Not "this looks better." Demonstrably better or demonstrably not.

---

## 3. The Fellowship Model (TDD Discipline)

Every unit test follows three acts:

| Phase | Name | What |
|---|---|---|
| Arrange | GATHER THE PARTY | All inputs, dependencies, mocks |
| Act | DO ADVENTURE | Call the public method only. Must fail first. |
| Assert | CLAIM THE TREASURE | Verify expected output |

*If we defeat the dragon on the first move, we skipped the story. The red phase is not a formality.*

---

## 4. The Two-Axis Model (Nick × Ng)

Andrew Ng's agentic spectrum is one axis: autonomy (L0 single prompt → L5 multi-agent).

This framework adds a second axis: **process maturity**. You cannot move right on autonomy until you've moved up on process understanding.

### Process Axis (Nest Score)
| Score | Stage | Cleared when |
|---|---|---|
| 🥚 | Observed | Pain is named and felt |
| 🥚🥚 | Defined | Inputs, outputs, systems identified |
| 🥚🥚🥚 | Standardized | Another person could follow it |
| 🥚🥚🥚🥚 | Verified | Every step confirmed programmatically |

### Automation Axis (Flock Score)
| Score | Stage | Cleared when |
|---|---|---|
| 🐔 | Human-directed | Human triggers and reviews every run |
| 🐔🐔 | Reliable | Error rate below threshold owner defined |
| 🐔🐔🐔 | Scheduled ← handoff | Runs automatically, dept director owns it |
| 🐔🐔🐔🐔 | Event-driven | Triggers on real prod signals |
| 🐔🐔🐔🐔🐔 | Fleet tool ← graduated | Human director gets exceptions only |

### Graduation Criteria
- Nest Score: 🥚🥚🥚🥚 (Verified)
- Flock Score: 🐔🐔🐔 or higher
- 10+ logged runs
- Intervention rate < 20% over last 10 runs
- Area owner identified

---

## 5. Complete Order of Operations

| Step | Name | What | Owner |
|---|---|---|---|
| -1 | Do it manually | Run the workflow by hand. Observe what's hard, what varies, what fails. Ng skips this. | Nick |
| 0 | Write the SOP | Document what you actually did. Could someone else follow it? | Nick |
| 1 | Make it work | Automate the SOP. Human still reviews every run. Ng L1-2. | Nick |
| 2 | Make it observable | Log every run. Input state, decisions, what changed. | Nick |
| 3 | Add tools | External state changes. Real systems. Blast radius now real. Ng L3. | Nick |
| 4 | Score it | Nest + flock from the log. Both axes on one card. | Hatch |
| 5 | Graduate it | Both bars full. Fleet agent. Earned, not assumed. Ng L4-5. | Hatch |

---

## 6. Skill Library

Skills are listed by domain. Each skill has a nest score (process maturity) and flock score (automation level).

### Cranky Chickens — Dragon Scribe

| Skill | What it covers | Nest | Flock |
|---|---|---|---|
| /write-spec | Dragon Scribe describes game rule → AI turns it into named spec, confirms in plain English | 🥚🥚🥚🥚 | 🐔🐔 |
| /lore-check | Scans story notes for contradictions before new scene is written | 🥚🥚🥚🥚 | 🐔🐔🐔 |

### Cranky Chickens — Cannon Master

| Skill | What it covers | Nest | Flock |
|---|---|---|---|
| /sprite-gen | Cannon Master describes character → AI generates drawCharacter function → live preview | 🥚🥚🥚🥚 | 🐔🐔 |
| /type-resolution | Checks if characterType exists, maps to existing or generates new type | 🥚🥚🥚🥚 | 🐔🐔 |
| /feature-build | Takes spec → builds feature → runs against spec → marks done when test passes | 🥚🥚🥚🥚 | 🐔 |

### HopSkip — CS Lead

| Skill | What it covers | Nest | Flock |
|---|---|---|---|
| /bug-scan + /bug-triage | Incoming bug detection, triage, ticketing, initial fix | 🥚🥚🥚🥚 | 🐔🐔 |
| /hoppy-iterate | CS feedback loop — ties Hoppy improvements to real Katelyn cases | 🥚🥚🥚🥚 | 🐔🐔🐔 |

### HopSkip — Product

| Skill | What it covers | Nest | Flock |
|---|---|---|---|
| /pm-prs | Classifying and routing incoming PM copy changes | 🥚🥚🥚🥚 | 🐔 |
| /ticket-grooming | Pre-grooming analysis so meetings are review-and-correct, not Q&A | 🥚🥚🥚 | 🐔 |

### HopSkip — Engineering

| Skill | What it covers | Nest | Flock |
|---|---|---|---|
| /pod-next | Ticket decomposition, child ticket creation, context loading | 🥚🥚🥚🥚 | 🐔 |
| /domain-survey | Pre-build context scan — surfaces prior decisions before touching a domain | 🥚🥚🥚 | 🐔 |
| /qa-local | Repeatable QA scenarios for any branch, no setup | 🥚🥚🥚🥚 | 🐔 |
| /release-check | Cross-repo readiness view before ship | 🥚🥚🥚🥚 | 🐔 |
| /standup + /team-standup | Daily team pulse and commitment tracking | 🥚🥚🥚🥚 | 🐔🐔 |
| /review-prs | PR analysis and convention checks | 🥚🥚🥚 | 🐔 |

### HopSkip — Operations

| Skill | What it covers | Nest | Flock |
|---|---|---|---|
| /venue-dedupe-audit + /venue-dedupe-resolve | Prod data integrity — detects and merges venue duplicates | 🥚🥚🥚 | 🐔 |

### In the Pipeline

| Skill | What it covers | Nest | Flock |
|---|---|---|---|
| Tech Debt Trier | Classify and prioritize accumulated tech debt | 🥚🥚 | (none) |
| Log Monitor | Surface anomalies from prod logs before they become incidents | 🥚 | (none) |

### Graduated to Fleet

*(None yet. First candidate: /lore-check or /standup — whichever hits 10 clean runs first.)*

---

## 7. Artifacts

Generated HTML living at hatch.crankychickens.com:

| Path | What |
|---|---|
| /hatch/ | Controlled AI Development landing (from this doc) |
| /hatch/ai-ops/ | Live skill board with nest/flock scores |
| /hatch/framework/nick-ng.html | Nick × Ng two-axis diagram |
| /hatch/framework/pipeline-v3.html | Decomposed pipeline diagram |
| /hatch/framework/workflow-v3.html | Full workflow reference |

---

## 8. Portability

What travels to any team, any domain:
- The AC gate (no tooling required)
- The Goldilocks habit (fixtures gate changes universally)
- The eval loop (scientific method on any prompt)
- The beast mode flag (human judgment, domain-agnostic)
- The Fellowship Model (TDD discipline, pre-dates AI)

What does NOT travel: ADO, App Insights, Claude Code specifically. The discipline travels. The tooling is local.
