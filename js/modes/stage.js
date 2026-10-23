// One night (stage): start it, win it, or lose it. Shared by campaign, single room and endless.

// i = night index: 0 bedroom, 1 beach, 2 The One, 3 bedroom again (one loop harder), ...
function startStage(i) {
  S.bugs.forEach(b => buzzStop(b, true));
  if (S.one) buzzStop(S.one, true);
  S.idx = i;
  STAGE = stageOf(i);
  const bed = STAGE === "bed", one = STAGE === "one";
  Object.assign(S, {
    flip: false, flipT: 0, flipNext: 18, fever: 0, feverT: 0, ev: null, evT: 12,
    one: null, lightsOn: 0, slapLight: null, hold: false, ear: null, lampT: 0,
    lvl: Math.floor(i / 3),   // loop number: 0 = first (eased), then harder
    bugs: [], fx: [], pops: [], slaps: [], marks: [], bumps: [], fatQ: [],
    dur: bed ? 30 : one ? 45 : 40,
    bites: 0, wake: 0, jig: 0, smile: 0, frown: 0, awakeT: 0, snoreT: 1.5,
    playing: true, spawn: .4, streak: 0, stop: 0, shake: 0, flash: 0, bitFlash: 0,
    q: null, queenDone: false,
    queenAt: bed ? 5 + Math.random() * 17 : 999,   // campaign bedroom: the Queen comes at a random second
    paused: false, sprayCD: 0, rage: 0, steadyUsed: 0, wokeBy: null
  });
  S.left = S.dur;

  // campaign: save a checkpoint at the start of every night ("Continue run")
  if (!S.solo && !S.endless) {
    S.ck = { idx: i, perks: { ...S.perks }, taken: [...(S.taken || [])], score: S.score, kills: S.kills, lives: S.lives ?? 3 };
    try { localStorage.setItem("mosq-ck", JSON.stringify(S.ck)); } catch (e) {}
  }

  document.getElementById("tag").textContent = `Night ${i + 1} · `
    + (bed ? "3:07 AM · Lights off" : one ? "3:12 AM · Just one mosquito" : "1:30 PM · Beach, Tel Aviv");
  document.getElementById("hint").textContent = bed ? `Survive 30 seconds. ${maxBites()} bites and you're out.`
    : one ? "Hold to listen with your hand. Let go to slap. When the buzz stops, it has landed."
    : "Keep Moshe asleep for 40 seconds. Misses wake him. Never slap his face.";
  sprayBtn.hidden = !(S.perks.spray > 0) || one;
  ov.hidden = true;
  if (one) oneStart();
  lampBtn.hidden = !one;
  const sub = bed ? `Bedroom · survive 30s · max ${maxBites()} bites`
    : one ? `The One · find it by sound · ${S.slapsLeft} slaps`
    : "Big Moshe · keep him asleep 40s";
  banner(`NIGHT ${i + 1}`, sub, 2.4);
}

// Night survived: room bonus, then the "Night N cleared" screen (or the single-room result).
function stageWon() {
  S.bugs.forEach(b => buzzStop(b, true));
  S.bugs = [];
  S.fatQ = [];
  S.slaps = [];
  droneStop(S.q);
  S.q = null;
  if (S.one) { buzzStop(S.one, true); S.one = null; }
  lampBtn.hidden = true;

  const st = STAGE, n = S.idx + 1;
  // bonus: bedroom = unused bites, The One = slaps left + time left, beach = how asleep Moshe stayed
  const bonus = st === "bed" ? Math.max(0, (maxBites() - S.bites) * 5)
    : st === "one" ? 30 + S.slapsLeft * 15 + Math.floor(S.left)
    : Math.round((1 - S.wake) * 50);
  S.score += bonus;
  sfx("wave");
  if (S.solo) {
    S.playing = false;
    S.paused = false;
    sprayBtn.hidden = true;
    soloEnd(true, null, bonus);
    return;
  }
  if (n > BESTN) {
    BESTN = n;
    try { localStorage.setItem("mosq-run-nights", n); } catch (e) {}
  }
  S.paused = true;
  const msg = st === "bed" ? `Survived with ${S.bites} bite${S.bites === 1 ? "" : "s"}.`
    : st === "one" ? "Got it. Finally, silence."
    : "Moshe slept through it.";
  ov.innerHTML = `<p>${msg} Bonus +${bonus}</p><h2>Night ${n} cleared</h2>${headsHTML(S.lives)}`
    + `<p>Next: ${NEXT[stageOf(S.idx + 1)]}</p>`
    + `<div class="btns"><button type="button" data-cont="1">Next night</button></div>`;
  ov.hidden = false;
}

// Night lost (reason = what happened). Campaign: lose a life and move on; no lives left = game over.
function finish(reason) {
  // stop everything
  droneStop(S.q);
  S.q = null;
  S.playing = false;
  S.bugs.forEach(b => buzzStop(b));
  S.bugs = [];
  S.slaps = [];
  S.fatQ = [];
  sprayBtn.hidden = true;
  lampBtn.hidden = true;
  S.hold = false;
  if (S.one) { buzzStop(S.one, true); S.one = null; }
  S.lightsOn = 0;
  S.banner = null;
  S.paused = false;
  S.pull = null;

  if (S.solo) { soloEnd(false, reason); return; }
  if (S.endless) { endlessEnd(reason); return; }

  // campaign
  const n = S.idx + 1, cleared = S.idx, nb = S.score > BESTRUN;
  if (nb) {
    BESTRUN = S.score;
    try { localStorage.setItem("mosq-run-best", S.score); } catch (e) {}
  }
  const MSG = {
    bitten: `Night ${n}: ${S.bites} bites. You're one big itch.`,
    stung: `Night ${n}: the Queen got you. She's still laughing.`,
    wake: `Night ${n}: all that slapping woke Moshe up.`,
    face: `Night ${n}: you slapped Moshe in the face. He's up, and he's furious.`,
    noslap: `Night ${n}: out of slaps. It's still buzzing. Long night ahead.`,
    sunrise: `Night ${n}: the sun came up. It won. You got zero sleep.`,
    oneBitten: `Night ${n}: it bit you ${S.oneBites} times and never got caught.`
  };

  // lives left: lose one, save the checkpoint at the NEXT night, and move on
  if ((S.lives ?? 3) > 1) {
    S.lives = (S.lives ?? 3) - 1;
    S.ck = { idx: S.idx + 1, perks: { ...S.perks }, taken: [...(S.taken || [])], score: S.score, kills: S.kills, lives: S.lives };
    try { localStorage.setItem("mosq-ck", JSON.stringify(S.ck)); } catch (e) {}
    ov.innerHTML = `<p>${MSG[reason] || ""}</p><h2>You lost a life</h2>${headsHTML(S.lives)}`
      + `<p>${S.lives} ${S.lives === 1 ? "life" : "lives"} left. On to the next night.</p>`
      + `<p>Next: ${NEXT[stageOf(S.idx + 1)]}</p>`
      + `<div class="btns"><button type="button" data-cont="1">Next night</button><button type="button" class="beach" data-menu="1">Menu</button></div>`;
    ov.hidden = false;
    return;
  }

  // last life gone: game over, clear the checkpoint, rank by nights cleared
  S.lives = 0;
  try { localStorage.removeItem("mosq-ck"); } catch (e) {}
  S.ck = null;
  const RR = [[0, "Still itchy"], [1, "Light sleeper"], [2, "Slipper slinger"], [4, "Night ninja"], [6, "Mosquito Samurai"]];
  const rank = RR.filter(r => cleared >= r[0]).at(-1)[1];
  const perks = (S.taken || []).join(", ");
  ov.innerHTML = `<p>${MSG[reason] || "Run over."}</p><div class="big">${S.score}</div><h2>Game over</h2>${headsHTML(0)}`
    + `<div class="rank">${rank}</div>`
    + `<p>Reached night ${n} · Most nights: ${BESTN} · Best run: ${BESTRUN}${nb ? " (new!)" : ""}</p>`
    + `${perks ? `<p>Upgrades: ${perks}</p>` : ""}`
    + `<div class="btns"><button type="button" data-run="1">New run</button><button type="button" class="beach" data-menu="1">Menu</button></div>`;
  ov.hidden = false;
}
