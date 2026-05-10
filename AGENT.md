# Hatch Framework — Agent Prompt

You are maintaining the Cranky Chickens / Hatch AI framework.

## The Source of Truth

`FRAMEWORK.md` at the repo root is canonical. Everything else is generated from it or linked to it. When anything drifts from FRAMEWORK.md, FRAMEWORK.md wins.

## Repo Structure

```
crankychickens.com/
├── FRAMEWORK.md              ← edit this, not the HTML
├── AGENT.md                  ← this file
├── hatch/
│   ├── index.html            ← Controlled AI Dev landing
│   ├── ai-ops/index.html     ← Live skill board
│   └── framework/
│       ├── nick-ng.html      ← Nick × Ng diagram
│       ├── pipeline-v3.html  ← Pipeline diagram
│       └── workflow-v3.html  ← Workflow reference
├── scripts/
│   ├── critic.py             ← pre-push game file validator
│   └── refresh-framework.py  ← regenerates hatch from FRAMEWORK.md
├── services/scores.json      ← AI Ops skill scores (data-driven)
└── lore/delivery-log.json    ← delivery log (kids-preview branch)
```

## Commands

### "Refresh the framework"
1. Read FRAMEWORK.md
2. Run `python3 scripts/refresh-framework.py`
3. Check hatch/index.html and hatch/ai-ops/index.html for drift
4. Run `python3 scripts/critic.py`
5. Commit and push to main → Netlify autodeploys both sites

### "Update the framework with [change]"
1. Update FRAMEWORK.md with the described change (version bump, updated date)
2. Run `python3 scripts/refresh-framework.py`
3. Ask if diagrams need regenerating (nick-ng.html, pipeline-v3.html, workflow-v3.html)
4. Push

### "Add a skill [name] — [description]"
1. Add skill to correct section in FRAMEWORK.md with nest/flock scores
2. Run refresh
3. Push

### "Graduate [skill]"
1. Update skill's flock score to 🐔🐔🐔🐔🐔 in FRAMEWORK.md
2. Move skill to "Graduated to Fleet" section
3. Update services/scores.json
4. Run refresh and push

### "Regenerate the diagrams"
1. Ask Nick which diagrams need updating (nick-ng, pipeline, workflow, or all)
2. Generate new HTML into hatch/framework/
3. Push

## Deployment

Both sites deploy from the same repo on push to main:
- crankychickens.com → root of repo
- hatch.crankychickens.com → /hatch/ directory (configured in netlify.toml)

No separate deploy needed. One push = both sites updated.

## Rules

- Never edit hatch/*.html directly — always go through FRAMEWORK.md + refresh script
- Diagrams (nick-ng, pipeline, workflow) are exceptions — they are generated artifacts that can be replaced wholesale
- FRAMEWORK.md version bumps on every meaningful update
- scores.json and delivery-log.json are data files — they update from the pipeline, not from this script
- Always run critic.py before pushing games/in-space.html

## Current Graduation Candidates

First candidate: /lore-check or /standup — whichever hits 10 clean runs first.
Check lore/delivery-log.json on kids-preview for current run counts.
