// The One: total darkness, one smart mosquito. Hold to listen (buzz gets louder/closer, stereo),
// release to slap. When the buzz stops, it has landed. Limited slaps and lamp flicks.

function oneStart() {
  oneSpawn();
  S.slapsLeft = S.lvl ? 3 : 4;
  S.oneBites = 0;
  S.lamps = (S.lvl ? 2 : 3) + (S.perks.vision || 0);
  document.getElementById("lampN").textContent = S.lamps;
}

// In endless, each catch makes the next one smarter: crawls after landing (1), runs from the lamp (2), faster (3+).
function oneSpawn() {
  const c = S.endless ? S.catches : 0;
  S.one = {
    crawl: c >= 1, lampFlee: c >= 2,
    x: 40, y: 120, vx: 0, vy: 0, tx: 200, ty: 200,
    landed: false, landing: false, landT: 0,
    nextLand: 3 + Math.random() * 2,           // seconds until it looks for a place to land
    diveT: (S.lvl ? 7 : 11) + Math.random() * 3, // seconds until it dives at you to bite
    diving: false, flee: 0,
    sp: (S.lvl ? 95 : 75) * Math.pow(1.15, S.lvl) * Math.pow(1.1, Math.max(0, c - 2)) * Math.pow(.85, S.perks.slow || 0),
    avoid: [],   // places you slapped recently; it stays away from them
    dead: false, winT: 0, ph: 0, face: 1, near: 0
  };
  if (AC) {
    const b = { type: "norm", x: 40 };
    buzzFor(b);
    S.one.snd = b.snd;
  }
}

// New random destination, away from recent slap spots.
function oneTarget() {
  const o = S.one;
  let x, y, t = 0;
  do {
    x = 30 + Math.random() * 300;
    y = 70 + Math.random() * 360;
    t++;
  } while (t < 25 && o.avoid.some(a => Math.hypot(a.x - x, a.y - y) < 120));
  o.tx = x;
  o.ty = y;
}

function updOne(dt) {
  const o = S.one;
  if (!o) return;
  o.ph += dt;

  // caught: lights slowly come on, then win (or next catch in endless)
  if (o.dead) {
    o.winT -= dt;
    S.lightsOn = Math.min(1, S.lightsOn + dt * 1.2);
    if (o.winT <= 0) {
      if (S.endless) oneNext();
      else stageWon();
    }
    return;
  }

  o.avoid.forEach(a => a.t -= dt);
  o.avoid = o.avoid.filter(a => a.t > 0);
  o.flee = Math.max(0, o.flee - dt);

  if (o.landed) {
    // sitting silently (smart ones crawl slowly)
    if (o.crawl) {
      o.x = Math.max(20, Math.min(W - 20, o.x + Math.cos(o.ca) * 12 * dt));
      o.y = Math.max(60, Math.min(470, o.y + Math.sin(o.ca) * 12 * dt));
    }
    o.landT -= dt;
    if (o.landT <= 0) {
      o.landed = false;
      oneTarget();
      o.nextLand = 4 + Math.random() * 3;
    }
  } else {
    o.nextLand -= dt;
    o.diveT -= dt;
    // dive toward you (bottom of the screen) to bite
    if (o.diveT <= 0 && !o.diving) {
      o.diving = true;
      o.landing = false;
      o.tx = 180 + (Math.random() - .5) * 80;
      o.ty = 452;
    }
    if (!o.diving && !o.landing && o.nextLand <= 0) { o.landing = true; oneTarget(); }
    const dx = o.tx - o.x, dy = o.ty - o.y, dd = Math.hypot(dx, dy);
    const sp = o.sp * (o.diving ? 1.5 : 1) * (o.flee > 0 ? 2.4 : 1);
    if (dd < 8) {
      // arrived
      if (o.diving) {
        o.diving = false;
        o.diveT = (S.lvl ? 8 : 12) + Math.random() * 4;
        oneBitten();
        oneTarget();
      } else if (o.landing) {
        o.landing = false;
        o.landed = true;
        o.ca = Math.random() * 6.28;   // crawl direction
        o.landT = (S.lvl ? 2.5 : 3.5) + Math.random() * 1.5;
        o.vx = o.vy = 0;
      } else oneTarget();
    } else {
      // steer smoothly toward the target
      const k = Math.min(1, dt * 3);
      o.vx += (dx / dd * sp - o.vx) * k;
      o.vy += (dy / dd * sp - o.vy) * k;
    }
    o.x += o.vx * dt + Math.sin(o.ph * 7) * .8;
    o.y += o.vy * dt + Math.cos(o.ph * 6) * .8;
    if (Math.abs(o.vx) > 5) o.face = o.vx > 0 ? 1 : -1;
  }

  // sound: louder the closer it is to your finger (or the bottom center when not listening);
  // silent while landed; panned left/right relative to the finger
  const ear = S.hold && S.ear ? S.ear : { x: 180, y: 450 };
  const near = Math.max(0, 1 - Math.hypot(o.x - ear.x, o.y - ear.y) / 320);
  o.near = o.landed ? 0 : near;
  if (o.snd && AC) {
    const n = AC.currentTime;
    o.snd.gn.gain.setTargetAtTime(o.landed || !S.playing ? 0 : .03 + .3 * near * near, n, .04);
    if (o.snd.pn) o.snd.pn.pan.setTargetAtTime(Math.max(-1, Math.min(1, (o.x - ear.x) / 140)), n, .04);
  }
}

// Endless: next mosquito. Rewards: one bite healed, +2 slaps (max 5), +1 lamp, clock reset.
function oneNext() {
  S.catches++;
  S.tier = S.catches;
  if (S.one) buzzStop(S.one, true);
  S.lightsOn = 0;
  S.oneBites = Math.max(0, S.oneBites - 1);
  S.slapsLeft = Math.min(5, S.slapsLeft + 2);
  S.lamps++;
  document.getElementById("lampN").textContent = S.lamps;
  S.left = S.dur;
  oneSpawn();
  const sub = S.catches === 1 ? "The next one crawls after it lands"
    : S.catches === 2 ? "The next one runs from the lamp"
    : "The next one is faster";
  banner(`CATCH ${S.catches}`, sub, 1.8);
}

function oneBitten() {
  if (!S.playing) return;
  S.oneBites++;
  sfx("bite");
  S.bitFlash = .5;
  pop(180, 420, "BZZT. Bitten!", "#ff8a8a", 16);
  if (S.oneBites >= oneMax()) finish("oneBitten");
}

// Slap where the finger was released. Landed = easier to hit; mid-air = more points.
function oneSlap(p) {
  const o = S.one;
  if (!o || o.dead || !S.playing || S.banner) return;
  S.slaps.push({ x: p.x, y: p.y, rot: -.55 + Math.random() * .4, t: 0 });
  S.slapLight = { x: p.x, y: p.y, t: .25 };   // the slap briefly lights the spot
  const r = Math.max(18, (o.landed ? 34 : 26) + (S.lvl ? 0 : 8) + 10 * (S.perks.wide || 0));
  if (Math.hypot(o.x - p.x, o.y - p.y) < r) {
    // got it
    o.dead = true;
    o.winT = 1.8;
    buzzStop(o, true);
    S.kills++;
    sfx("fatsplat");
    S.stop = .16;
    S.shake = RM ? .05 : .3;
    S.shakeA = 0;
    const pts = (o.landed ? 40 : 60) * (1 + (S.perks.dbl || 0));
    S.score += pts;
    S.fx.push({
      kind: "splat", x: o.x, y: o.y, life: 9, face: o.face, type: "norm", r: 9,
      dots: Array.from({ length: 12 }, () => [(Math.random() - .5) * 44, (Math.random() - .5) * 44, 1 + Math.random() * 3.5])
    });
    for (let i = 0; i < 30; i++) {
      const an = Math.random() * 6.28, sp = 140 + Math.random() * 360;
      S.fx.push({ kind: "drop", x: o.x, y: o.y, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp - 60, r: 1 + Math.random() * 3, life: .6 + Math.random() * .5 });
    }
    pop(o.x, o.y - 60, (o.landed ? "GOT IT! +" : "MID-AIR! +") + pts, "#ffc94d", 22);
  } else {
    // missed: it flees from the spot and avoids it for 8 s
    S.slapsLeft--;
    sfx("whiff");
    o.avoid.push({ x: p.x, y: p.y, t: 8 });
    o.landed = false;
    o.landing = false;
    o.diving = false;
    o.flee = 1.2;
    const an = Math.atan2(o.y - p.y, o.x - p.x);
    o.vx = Math.cos(an) * 300;
    o.vy = Math.sin(an) * 300;
    oneTarget();
    pop(p.x, p.y - 50, S.slapsLeft ? ["Missed.", "It's laughing at you.", "Bzz-ha."][Math.random() * 3 | 0] : "Out of slaps.", "#93a0c4", 16);
    if (S.slapsLeft <= 0) setTimeout(() => { if (S.playing && STAGE === "one") finish("noslap"); }, 900);
  }
}

// Lamp flick: lights the room for a moment. Smart ones that have landed take off.
function lampFlick() {
  if (STAGE !== "one" || !S.playing || S.banner || S.paused || S.lamps <= 0 || S.lampT > 0 || (S.one && S.one.dead)) return;
  S.lamps--;
  S.lampT = .45;
  document.getElementById("lampN").textContent = S.lamps;
  if (S.one && S.one.lampFlee && S.one.landed) {
    const o = S.one;
    o.landed = false;
    o.flee = 1.2;
    oneTarget();
    pop(o.x, o.y - 40, "It saw the light!", "#ffc94d", 14);
  }
  if (AC) nz(AC.currentTime, "bandpass", 3000, 2, .3, .002, .03);   // switch click
}
