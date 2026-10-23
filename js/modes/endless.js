// Endless (per room): tiers by score unlock new mosquito types, speed rises every 10 s,
// random events, fever, the Queen at random times. Three escapes = game over.
// The per-frame endless logic lives in loop.js (updEndless).

// ---------- tiers ----------

// Score needed for tier n: 50, 150, 300, 500, then the gaps keep growing.
function thr(n) {
  const T = [0, 50, 150, 300, 500];
  if (n < T.length) return T[n];
  let v = 500;
  for (let i = 5; i <= n; i++) v += 250 + (i - 5) * 50;
  return v;
}
function tierOf(k) {
  let n = 0;
  while (k >= thr(n + 1)) n++;
  return n;
}
// 0..1 progress to the next tier (top bar line).
const tierProg = () => {
  const a = thr(S.tier), b = thr(S.tier + 1);
  return Math.max(0, Math.min(1, (S.score - a) / (b - a)));
};

// New tier: announce the new type (no pause), and give a little relief (bites / wake meter).
function tierUp(nt) {
  S.tier = nt;
  S.tierT = 0;
  const nw = ORDER[STAGE][nt - 1];
  S.intro = nw || null;
  S.tierDesc = nw ? TDESC[nw] : "Everything gets faster";
  if (STAGE === "bed") S.bites = Math.max(0, S.bites - 2);
  else { S.wake = Math.max(0, S.wake - .25); S.bumps.splice(0, 2); }
  sfx("wave");
  pop(W / 2, 190, `TIER ${nt}`, "#ffc94d", 28);
  pop(W / 2, 222, S.tierDesc.split(" · ")[0], "#c9a0ff", 15);
}

// ---------- random events (every 16-24 s) ----------

// [title, color]
const EVTXT = {
  swarm: ["SWARM!", "#ff8a8a"],
  gold: ["GOLDEN HOUR!", "#ffc94d"],
  heat: ["HEAT WAVE! x2 points", "#ff9a4d"],
  dark: ["LIGHTS OUT!", "#c8b6ee"]
};

function startEvent() {
  const o = ["swarm", "gold", "heat"].concat(STAGE === "bed" ? ["dark"] : []), k = o[Math.random() * o.length | 0];
  // event length in seconds
  S.ev = { k, t: { swarm: 4, gold: 5, heat: 6, dark: 5 }[k], max: { swarm: 4, gold: 5, heat: 6, dark: 5 }[k] };
  S.evT = 16 + Math.random() * 8;
  pop(W / 2, 140, EVTXT[k][0], EVTXT[k][1], 22);
  sfx(k === "gold" ? "gold" : "wave");
}

// ---------- fever ----------

// Kills fill the fever meter; full = 6 s of x3 points, big slipper, beat, pink screen.
function feverAdd(v) {
  if (!S.endless || S.feverT > 0 || STAGE === "one") return;
  S.fever = Math.max(0, Math.min(1, (S.fever || 0) + v));
  if (S.fever >= 1) {
    S.fever = 0;
    S.feverT = 6;
    sfx("fever");
    pop(W / 2, 150, "FEVER!", "#ff6ad5", 30);
  }
}

// ---------- start / end ----------

function startEndless(st) {
  audioOn();
  S.solo = false;
  S.endless = true;
  S.perks = {};
  S.taken = [];
  S.score = 0;
  S.kills = 0;
  S.catches = 0;
  startStage({ bed: 0, beach: 1, one: 2 }[st]);
  Object.assign(S, {
    lvl: 0, tier: 0, tierT: 0, nextQueen: 1e9, runT: 0, step: 0,
    queenCount: 0, queenNext: 60 + Math.random() * 60,   // first Queen after 1-2 minutes
    strikes: 0, queenAt: 1e9, intro: null, blitz: false, fever: 0, feverT: 0, ev: null, evT: 12
  });
  if (st === "one") { S.catches = 0; }
  document.getElementById("tag").textContent = "Endless · " + ROOMS[st];
  document.getElementById("hint").textContent = st === "one"
    ? "Catch one, the next is smarter. Hold to listen, let go to slap."
    : "New mosquito types as your score climbs. Faster every 10 seconds. Three escape and you're out.";
  banner(`ENDLESS · ${ROOMS[st].toUpperCase()}`, st === "one" ? "Catch as many as you can" : "It gets harder fast", 2.2);
}

// Game over: save the record per room and show the result.
// Records: "s_bed" / "s_beach" = points, "one" = catches, "b_..." = 60-second mode (legacy).
function endlessEnd(reason) {
  const st = STAGE, key = S.blitz ? "b_" + st : st === "one" ? st : "s_" + st;
  const metric = st === "one" ? S.catches : S.score, rec = EREC[key] || { k: 0, t: 0 }, nb = metric > rec.k;
  if (nb) {
    EREC[key] = { k: metric, t: S.tier || 0 };
    try { localStorage.setItem("mosq-endless", JSON.stringify(EREC)); } catch (e) {}
  }
  const L = {
    escaped: "Three got away.",
    time: "Time's up!",
    bitten: `${S.bites} bites. You're one big itch.`,
    stung: "The Queen got you. She's still laughing.",
    wake: "All that slapping woke Moshe up.",
    face: "You slapped Moshe in the face. He's furious.",
    noslap: "Out of slaps. It's still buzzing.",
    sunrise: "The sun came up. It won.",
    oneBitten: `It bit you ${S.oneBites} times.`
  };
  const best = EREC[key] || { k: 0, t: 0 }, unit = st === "one" ? "caught" : "points", BZ = S.blitz;
  const noTier = st === "one" || BZ;
  ov.innerHTML = `<p>${BZ ? "60 seconds" : "Endless"} · ${ROOMS[st]}</p><h2>${L[reason] || "Game over."}</h2>`
    + `<div class="big">${metric}</div><div class="rank">${unit}${noTier ? "" : ` · Tier ${S.tier}`}</div>`
    + `<p>Score ${S.score} · Best: ${best.k} ${unit}${noTier ? "" : ` (tier ${best.t})`}${nb ? " · new record!" : ""}</p>`
    + `${(S.taken || []).length ? `<p class="small">Cards: ${S.taken.join(", ")}</p>` : ""}`
    + `<div class="btns"><button type="button" ${BZ ? `data-blitz="${st}"` : `data-endless="${st}"`}>Again</button>`
    + `<button type="button" class="beach" data-menu="1">Menu</button></div>`;
  ov.hidden = false;
}
