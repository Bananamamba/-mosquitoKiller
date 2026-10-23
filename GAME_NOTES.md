# Mosquito Samurai: game notes (working name, final name not chosen)

A mobile tap game: swat mosquitoes with a slipper (כפכף). HTML + canvas + Web Audio, no libraries.
Built as a prototype in one file; split into readable files on 2026-10-22 (no gameplay changes).

## Code layout
Plain `<script>` tags (not modules) so the game runs straight from disk; they share globals,
so the order in `index.html` matters.
- `index.html`, `css/style.css`
- `js/setup.js`: constants, canvas, game state `S`, saved records, shared helpers
- `js/audio.js`: synthesized sounds, mosquito buzz, Queen drone
- `js/draw/`: `scenery.js` (rooms), `moshe-art.js`, `sprites.js` (mosquito, slipper, Queen, life heads),
  `render.js` (frame layers + darkness), `hud.js`
- `js/mosquitoes/`: `types.js`, `bedroom-bugs.js`, `beach-bugs.js`, `hits.js` (bite / kill / split / dodge)
- `js/moshe.js`, `js/the-one.js`, `js/queen.js`
- `js/modes/`: `stage.js` (start / win / lose a night), `campaign.js`, `solo.js`, `endless.js`
- `js/menu.js`, `js/input.js`, `js/loop.js` (main loop), `js/main.js` (start)
- `js/legacy.js`: unreachable old code (upgrade cards, Bug Spray, 60-second mode), kept as is.
  Delete only after a decision.

## Core feel (keep this)
- Tap a mosquito → slipper slams down, short hit-stop, blood splat, flattened mosquito stays on the wall.
- The buzz of a killed mosquito cuts off instantly. Silence is the reward.
- Streak: 5 in a row = x2 points, 10 = x3. Every 10 in a row = big "N IN A ROW!" bonus (streak × 2).
- Mid-air kills never count as hitting Moshe.

## Rooms
1. **Bedroom swarm**: dark bedroom. Mosquitoes appear lit by a flashlight beam and vanish fast.
   Escaped mosquitoes bite. The Queen can appear at a random time (jump scare).
2. **Big Moshe**: sunny beach, side view. Big belly, sunglasses on his face. Mosquitoes fly in from
   all angles, land, and bite (visible bite, red bump). Goal: keep him asleep.
   - Every miss wakes him a little (wake meter at the bottom). Bites wake him a little.
   - Mosquitoes rarely land on the face (~5% of landings, never two at once).
   - Killing a mosquito that landed on the face is allowed but wakes him a lot (+30% wake).
   - An empty slap on the face (no mosquito there) = instant loss. Face zone is only the face itself.
   - Moshe rolls over every ~15–30 s: head switches sides, landed mosquitoes fly off.
3. **The One**: total darkness, one smart mosquito. Hold finger to "listen" (buzz louder/closer,
   stereo), release to slap. When the buzz stops, it has landed. Limited slaps and lamp flicks.

## Mosquito types
norm · gold (+5) · coward (dodges first slap) · faker (flickers / zigzags) · pair (one slap, two kills) ·
fat (returns full of blood after a bite; killing it heals a bite) · armored (helmet, 2 hits) ·
splitter (splits into 3 minis) · belly stucker (beach only: digs in, press and HOLD to pull out).

## The Queen (boss)
Jump scare: lights cut, white flash, huge face, screech. Then a fight: many taps to kill, a
"HER STING" bar fills; if it fills she lunges, laughing face "HA HA HA" = loss.

## Modes
### Endless (per room, records saved per room)
- Tiers by SCORE: 50, 150, 300, 500, then gaps grow. Each tier adds a new mosquito type
  (just an on-screen announcement, NO cards, no pause).
  Bedroom order: coward, pair, faker, armored, splitter. Beach: coward, pair, faker, stucker, armored, splitter.
- Harder every 10 seconds: easy for the first 50 s, then faster each 10 s, max at ~5 min ("MAX SPEED").
- Three strikes ✕✕✕: each escaped mosquito = 1 strike (minis don't count). 3 = game over.
  Every 25 in a row clears one strike.
- Random events every 16–24 s: Swarm, Golden hour, Heat wave (x2 points), Lights out (bedroom).
- Fever: fills from kills in a row; full = 6 s of x3 points, big slipper, beat, pink screen.
- The Queen comes at random times (first after 1–2 min, then every 1.5–3 min), stronger each visit.
- The One endless: each catch, the next mosquito is smarter (crawls after landing, then runs from the lamp, then faster).

### Campaign (full run)
- Nights in order: Bedroom → Big Moshe → The One → repeat, each loop harder. First loop is eased.
- NO cards. Three lives shown as three annoying mosquito heads.
- Lose a night → lose a life and MOVE ON to the next night. Lose all three → game over.
- Progress is saved; "Continue run" appears in the menu.
- Stages/levels for the campaign are still to be designed (owner decides when).

## Removed on purpose (don't bring back without asking)
- 60-second challenge mode.
- Cards in Endless. Cards in the campaign (replaced by lives).

## Decisions still open
- Final game name (no sword anymore, so "Samurai" may not fit).
- Art direction: plan is code-drawn art in game + paid illustrator for icon, store screenshots, Moshe and the Queen.
- Campaign stages content.

## Next steps (plan)
1. ~~Split index.html into readable files (no gameplay changes)~~ done 2026-10-22.
   ~~git + GitHub~~ done 2026-10-23: public repo https://github.com/Bananamamba/-mosquitoKiller
   (commits use the GitHub no-reply email, not a real address).
   Playable link (GitHub Pages, from main, updates ~1 min after each push): https://bananamamba.github.io/-mosquitoKiller/
2. Finish the game (campaign stages), playtest with real people after each big change.
3. Wrap as an app (Capacitor is the quickest path). Add haptics, offline play, Game Center / Play Games leaderboards.
4. Ads: Google AdMob. Rewarded ad = "watch to get another chance" after 3 strikes; occasional interstitial; paid "Remove ads".
   Needs privacy policy, EU consent dialog, store privacy forms, honest age rating (the Queen jump scare).
5. Google Play: new personal accounts need a closed test with at least 12 testers for 14 days in a row.
   iPhone build needs a Mac with Xcode; Apple Developer Program is $99/year, Google Play $25 once.
6. Soft launch in Israel first (humor is local), measure day-1 / day-7 return, then expand.

## Known caveats
- All balance numbers were tested by a bot, not tuned with humans yet.
- Sounds are synthesized in code (placeholder).
- localStorage keys: mosq-endless (records), mosq-ck (campaign checkpoint), mosq-run-best, mosq-run-nights.
