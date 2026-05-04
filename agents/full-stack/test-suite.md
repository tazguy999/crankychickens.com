# Full Stack Agent — Test Suite

## Tier 1 Individual Challenges

### Challenge FS-01: Extend Config Schema
**Type:** Individual  
**Input:** "We need cannons in the config — each cannon has a screen, a tile position, a destination screen and tile, and an optional key requirement"  
**Task:** Define the schema extension and write a backward-compat loader  
**Pass criteria:**
- New `cannons` array defined in schema with correct fields
- Existing configs without `cannons` still load without error
- Schema is documented with JSDoc
- `applyConfig()` handles the new field
- Unit test covers: no cannons (undefined), empty array, valid cannon, invalid screenIndex

---

### Challenge FS-02: New Enemy Behavior
**Type:** Individual  
**Input:** "An enemy that chases the player when within 3 tiles, retreats when player uses peck"  
**Task:** Produce `updateChaseRetreat(enemy, map, player, frame)` function  
**Pass criteria:**
- Enemy moves toward player when `distance < 3 * TILE`
- Enemy moves away from player for 60 frames after peck hits
- Uses `boxWalkable()` for collision — never moves into walls
- Returns updated enemy state (does not mutate directly — or documents mutation clearly)
- Unit tests cover: idle state, chase trigger, retreat trigger, wall collision during chase

---

### Challenge FS-03: Teleportation Mechanic
**Type:** Individual  
**Input:** "Player stands on a cannon tile and pecks — teleports to the destination tile on another screen"  
**Task:** Produce `checkCannonTeleport(player, screen, cannons, peckActive)` function  
**Pass criteria:**
- Returns null if no cannon at player's current tile
- Returns null if peck is not active (atk <= 0)
- Returns `{destinationScreen, destinationX, destinationY}` on valid teleport
- Returns null if cannon requires a key and player doesn't have it
- Does not mutate player directly — returns destination for caller to apply
- Unit tests: no cannon, cannon present no peck, cannon present with peck, key required, key held

---

### Challenge FS-04: Screen State Sync
**Type:** Individual  
**Input:** Current `getScreenState()` function with the enemyHps bug we found  
**Task:** Write a fixed version that handles dynamically added enemies  
**Pass criteria:**
- Existing enemyHps preserved when screen is revisited
- New enemies added after init get HP of 1
- Removed enemies (if any) are handled gracefully
- Unit tests cover: first visit, revisit no changes, revisit with added enemy

---

### Challenge FS-05: Zero-G Physics Edge Case
**Type:** Individual  
**Input:** Player at velocity vx=4.0, vy=0 approaching a wall tile at x=608  
**Task:** Describe and implement the correct bounce behavior  
**Pass criteria:**
- Player velocity reverses on wall contact (vx becomes -1.6 per existing code)
- Player does not clip through the wall
- Velocity dampening is applied (`* -0.4` matches existing code)
- Unit test covers: direct hit, glancing hit, corner hit

---

## Tier 2 Cross-Agent Collaboration Sims

### Challenge FS-T2-01: Cannon Tile + UX Handoff
**Type:** Collaboration sim  
**Flow:**
1. FS defines T.CANNON tile constant and data contract
2. UX renders T.CANNON tile using that contract
3. FS writes checkCannonTeleport using the same tile detection
**Pass criteria:** Both agents reference the same tile index, no signature mismatch

---

## Tier 3 End-to-End

### Challenge FS-T3-01: Quantum Chicken Cannon Full Logic
**Type:** Full pipeline  
**Input:** Quantum Chicken Cannon submission  
**Pass criteria:**
- Cannon tile placed in Landing Zone
- Peck on cannon tile teleports player to destination
- Courage key collectible spawns in game
- Mechanic works in both gravity and zero-G modes

---

## Scoring per Challenge

| Challenge | Points on pass | Points on fail |
|---|---|---|
| FS-01 | +10 | 0 |
| FS-02 | +12 | -3 |
| FS-03 | +15 | -5 |
| FS-04 | +8 | -3 |
| FS-05 | +10 | -5 |
| FS-T2-01 | +15 | -5 |
| FS-T3-01 | +20 | -10 |
