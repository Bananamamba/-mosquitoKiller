// Input: taps on the canvas, hold-to-listen (The One), hold-to-pull (belly stucker), lamp button/key.

// Screen position → canvas units.
function pt(e) {
  const r = cv.getBoundingClientRect();
  return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H };
}

cv.addEventListener("pointerdown", e => {
  e.preventDefault();
  if (!S.playing || S.awakeT > 0 || S.paused) return;
  const p = pt(e);
  // The One: pressing = listening; the slap happens on release
  if (STAGE === "one") {
    try { cv.setPointerCapture(e.pointerId); } catch (err) {}
    S.hold = true;
    S.ear = p;
    return;
  }
  // pressing on a belly stucker starts pulling it out (must hold 0.5 s, see loop.js)
  const sk = S.bugs.find(b => !b.dead && b.state === "stuck" && Math.hypot(b.hx - p.x, b.hy - p.y) < 44);
  if (sk && !S.q) {
    try { cv.setPointerCapture(e.pointerId); } catch (err) {}
    S.pull = { b: sk, t: 0 };
    return;
  }
  tap(p);
});

cv.addEventListener("pointermove", e => {
  if (STAGE === "one" && S.hold) S.ear = pt(e);
  // sliding the finger away cancels the pull
  if (S.pull) {
    const p = pt(e);
    if (Math.hypot(p.x - S.pull.b.hx, p.y - S.pull.b.hy) > 60) S.pull = null;
  }
});

cv.addEventListener("pointerup", () => {
  if (STAGE === "one" && S.hold) { S.hold = false; oneSlap(S.ear); }
  if (S.pull) {
    if (!S.pull.b.dead) pop(S.pull.b.hx, S.pull.b.hy - 46, "Hold it longer!", "#ffb0a0", 13);
    S.pull = null;
  }
});

cv.addEventListener("pointercancel", () => { S.hold = false; });

// A slap at p (bedroom / beach). Priority: Queen fight → rage slipper → nearest mosquito.
function tap(p) {
  const q = S.q, rot = -.55 + Math.random() * .4;

  // Queen fight: hit her, or whiff
  if (q) {
    if (q.phase !== "fight" || q.vanish > 0) return;
    S.slaps.push({ x: p.x, y: p.y, rot, t: 0 });
    if (Math.hypot(p.x - q.x, p.y - q.y) < 95 * q.s) hitQueen(p);
    else { sfx("whiff"); mosheSlap(p, false, true); }
    return;
  }

  // rage slipper (legacy perk): one big slap kills everything nearby
  if (S.rage > 0) {
    const hits = S.bugs.filter(b => !b.dead && b.state !== "out" && b.state !== "fake" && Math.hypot(b.x - p.x, b.y - p.y) < 85);
    S.slaps.push({ x: p.x, y: p.y, rot, t: 0, big: 1 });
    if (hits.length) {
      const onFace = hits.some(b => b.beach && b.state !== "fly" && zoneAt(b.hx, b.hy) === "face");
      hits.forEach(b => killBug(b));
      if (onFace) wakeAdd(.3);
    } else { sfx("whiff"); mosheSlap(p, false); }
    return;
  }

  // find the nearest mosquito within reach (fever = bigger slipper)
  let best = null, bd = Math.max(22, 42 + 12 * (S.perks.wide || 0)) + (S.feverT > 0 ? 20 : 0);
  S.bugs.forEach(b => {
    if (b.dead || (b.state === "out" && b.a < .5)) return;
    const dd = Math.hypot(b.x - p.x, b.y - p.y);
    if (dd < bd) { bd = dd; best = b; }
  });
  const at = best || p;   // the slipper snaps onto the mosquito it hits
  S.slaps.push({ x: at.x, y: at.y, rot, t: 0, big: S.feverT > 0 ? 1 : 0 });

  if (!best) {
    sfx("whiff");
    breakStreak();
    pop(p.x, p.y - 56, "Whiff", "#93a0c4", 15);
    mosheSlap(p, false);
    return;
  }
  if (best.state === "fake") {
    sfx("whiff");
    breakStreak();
    pop(best.x, best.y - 56, "Fake!", "#b9a4ff", 16);
    mosheSlap(best, false);
    return;
  }
  if (best.type === "coward" && !best.scared) {
    const wasFly = best.beach && best.state === "fly";
    dodge(best);
    if (!wasFly) mosheSlap(at, false, true);
    return;
  }
  // a mid-air hit on the beach never counts as hitting Moshe
  const midAir = best.beach && best.state === "fly";
  if (best.armor > 0) {
    // first hit only knocks the helmet off
    best.armor = 0;
    if (AC) { tone(AC.currentTime, "square", 1900, 900, .14, .002, .12); }
    pop(best.x, best.y - 56, "CLANK!", "#cfd6e6", 16);
    S.shake = RM ? .03 : .08;
    S.shakeA = Math.random() * 6.28;
    if (!best.beach) best.st = Math.max(0, best.st - .3);
    if (!midAir) mosheSlap(best.beach ? { x: best.hx, y: best.hy } : at, true);
    return;
  }

  // kill it (and its pair mate if it is close)
  const kills = [best];
  if (best.mate && !best.mate.dead && best.mate.state !== "out" && Math.hypot(best.mate.x - best.x, best.mate.y - best.y) < 50) kills.push(best.mate);
  // note: forEach passes the index as killBug's "quiet" flag, so the mate dies without its own slap sound
  kills.forEach(killBug);
  if (kills.length === 2) {
    const m = mult();
    S.score += 2 * m;
    pop(best.x, best.y - 104, "DOUBLE +" + 2 * m, "#ffc94d", 18);
  }
  if (!(best.beach && best.state === "fly")) mosheSlap(best.beach ? { x: best.hx, y: best.hy } : at, true);
}

lampBtn.addEventListener("pointerdown", e => { e.preventDefault(); lampFlick(); });
addEventListener("keydown", e => { if (e.key === "l" || e.key === "L") lampFlick(); });
