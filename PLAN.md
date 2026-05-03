# Cranky Chickens: Mission Control — Build Plan

## The Vision
A remote collaborative game development system letting two kids contribute to Cranky Chickens: In Space from their Amazon Fire tablets, with changes previewing live before touching production.

---

## The Team

| Role | Person | Vibe |
|---|---|---|
| Engineering Lead | Nick | Reviews PRs, merges to main |
| Build System | Claude | Translates ideas to code |
| Cannon Master | 8yo nephew | Chaos, spectacle, ballistics, Angry Birds lore |
| Dragon Scribe | 11yo niece | Narrative, lore, Warriors/Wings of Fire/Harry Potter energy |
| On-site Facilitator | Sister-in-law | Manages tablets, loves the project |

---

## Deployment Architecture

```
main branch → crankychickens.com (PROTECTED — always live)
kids-preview branch → kids-preview--crankychickens.netlify.app (~30 sec deploy)
```

### Flow
```
Cannon Master submits (drawing/photo/text/emoji)
        ↓
Claude interprets submission (multimodal)
        ↓
Dragon Scribe reviews + refines in her workshop
        ↓
Claude generates game change
        ↓
Auto-commits to kids-preview branch
        ↓
Netlify deploys preview URL (~30 sec)
        ↓
Kids see their change live on tablets
        ↓
Nick gets PR notification → reviews → merges to main
```

---

## The Interfaces

### 1. cannon-master.html
**URL:** `crankychickens.com/cannon-master.html`
**Device:** Amazon Fire tablet, portrait-first
**Aesthetic:** Angry Birds slingshot energy, big chaos, explosions

**Features:**
- [ ] Giant touch targets — no reading required
- [ ] Finger drawing canvas
- [ ] Photo upload (draw on paper → snap → upload)
- [ ] Emoji/picture reactions to current game elements
- [ ] One big FIRE 💥 button to submit
- [ ] Submissions go to Dragon Scribe's inbox

**Input methods (Fire tablet safe):**
- Touch drawing canvas ✅
- File upload from camera roll ✅
- Big emoji tap buttons ✅
- Text (optional, large keyboard) ✅

---

### 2. dragon-scribe.html
**URL:** `crankychickens.com/dragon-scribe.html`
**Device:** Amazon Fire tablet, portrait-first
**Aesthetic:** Ancient tome, dragon council, Warriors/Wings of Fire energy

**Features:**
- [ ] Inbox — sees brother's raw submissions with Claude's interpretation
- [ ] Chat-style Claude interface to refine ideas
- [ ] Lore tools — name characters, write backstory, describe enemies
- [ ] Live preview of the proposed change
- [ ] CAST THE SPELL 🐉 button — commits to kids-preview branch
- [ ] Netlify preview URL shown after cast

---

### 3. Nick's Review Flow
- GitHub PR auto-created from kids-preview → main
- Netlify preview URL in the PR
- Merge to deploy to production

---

## Device Constraints (Amazon Fire / Silk Browser)

| Feature | Status | Notes |
|---|---|---|
| Touch / big buttons | ✅ Works great | Min 60px tap targets |
| Finger drawing canvas | ✅ Works great | Canvas2D fine |
| File upload from camera roll | ✅ Works | Draw on paper → photo → upload |
| Text input | ✅ Works | Large font, big keyboard |
| In-browser camera/mic | ⚠️ Unreliable | Silk blocks getUserMedia |
| In-browser video record | ❌ Avoid | Use file upload instead |
| Portrait orientation | ✅ Default | Design portrait-first |

---

## Setup Checklist

### Nick
- [ ] Enable branch deploys on Netlify for `kids-preview`
- [ ] Create GitHub PAT scoped only to `kids-preview` branch
- [ ] Text sister-in-law: whitelist `crankychickens.com` on both tablets
- [ ] Sister-in-law bookmarks cannon-master.html and dragon-scribe.html on each tablet

### Claude
- [ ] Build cannon-master.html (artifact review first)
- [ ] Build dragon-scribe.html (artifact review first)
- [ ] Wire Claude API for multimodal submission interpretation
- [ ] Wire GitHub API to commit to kids-preview branch
- [ ] Test full pipeline end to end

---

## Build Order
1. `cannon-master.html` — artifact preview → Nick approves → deploy
2. `dragon-scribe.html` — artifact preview → Nick approves → deploy
3. GitHub commit pipeline — kids-preview branch wiring
4. Claude multimodal interpretation layer
5. Netlify preview URL feedback loop
6. End-to-end test with Nick playing both roles
7. Hand off to sister-in-law

---

## Future
- Kids' names on commits forever ("Lore added by [name]")
- Credits page on crankychickens.com listing contributors
- Their drawings as actual in-game assets
- Cannon Master's ballistics ideas → actual slingshot mechanic in a future game
