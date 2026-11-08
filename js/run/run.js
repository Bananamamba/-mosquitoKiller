// The run: one continuous game through all places in order, looping and getting harder.
// Knows nothing about specific places; it only uses the place definitions (places.js).

// Why a life was lost (also shown on the end screen).
const LIFE_TXT = {
  bitten: "Too many bites.",
  wake: "All that slapping woke Moshe up.",
  face: "You slapped Moshe in the face!",
  stung: "The Queen got you.",
  noslap: "Out of slaps. It's still buzzing.",
  sunrise: "The sun came up. It got away.",
  oneBitten: "It bit you too many times.",
  cricket: "You hit the cricket."
};

function startRun() {
  audioOn();
  Object.assign(S, {
    playing: true, lives: CFG.run.lives, score: 0, kills: 0, runCoins: 0,
    visits: {}, placeTimes: [], trickT: CFG.tricksters.firstAfter, banner: null, banners: []
  });
  ov.hidden = true;
  setPlaying(true);
  enterPlace(0);
}

// Stop all sounds and clear everything that belongs to the place on screen.
function clearPlace() {
  S.bugs.forEach(b => buzzStop(b, true));
  droneStop(S.q);
  if (S.one) buzzStop(S.one, true);
  Object.assign(S, {
    bugs: [], fx: [], slaps: [], marks: [], bumps: [], fatQ: [], slowTaps: [],
    effects: {}, trick: null, one: null, q: null
  });
}

// Go to place number i (counting up forever; the place is i % number of places).
function enterPlace(i) {
  const prev = currentPlace();
  if (prev.leave) prev.leave();
  clearPlace();
  S.placeIdx = i;
  const place = currentPlace(), loop = loopOf(i);
  STAGE = place.id;
  Object.assign(S, {
    lvl: loop, placeT: 0, placeStart: S.score, fade: CFG.run.fadeInSec,
    threshold: place.threshold ? placeThreshold(place, loop) : 0,
    bites: 0, wake: 0, jig: 0, smile: 0, frown: 0, awakeT: 0, wokeBy: null,
    streak: 0, spawn: .4, stop: 0, shake: 0, flash: 0, bitFlash: 0,
    flip: false, flipT: 0, flipNext: 18, snoreT: 1.5,
    fever: 0, feverT: 0, ev: null, evT: rand(CFG.events.gap),
    queenDone: false, queenAt: 1e9, lightsOn: 0, slapLight: null,
    hold: false, ear: null, lampT: 0, pull: null, intro: null
  });

  // a new mosquito type joins on each visit (explained only the first time ever)
  const visit = S.visits[place.id] = (S.visits[place.id] || 0) + 1;
  const types = place.types || [], unlockedAt = v => v < 1 ? 0 : Math.min(types.length, CFG.types.atFirstVisit + CFG.types.perVisit * (v - 1));
  S.unlocked = unlockedAt(visit);
  const newType = S.unlocked > unlockedAt(visit - 1) ? types[S.unlocked - 1] : null;
  S.intro = newType;   // the first mosquito of the visit is the new type

  pickMission(place, loop);
  trickPlanVisit(place);
  document.getElementById("tag").textContent = `Loop ${loop + 1} · ${place.tag}`;
  document.getElementById("hint").textContent = place.hint;
  place.enter(loop);
  fitCanvas();   // the lamp button may have appeared or gone

  // big entry banner: what moves you on (goal) and the bonus mission
  const c = CFG.missions, coins = c.coins + c.coinsPerLoop * loop;
  const goal = place.threshold ? `GOAL: reach ${S.threshold} points` : place.goal;
  banner(place.name.toUpperCase(), [
    [goal, "#ffffff"],
    [`BONUS: ${S.mission.def.text(S.mission.n)} (+${coins} coins)`, "#9be59b"]
  ], CFG.run.placeBannerSec);
  if (newType && firstTime("type:" + newType)) {
    const [title, info] = TDESC[newType].split(" · ");
    banner(title.toUpperCase(), info, 2, { kind: "type", key: newType });
  }
}

// Remember how long each place took (shown in debug mode).
function recordTime(cleared) {
  const t = { name: currentPlace().name, loop: S.lvl + 1, sec: S.placeT, cleared };
  S.placeTimes.push(t);
  if (DEBUG) console.log(`[debug] ${t.name} L${t.loop}: ${t.sec.toFixed(1)}s ${cleared ? "cleared" : "life lost"}`);
}

// The place is done (threshold reached, or The One caught): on to the next one.
function placeCleared() {
  const place = currentPlace();
  recordTime(true);
  if (place.threshold && !S.mission.done) {
    const pts = Math.round(S.threshold * CFG.missions.penalty);
    S.score = Math.max(0, S.score - pts);
    pop(W / 2, 140, `Bonus missed -${pts}`, "#93a0c4", 16);
  }
  sfx("wave");
  enterPlace(S.placeIdx + 1);
}

// stay = keep playing the same place (the cricket); otherwise move on to the next place.
function loseLife(reason, stay) {
  if (!S.playing) return;
  S.lives--;
  if (!stay) recordTime(false);
  if (S.lives <= 0) { endRun(reason); return; }
  sfx("angry");
  S.banner = null;
  S.banners = [];
  banner("LOST A LIFE", LIFE_TXT[reason] || "", CFG.run.lifeBannerSec);
  if (!stay) enterPlace(S.placeIdx + 1);
}

// Per frame while playing: mission checks and the score threshold.
function updRun(dt) {
  S.placeT += dt;
  missionEvent("tick");
  const place = currentPlace();
  if (place.threshold && !S.q && S.playing && S.score - S.placeStart >= S.threshold) placeCleared();
}

// Out of lives: end screen with score, how far you got, coins and personal best.
function endRun(reason) {
  const place = currentPlace(), reached = `Loop ${S.lvl + 1} · ${place.name}`;
  if (place.leave) place.leave();
  clearPlace();
  Object.assign(S, { playing: false, banner: null, banners: [], paused: false, hold: false, pull: null, lightsOn: 0 });

  COINS += S.runCoins;
  save("mosq-coins", COINS);
  const nb = S.score > BEST.score;
  if (nb) { BEST = { score: S.score, place: reached }; save("mosq-best", BEST); }

  ov.innerHTML = `<p>${LIFE_TXT[reason] || ""}</p><h2>Run over</h2>`
    + `<div class="big">${S.score}</div><div class="rank">Reached: ${reached}</div>`
    + `<p>Coins this run: ${S.runCoins} · Total coins: ${COINS}</p>`
    + `<p>Best: ${BEST.score}${nb ? " · new record!" : ""}</p>`
    + `<div class="btns"><button type="button" data-run="1">Run again</button>`
    + `<button type="button" class="beach" data-menu="1">Menu</button></div>`;
  ov.hidden = false;
  setPlaying(false);
}
