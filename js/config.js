// All balance numbers in one place. Change them here after playtesting; nothing else needs to change.
// "perLoop" = how much a number grows each time the run goes around all places again.

const CFG = {
  run: {
    lives: 3,
    placeBannerSec: 2,      // banner with the mission when entering a place
    lifeBannerSec: 1.6,     // "LOST A LIFE" banner
    fadeInSec: .5,          // smooth fade into the next place
  },

  // Score threshold = average player's points per second × target seconds × growPerLoop^loop.
  // pps (points per second) was measured with a bot "average player" (~75% accurate, a tap every ~0.4 s,
  // median of 10 rounds); index = loop (last value repeats). Scoring varies a lot (fever × streak),
  // and later loops score much faster, so check real players with ?debug and adjust these first.
  places: {
    bed: { targetSeconds: 40, growPerLoop: 1.10, pps: [5, 12, 13], maxBites: 6 },
    beach: { targetSeconds: 40, growPerLoop: 1.10, pps: [2.8, 8, 8] },
    one: { seconds: 45, slaps: [4, 3], lamps: [3, 2], maxBites: 3 },  // [first loop, later loops]
  },

  // New mosquito types: the first visit to a place already has this many, then +1 per visit.
  types: { atFirstVisit: 1, perVisit: 1 },

  missions: {
    coins: 10, coinsPerLoop: 5,              // reward for a completed mission
    bonus: 25, bonusPerLoop: 15,             // bonus points for a completed mission
    penalty: .10,                            // threshold reached without the mission: lose this share of the threshold
    // bedroom
    killN: { base: 20, perLoop: 6 },
    streakN: { base: 8, perLoop: 3 },
    goldN: { base: 3, perLoop: 1, goldWeight: .16 },   // gold is more common during this mission
    // beach
    calmN: { base: 12, perLoop: 4, maxWake: .5 },
    pullN: { base: 2, perLoop: 1, stuckWeight: .22 },  // belly stuckers join during this mission
    airN: { base: 4, perLoop: 2 },
    // The One
    slapsN: { base: 3, perLoop: -1, min: 1 },          // catch it with at most N slaps (fewer each loop)
  },

  // Timed effects. Any source can start them (tricksters now; curses or slippers later).
  effects: {
    moreEnemies: { sec: 10, spawnMult: 2.2, capAdd: 3 },
    fog: { sec: 8 },
    slowSlipper: { sec: 6, delay: .35 },   // the slap lands this many seconds after the tap
  },

  // Decoy bugs that must NOT be hit. At most one on screen.
  tricksters: {
    minPerLoop: 2,                   // at least this many per loop of the run
    dueAfter: [6, 14],               // ...when owed, the first comes this many seconds into the visit
    dueGap: [6, 10],                 // ...and the next owed one this soon after
    stay: [1.8, 2.6],                // seconds it hovers / sits before flying off
    firstAfter: 20,                  // seconds of play in the run before the first one (if none is owed)
    gapStart: [28, 40],              // seconds between them at the start of the run (min, max)
    gapEnd: [14, 20],                // ...and after rampPlaces places
    rampPlaces: 9,
    weights: { moth: 1, spider: 1, bee: 1, cricket: .5 },
    hitRadius: 30,
    spiderCoins: 5,                  // coins lost when hitting the spider
  },

  // Random good events (bedroom / beach).
  events: {
    gap: [18, 28],
    gold: { sec: 5 },                // golden hour: every mosquito is golden
    heat: { sec: 6, points: 2 },     // heat wave: faster mosquitoes, x2 points
  },

  fever: { perKill: .07, perGold: .15, perMiss: .25, sec: 6, points: 3 },

  queen: { fromLoop: 1, chance: .5, at: [10, 25] },   // bedroom: chance per visit, seconds into the visit

  // Coins from score: every `every` points in a run gives `amount` coins (on top of bonus missions).
  scoreCoins: { every: 500, amount: 5 },

  // Slipper shop. A good run earns ~95 coins (bot test), so: first slipper after 2-3 good runs,
  // the most expensive after 8-10. Perks are small on purpose:
  //   hitMult = bigger hit area, wakeMult = Moshe's meter fills slower, trickFlash = seconds a decoy flashes.
  slippers: [
    { id: "basic", name: "Basic", price: 0, perk: "The classic. Everyone has it." },
    { id: "quiet", name: "Quiet", price: 250, perk: "Moshe's wake meter fills 10% slower", wakeMult: .9 },
    { id: "eagle", name: "Eagle Eye", price: 500, perk: "Decoy bugs flash for 0.5s when they appear", trickFlash: .5 },
    { id: "wide", name: "Wide", price: 900, perk: "10% bigger hit area", hitMult: 1.1 },
  ],
};
