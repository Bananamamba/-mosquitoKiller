# Mosquito Samurai: game notes (working name, final name not chosen)

A mobile tap game: swat mosquitoes with a slipper (כפכף). HTML + canvas + Web Audio, no libraries.
Built as a prototype in one file; split into readable files on 2026-10-22 (no gameplay changes).
Restructured on 2026-11-08 into one continuous run (no campaign, no separate endless).

## Code layout
Plain `<script>` tags (not modules) so the game runs straight from disk; they share globals,
so the order in `index.html` matters.
- `index.html`, `css/style.css`
- `js/config.js`: **all balance numbers** (thresholds, missions, effects, tricksters, coins, events, Queen)
- `js/setup.js`: constants, canvas, game state `S`, saved data, shared helpers
- `js/audio.js`: synthesized sounds, mosquito buzz, Queen drone
- `js/draw/`: `scenery.js` (rooms), `moshe-art.js`, `sprites.js`, `render.js` (frame layers + darkness), `hud.js`
- `js/run/`: the run system, independent of any specific place
  - `places.js` (place registry + threshold formula), `run.js` (order, loops, lives, coins, end screen),
    `missions.js`, `effects.js`, `events.js` (golden hour, heat wave, fever), `tricksters.js`, `debug.js`
- `js/places/`: one file per place (`bedroom.js`, `beach.js`, `the-one.js`)
- `js/mosquitoes/`: `types.js`, `bedroom-bugs.js`, `beach-bugs.js`, `hits.js` (bite / kill / split / dodge)
- `js/moshe.js`, `js/the-one.js`, `js/queen.js`: logic used by the places
- `js/menu.js`, `js/input.js`, `js/loop.js` (main loop), `js/main.js` (start)

**Adding a place** = one file in `js/places/` (see the field list at the top of `js/run/places.js`),
one `<script>` line in the "places" group of `index.html`, and its numbers in `config.js`.
The run itself does not change. A new place gets tricksters, events and fever by setting
`tricksters: true, events: true, fever: true`.

## Core feel (keep this)
- Tap a mosquito → slipper slams down, short hit-stop, blood splat, flattened mosquito stays on the wall.
- The buzz of a killed mosquito cuts off instantly. Silence is the reward.
- Streak: 5 in a row = x2 points, 10 = x3. Every 10 in a row = big "N IN A ROW!" bonus (streak × 2).
- Mid-air kills never count as hitting Moshe.

## The run (the only mode)
- One continuous run through the places in order: Bedroom → Big Moshe → The One → back to the start.
  Each loop is harder (thresholds, missions, mosquito speed). The first loop is eased.
- Entering a place: 2-second banner with the mission, smooth fade, no in-between screen.
- Bedroom and beach have a **score threshold** (points scored inside that place). Reaching it moves on,
  even if the mission is not done. The One has no threshold: catching it moves on.
- **Threshold by time**: an average player should reach it in 35–45 s on the first loop; +10% time each loop.
  Threshold = average points per second (measured with a bot, `pps` in config) × target seconds × 1.1^loop.
- **Mission** (one drawn at random per visit): completed = coins + bonus points right away.
  Threshold reached without it = no coins and a small score penalty (10% of the threshold).
- **3 lives** for the whole run (three mosquito heads at the top). After losing a life, the run moves on
  to the next place (except the cricket: you stay). No lives left = end screen: score, place reached,
  coins, personal best.
  - Bedroom: too many bites (6). Beach: Moshe's wake meter fills, or an empty slap on his face.
    The One: out of slaps, out of time, or bitten 3 times. Bedroom Queen: her sting.
- New mosquito types join one per visit to a place (bedroom: coward, pair, faker, armored, splitter;
  beach: coward, pair, faker, stucker, armored, splitter). The "X join" explanation shows only the
  first time ever (localStorage).
- The Queen: bedroom only, from loop 2, 50% chance per visit, 10–25 s in. Her sting = a life lost.
- Fever (bedroom, beach): fills from kills; full = 6 s of x3 points.
- Random events (bedroom, beach), every 18–28 s: Golden hour (all gold), Heat wave (faster, x2 points).
- Moshe's wake meter: big bar at the bottom of the beach only, yellow past 40%, flashing red past 65%,
  with a halfway mark.
- **Test mode**: open the game with `?debug` (e.g. `.../-mosquitoKiller/?debug`) to see on screen how many
  seconds each place took (also printed in the browser console). Use it to tune `pps` / `targetSeconds`.

## Missions (numbers grow every loop, all in config)
- Bedroom: squash X mosquitoes · X in a row without a miss · squash X golden ones (more gold during it).
- Beach: X kills before the wake meter passes half · pull out X belly stuckers (they join during it) ·
  X kills in mid-air.
- The One: catch it with at most X slaps · without the lamp · in mid-air (not while it sits).

## Tricksters (decoy bugs: don't hit them)
- Every place except The One. At most one on screen. Rare at first (every 28–40 s), more often as the run
  goes on (every 14–20 s after 9 places). None during the fog or the Queen.
- Moth (pale, big wings, flutters): bad luck, more mosquitoes for 10 s.
- Spider (black, 8 legs, drops on a thread): rain and fog for 8 s, and you lose some coins.
- Cricket (green, hops along the floor): you lose a life (and stay in the place).
- Bee (yellow-black stripes, zigzags): slow slipper for 6 s (the slap lands 0.35 s after the tap).
- First time a player ever sees each one: a short banner with its picture and what it does (localStorage).
- A tap hits the trickster only if it is closer than any mosquito.

## Effects (general system)
`startEffect(id, source)` in `js/run/effects.js`: moreEnemies, fog, slowSlipper. Any source can start them
(tricksters today; curses or special slippers later). Durations in `config.js`. Timers show under the HUD.

## The Queen (boss)
Jump scare: lights cut, white flash, huge face, screech. Then a fight: many taps to kill, a
"HER STING" bar fills; if it fills she lunges, laughing face "HA HA HA" = a life lost.

## Mosquito types
norm · gold (+5) · coward (dodges first slap) · faker (flickers / zigzags) · pair (one slap, two kills) ·
fat (returns full of blood after a bite; killing it heals a bite) · armored (helmet, 2 hits) ·
splitter (splits into 3 minis) · belly stucker (beach only: digs in, press and HOLD to pull out).

## Removed on purpose (don't bring back without asking)
- Campaign with nights/checkpoints, separate Endless per room, single-room play, 60-second mode.
- Upgrade cards and perks (Bug Spray, Rage Slipper, Steady Hand, ...).
- Random events Swarm (the moth covers it) and Lights out (the spider's fog covers it).
- All of this is still in the git history.

## Future ideas (רעיונות לעתיד)
- More places: kitchen, tundra, library and more. Each one is added in its own step (one file each).
- Friends leaderboard with light one-round "curses" (e.g. a bent slipper, fog). They should use the
  existing effects system (`startEffect`), the same as tricksters.
- Slipper shop (spends the saved coins) and leaderboards: next step, not built yet.

## Decisions still open
- Final game name (no sword anymore, so "Samurai" may not fit).
- Art direction: plan is code-drawn art in game + paid illustrator for icon, store screenshots, Moshe and the Queen.
- Score variance: fever (x3) stacks with the streak (x3) and heat wave (x2), so a lucky streak can reach the
  threshold 3–4 times faster than a normal round. Decide whether to cap the combined multiplier.

## Next steps (plan)
1. ~~Split index.html into readable files (no gameplay changes)~~ done 2026-10-22.
   ~~git + GitHub~~ done 2026-10-23: public repo https://github.com/Bananamamba/-mosquitoKiller
   (commits use the GitHub no-reply email, not a real address).
   Playable link (GitHub Pages, from main, updates ~1 min after each push): https://bananamamba.github.io/-mosquitoKiller/
2. ~~Continuous run with places, missions, lives, tricksters~~ done 2026-11-08. Playtest with real people
   using `?debug`, tune `config.js`. Then: slipper shop, leaderboards, new places.
3. Wrap as an app (Capacitor is the quickest path). Add haptics, offline play, Game Center / Play Games leaderboards.
4. Ads: Google AdMob. Rewarded ad = "watch to get another chance" after the last life; occasional interstitial;
   paid "Remove ads". Needs privacy policy, EU consent dialog, store privacy forms, honest age rating (the Queen jump scare).
5. Google Play: new personal accounts need a closed test with at least 12 testers for 14 days in a row.
   iPhone build needs a Mac with Xcode; Apple Developer Program is $99/year, Google Play $25 once.
6. Soft launch in Israel first (humor is local), measure day-1 / day-7 return, then expand.

## Known caveats
- All balance numbers were tested by a bot, not tuned with humans yet.
- Sounds are synthesized in code (placeholder).
- localStorage keys: mosq-best (best run), mosq-coins (total coins), mosq-seen (explanations already shown).
  Old keys from earlier versions (mosq-endless, mosq-ck, mosq-run-best, mosq-run-nights) are no longer used.
