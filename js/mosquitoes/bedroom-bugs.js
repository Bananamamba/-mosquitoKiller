// Bedroom mosquitoes: they pop up in the flashlight, hover in place, then bite and fly off.
// States: "fake" (faker flicker) → "in" (fade in) → "on" (hovering, can be hit) → "out" (escaping).

// A random spot not too close to other mosquitoes (on the beach: a spot on Moshe).
function freePoint() {
  let p, tries = 0;
  do {
    p = STAGE === "beach" && S.playing ? moshePoint() : { x: 40 + Math.random() * 280, y: 90 + Math.random() * 380, zone: null };
    tries++;
  } while (tries < 20 && S.bugs.some(b => !b.dead && Math.hypot(b.hx - p.x, b.hy - p.y) < 90));
  return p;
}

// life = seconds it stays before biting.
function newBug(type, p, life) {
  const b = {
    x: p.x, y: p.y, hx: p.x, hy: p.y, zone: p.zone, type, state: "in", st: 0, life, a: 0,
    ph: Math.random() * 9, face: Math.random() < .5 ? 1 : -1, vx: 0, vy: 0, armor: type === "armored" ? 1 : 0
  };
  S.bugs.push(b);
  if (S.playing) buzzFor(b);
  return b;
}

function spawnWave() {
  const e = elapsed() + S.lvl * 10;
  // how long each mosquito stays: shorter as time and loops go on
  const base = Math.max(.6, (S.lvl ? 1.3 : 1.6) - e * .022) * Math.pow(1.2, S.perks.slow || 0) * ((S.ev && S.ev.k === "heat") ? .7 : 1);
  let type = "norm";
  if (S.playing && (S.endless || e > (S.lvl ? 3 : 8))) type = S.endless ? pickE() : pickT();
  const p = freePoint();
  if (type === "pair") {
    const b1 = newBug("pair", p, base * 1.1);
    const b2 = newBug("pair", { x: Math.min(W - 30, p.x + 24), y: p.y + 10, zone: p.zone }, base * 1.1);
    b1.mate = b2;
    b2.mate = b1;
    b2.ph = b1.ph + 1.3;
  } else if (type === "faker") {
    const b = newBug("faker", p, base);
    b.state = "fake";
    b.fakes = 2;   // flickers in two wrong places first
  } else newBug(type, p, type === "gold" ? base * .7 : base);
}

function updBug(b, dt) {
  if (b.beach) { updBeachBug(b, dt); return; }
  b.st += dt;
  b.ph += dt;
  if (b.state === "fake") {
    b.a = .5 * (.55 + .45 * Math.sin(b.st * 45));
    if (b.st >= .42) {
      b.fakes--;
      const p = freePoint();
      b.hx = p.x; b.hy = p.y; b.zone = p.zone;
      b.st = 0;
      if (b.fakes <= 0) { b.state = "in"; b.a = 0; }
    }
  } else if (b.state === "in") {
    b.a = Math.min(1, b.st / .1);
    if (b.st >= .1) { b.state = "on"; b.st = 0; }
  } else if (b.state === "on") {
    b.a = 1;
    if (b.st >= b.life) {
      // time's up: it bites and shoots off in a random direction
      b.state = "out";
      b.st = 0;
      bite(b);
      const an = Math.random() * 6.28;
      b.vx = Math.cos(an) * 420;
      b.vy = Math.sin(an) * 420 - 100;
      b.face = b.vx > 0 ? 1 : -1;
    }
  } else {
    b.a = Math.max(0, 1 - b.st / .22);
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.st >= .22) { b.dead = true; buzzStop(b); }
  }
  // hover wobble around its spot (cowards are jumpier)
  if (b.state !== "out") {
    b.x = b.hx + Math.sin(b.ph * 5) * (b.type === "coward" ? 9 : 6);
    b.y = b.hy + Math.cos(b.ph * 4) * 4;
  }
  if (AC) buzzSet(b, b.state === "out" ? 0 : b.state === "fake" ? .05 : .13 * b.a);
}
