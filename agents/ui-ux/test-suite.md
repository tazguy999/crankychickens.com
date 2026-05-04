# UI/UX Agent — Test Suite

## Tier 1 Individual Challenges

### Challenge UX-01: Render a New Enemy From Description
**Type:** Individual  
**Input:** "A feline warrior spirit called a StarCat — gold and orange, moves in a patrol pattern, guards the Crater Fields for the ancient cat clans"  
**Task:** Produce a `drawStarCat(x, y, fr, cfg={})` function  
**Pass criteria:**
- Renders within 32×32 bounding box at (x,y)
- Uses gold/orange color scheme (`#d4820a`, `#ffd700` or similar)
- Has a feline quality — ears, whiskers, or tail suggested by canvas shapes
- Animates (at minimum: eye glow pulse)
- Uses ctx.save()/ctx.restore() correctly
- Name tag renders if cfg.name is provided
- No ctx state leaks
- Visually distinct from the default alien iguana

**Fail criteria:**
- Identical to drawAlienIguana with color change only
- Missing save/restore
- Renders outside bounding box
- No animation

---

### Challenge UX-02: Extend a Tile Type
**Type:** Individual  
**Input:** "A quantum cannon tile — dark metal with an orange glow, fires particles upward when active"  
**Task:** Produce a tile case for `T.CANNON` in the `drawTile()` switch  
**Pass criteria:**
- Dark metal base matching station palette
- Orange glow effect using `frame` for animation
- Particle-like upward movement suggestion (animated dots or lines)
- No permanent ctx state mutation
- Matches visual language of existing T.VENT tile

---

### Challenge UX-03: Lore Flash Update
**Type:** Individual  
**Input:** Current `drawLoreFlash()` function  
**Task:** Extend it to support an icon/emoji prefix and a secondary subtitle line  
**Pass criteria:**
- Backward compatible — existing loreText still renders correctly
- New `loreIcon` field renders to left of text if provided
- New `loreSubtitle` renders smaller below main text if provided
- Fade in/out animation preserved
- No layout overflow on long text

---

### Challenge UX-04: Zero-G Visual Distinction
**Type:** Individual  
**Input:** Current `drawChicken()` function  
**Task:** Add a space helmet visor effect that activates in zero-G zones  
**Pass criteria:**
- Visor is a semi-transparent blue arc over the chicken's face area
- Activates when `isZeroG()` returns true
- Subtle — doesn't obscure the chicken's expression
- Animated (subtle shimmer using frame)
- Existing chicken render is unchanged in gravity zones

---

### Challenge UX-05: Config Color Application
**Type:** Individual  
**Input:** An enemyVariant config with `color: "#ff2244"`, `eyeColor: "#00ffff"`, `size: 1.5`  
**Task:** Demonstrate that your drawEnemy function correctly applies all three  
**Pass criteria:**
- Body color uses `#ff2244`
- Eye glow uses `#00ffff`
- Sprite is scaled 1.5× from its center point
- All animation still works at scale
- Name tag still readable at scale

---

## Tier 2 Cross-Agent Collaboration Sims

### Challenge UX-T2-01: StarCat + FS Integration
**Type:** Collaboration sim  
**Flow:**
1. FS agent produces enemy behavior spec with defined data contract
2. UX agent renders a StarCat that uses that contract
**Pass criteria:** drawStarCat correctly reflects FS-provided state (patrol direction, attack state)

---

## Tier 3 End-to-End

### Challenge UX-T3-01: Quantum Cannon Visual
**Type:** Full pipeline  
**Input:** Quantum Chicken Cannon submission  
**Pass criteria:** Cannon tile renders in game, black hole portal effect visible, visually exciting

---

## Scoring per Challenge

| Challenge | Points on pass | Points on fail |
|---|---|---|
| UX-01 | +12 | 0 |
| UX-02 | +8 | 0 |
| UX-03 | +6 | -2 |
| UX-04 | +8 | -2 |
| UX-05 | +10 | -5 |
| UX-T2-01 | +15 | -5 |
| UX-T3-01 | +20 | -10 |
