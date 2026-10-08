# Flags Royale — Ideas

A running list of ideas for making the game more exciting. Tick a box when it ships. Add notes or links to commits or PRs under an item as needed.

Players watch rather than control the flags, so most ideas aim for one of three things: giving the viewer a flag to root for, raising tension as the round goes on, or making big moments feel big.

**Suggested next:** pick your flag (#1), speed-up over time (#3) and sound (#9).

---

## Give the viewer a stake

- [ ] **1. Pick your flag before Start.** Tap a flag to back it. Highlight it in the arena and show "Your pick finished #7" at the end. This is the biggest single change: it turns the game from a screensaver into something you root for.
- [ ] **2. Win history.** Keep each country's win and podium counts across rounds in browser storage. Show "Brazil — 4 wins" on the win card so rivalries build over time.

## Build tension as the round goes on

- [ ] **3. Speed-up over time.** Every 15–20 s, make the blade a little faster or a little longer, so rounds can't drag.
- [ ] **4. Second blade at 5 flags left.** Add a second blade spinning the opposite way to make the endgame hectic.
- [ ] **5. Shrinking arena.** Slowly close the rim in during the final few flags, like a battle-royale storm.
- [ ] **6. Final showdown.** With 2 flags left, add slow motion, a "FINAL 2" banner and a dimmed background.

## In-game events

- [ ] **7. More power-ups** using the shield drop system:
  - [ ] **Speed boost:** the flag zips around for 3 s.
  - [ ] **Ghost:** the flag passes through other flags.
  - [ ] **Magnet:** the flag pulls nearby flags toward the blade.
  - [x] **Blade freeze:** the blade stops for 2 s. *Shipped:* about 1 in 4 drops is a snowflake. Any flag that catches it stops the blade and ices it over for 2 s, so it can't cut. It flickers just before it thaws.
  - [x] **Bomb:** pushes nearby flags outward toward the rim. *Shipped:* about 1 in 4 drops. Flags pass by it; it explodes after a random 0.8–2.6 s fuse, or when it reaches the bottom rim, and swells and flashes red just before. Flags within 170 units are thrown outward, harder the closer they are. The blast never kills directly; only the blade does, so shielded flags survive. Drop odds are now shield 2 : freeze 1 : bomb 1.
- [ ] **8. Near-miss effects.** When a flag escapes the blade by a few pixels, flash "CLOSE!" or add a brief slow-mo. Most of the tension is in near misses, and right now they go unnoticed.

## Feedback and polish

- [ ] **9. Sound.** Add a blade whir that rises with speed, a clang on shield deflects, a slice sound on kills and a crowd roar for the winner. Sound adds a lot of excitement for little work.
- [ ] **10. Live commentary.** Add short lines to the Eliminated list, such as "Germany sliced with 3 left!" or "France survives on a shield!"
- [ ] **11. Blade kill streaks.** Show "Double cut!" when the blade takes out two flags within a second.

## Sharing and replay value

- [ ] **12. Shareable result.** Add a button that copies "🏆 Japan won Flags Royale (32 flags)" or saves an image of the win card.
- [ ] **13. Tournament mode.** Run groups of 8, then the top 2 from each group play a final. This pairs well with the FIFA 2026 and Euro 2024 pools.

---

## Shield drop follow-ups

The shield drop already works this way: every 10 s it falls from the top, lined up with a random flag, and the flag it hits is immune to the blade for 5 s.

- [x] Shield drop: every 10 s, 5 s of immunity
- [x] ~~Drop from a random spot instead of aiming at a flag~~ (tried it, then reverted: aiming at a random flag felt better)
- [ ] **Unused shields.** A drop that misses currently fizzles at the bottom rim. Options:
  - Stays on the floor, glowing, until a flag rolls over it *(recommended)*
  - Keeps bouncing around the arena like a flag until one touches it
  - Lands and fades after a few seconds
  - Keep as is: a miss is lost
- [ ] **Shield stacking.** If uncollected shields stay in play, decide whether new ones keep dropping every 10 s or the timer waits until the current one is collected. Recommended: wait, so there's only ever one at a time.
- [ ] **Random timing.** Drop every 8–12 s instead of exactly every 10 s.
- [ ] **Angled fall.** Let the shield fall on a slight diagonal instead of straight down.
- [ ] **Settings toggle.** Add a Settings option to turn shields on or off and set how often they drop.
