// Beach mosquitoes: fly in from the sides or the top, land on Moshe, bite, fly off.
// States: "fly" → "land" (sitting, can be hit) → "bite" → "out" (flying away).
// Belly stuckers go "land" → "stuck" (digging in, must be pulled out by holding).

// p = landing spot on Moshe (from moshePoint). sc = size per type.
function spawnBeachBug(type, p) {
  p = p || moshePoint();
  const e = elapsed() * .6 + S.lvl * 10, PK = S.perks || {};
  const sc = type === "fat" ? 2 : type === "coward" ? 1.35 : type === "mini" ? 1.05 : type === "splitter" ? 1.95 : 1.6;
  // stop a bit away from the skin, along the surface normal, so the needle touches it
  const off = 16 * sc, tx = p.x - Math.cos(p.ang) * off, ty = p.y - Math.sin(p.ang) * off;
  // entry point: left edge, right edge or top
  const sd = Math.random();
  let sx, sy;
  if (sd < .35) { sx = -30; sy = 120 + Math.random() * 300; }
  else if (sd < .7) { sx = W + 30; sy = 120 + Math.random() * 300; }
  else { sx = 30 + Math.random() * 300; sy = -30; }
  const b = {
    type, beach: true, x: sx, y: sy, sx, sy, tx, ty, hx: p.x, hy: p.y, zone: p.zone, ang: p.ang,
    hd: Math.atan2(ty - sy, tx - sx), state: "fly", st: 0,
    // flight time (heat wave and fakers are faster)
    dur: ((S.ev && S.ev.k === "heat") ? .65 : 1) * (type === "faker" ? .8 : 1) * Math.max(.8, (S.lvl ? 1.5 : 1.9) - e * .02) * Math.pow(1.2, PK.slow || 0),
    // time sitting before it starts biting
    life: Math.max(.45, (S.lvl ? .8 : 1.15) - e * .012),
    a: 1, ph: Math.random() * 9, face: 1, blood: 0, sc,
    wob: type === "faker" ? 70 : 22,   // zigzag size
    wf: type === "faker" ? 2.2 : 1.1   // zigzag speed
  };
  if (type === "armored") b.armor = 1;
  S.bugs.push(b);
  if (S.playing) buzzFor(b);
  return b;
}

function spawnBeachWave(forced) {
  const e = elapsed() + S.lvl * 10;
  let type = forced || "norm";
  if (!forced && S.playing && (S.endless || e > 3)) type = S.endless ? pickE() : pickT();
  if (type === "pair") {
    // two side by side, flying in together
    const p = moshePoint(), b1 = spawnBeachBug("pair", p), b2 = spawnBeachBug("pair", { ...p, x: p.x + 18, y: p.y + 4 });
    b2.sx = b1.sx + 20;
    b2.sy = b1.sy + 14;
    b2.ph = b1.ph + 1.3;
    b1.mate = b2;
    b2.mate = b1;
  } else spawnBeachBug(type);
}

function updBeachBug(b, dt) {
  b.st += dt;
  b.ph += dt;
  if (b.state === "fly") {
    // eased path to the landing spot with a sideways wobble that fades out on arrival
    const k = Math.min(1, b.st / b.dur), e = 1 - (1 - k) * (1 - k);
    const bx = b.sx + (b.tx - b.sx) * e, by = b.sy + (b.ty - b.sy) * e;
    const dx = b.tx - b.sx, dy = b.ty - b.sy, L = Math.hypot(dx, dy) || 1;
    const w = Math.sin(b.st * b.wf * 6.28) * b.wob * (1 - k);
    const nx = bx - dy / L * w, ny = by + dx / L * w;
    b.hd = Math.atan2(ny - b.y, nx - b.x);
    b.x = nx;
    b.y = ny;
    if (k >= 1) { b.state = "land"; b.st = 0; b.x = b.tx; b.y = b.ty; }
  } else if (b.state === "land") {
    b.x = b.tx + Math.sin(b.ph * 30) * .6;
    if (b.type === "stuck") {
      b.state = "stuck";
      b.st = 0;
      b.drink = 0;
      pop(b.hx, b.hy - 40, "It's digging in!", "#ffb0a0", 13);
    } else if (b.st >= b.life) { b.state = "bite"; b.st = 0; }
  } else if (b.state === "stuck") {
    // drinks for 6 s, waking Moshe a little every 1.5 s, then bites and leaves
    b.x = b.tx + Math.sin(b.ph * 50) * .5;
    b.blood = Math.min(1, b.st / 6);
    b.drink += dt;
    if (b.drink >= 1.5) { b.drink = 0; wakeAdd(.035); S.jig = .3; }
    if (b.st >= 6) {
      bite(b);
      b.state = "out";
      b.st = 0;
      b.vx = -Math.cos(b.ang) * 240;
      b.vy = -Math.sin(b.ang) * 240 - 80;
      b.hd = Math.atan2(b.vy, b.vx);
    }
  } else if (b.state === "bite") {
    b.blood = Math.min(1, b.st / .55);
    b.x = b.tx + Math.sin(b.ph * 40) * .8;
    if (b.st >= .55) {
      bite(b);
      b.state = "out";
      b.st = 0;
      b.vx = -Math.cos(b.ang) * 240 + (Math.random() - .5) * 120;
      b.vy = -Math.sin(b.ang) * 240 - 80;
      b.hd = Math.atan2(b.vy, b.vx);
    }
  } else {
    b.a = Math.max(0, 1 - b.st / .5);
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.st >= .5) { b.dead = true; buzzStop(b); }
  }
  if (AC) buzzSet(b, b.state === "out" ? 0 : b.state === "stuck" ? .06 : b.state === "bite" ? .2 : .13);
}
