// Main loop: one update + draw per animation frame. The update order matters (same as the prototype).

let last = performance.now();

function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000);   // seconds, capped so a hiccup can't jump too far
  last = now;
  // hit-stop: freeze the game for a moment after a hit, but keep drawing
  if (S.stop > 0) { S.stop -= dt; draw(now); requestAnimationFrame(frame); return; }
  if (S.paused) { draw(now); requestAnimationFrame(frame); return; }
  S.t += dt;

  if (S.awakeT > 0) {
    // Moshe is awake and angry: wait, then lose the night
    S.awakeT -= dt;
    if (S.awakeT <= 0) { S.awakeT = 0; finish(S.wokeBy || "wake"); }
  } else if (S.playing && S.banner) {
    // banner on screen: the game waits
    S.banner.t -= dt;
    if (S.banner.t <= 0) S.banner = null;
  } else {
    if (S.sprayCD > 0) S.sprayCD -= dt;
    // campaign bedroom: the Queen comes at her random second
    if (S.playing && STAGE === "bed" && !S.q && !S.queenDone && elapsed() >= S.queenAt) queenStart();
    if (S.endless && S.playing && STAGE !== "one") updEndless(dt);
    updPull(dt);
    updClock(dt);
    if (S.q) updQueen(dt);
    if (STAGE === "one") {
      if (S.playing && !S.paused) updOne(dt);
    } else if (!S.q && !S.paused) updSpawning(dt);
  }

  updTimers(dt);
  if (STAGE === "beach" && S.playing && !S.awakeT && !S.q && !S.banner) updMosheIdle(dt);
  S.bugs.forEach(b => updBug(b, dt));
  S.bugs = S.bugs.filter(b => !b.dead);
  updEffects(dt);
  draw(now);
  requestAnimationFrame(frame);
}

// Endless (bedroom / beach): tiers, speed steps, the Queen, random events.
function updEndless(dt) {
  S.tierT = (S.tierT || 0) + dt;
  if (S.blitz) {
    // legacy 60-second mode: a new type every 9 seconds
    const nt = Math.min(ORDER[STAGE].length, Math.floor((S.dur - S.left) / 9));
    if (nt > S.tier) {
      S.tier = nt;
      S.lvl = nt * .6;
      S.intro = ORDER[STAGE][nt - 1];
      pop(W / 2, 170, TDESC[S.intro].split(" · ")[0] + "!", "#c9a0ff", 17);
    }
  } else if (!S.q && !S.paused) {
    const nt = tierOf(S.score);
    if (nt > S.tier) tierUp(nt);
  }

  // harder every 10 s: easy for the first 50 s, then lvl +0.25 per step, max at ~5 min
  S.runT = (S.runT || 0) + dt;
  const st = Math.floor(S.runT / 10);
  if (st !== S.step) {
    S.step = st;
    S.lvl = Math.min(6, st < 5 ? 0 : (st - 4) * .25);
    if (st >= 5 && st <= 28) pop(W / 2, 104, st === 28 ? "MAX SPEED" : "FASTER", "#ff9a4d", 13);
  }

  // the Queen: next visit 1.5-3 minutes later
  if (!S.blitz && !S.q && !S.paused && S.runT >= S.queenNext) {
    S.queenCount = (S.queenCount || 0) + 1;
    S.queenNext = S.runT + 90 + Math.random() * 90;
    S.queenDone = false;
    queenStart();
  }

  // random events (paused during the Queen)
  if (!S.q) {
    if (S.ev) {
      S.ev.t -= dt;
      if (S.ev.t <= 0) S.ev = null;
    } else {
      S.evT -= dt;
      if (S.evT <= 0) startEvent();
    }
  }
}

// Belly stucker: holding on it for 0.5 s pulls it out.
function updPull(dt) {
  if (!S.pull) return;
  if (S.pull.b.dead || S.pull.b.state !== "stuck") { S.pull = null; return; }
  S.pull.t += dt;
  if (S.pull.t >= .5) {
    const b = S.pull.b;
    S.pull = null;
    if (AC) tone(AC.currentTime, "sine", 500, 1400, .25, .005, .12);
    killBug(b);
    pop(b.hx, b.hy - 84, "PLOP!", "#ffc94d", 18);
  }
}

// Night clock (not in endless bedroom/beach). Stops during the Queen and after catching The One.
function updClock(dt) {
  if (!(S.playing && !S.q && !(S.one && S.one.dead) && (!S.endless || S.blitz || STAGE === "one"))) return;
  S.left -= dt;
  if (S.left <= 0) {
    S.left = 0;
    if (STAGE === "one") finish("sunrise");
    else if (S.blitz) finish("time");
    else stageWon();
  }
}

// Spawning in bedroom / beach: a max number on screen (cap) that grows with time,
// and a spawn timer that gets shorter. Swarm and fever add more and spawn faster.
function updSpawning(dt) {
  const e = elapsed() + S.lvl * 10, BCH = STAGE === "beach", EZ = !S.lvl;   // EZ = first loop (eased)
  const swarm = S.ev && S.ev.k === "swarm";
  const cap = S.playing
    ? (BCH ? (EZ ? 1 + Math.min(2, Math.floor(e / 12)) : 2 + Math.min(3, Math.floor(e / 12))) : 1 + Math.min(2, Math.floor(e / (EZ ? 14 : 10))))
    : 1;
  S.spawn -= dt * (S.feverT > 0 ? 1.8 : 1) * (swarm ? 5 : 1);
  if (S.spawn <= 0 && S.bugs.filter(b => b.state !== "out").length < cap + (swarm ? 5 : 0) + (S.feverT > 0 ? 2 : 0)) {
    if (BCH) spawnBeachWave();
    else spawnWave();
    S.spawn = S.playing
      ? (BCH ? (EZ ? Math.max(.7, 1.3 - e * .015) : Math.max(.4, .95 - e * .016)) : (EZ ? Math.max(.45, 1 - e * .015) : Math.max(.3, .85 - e * .017)))
      : 1.4;
  }
  // fat ones coming back after a bite
  S.fatQ.forEach(f => f.t -= dt);
  if (S.fatQ.length && S.fatQ[0].t <= 0) {
    S.fatQ.shift();
    if (S.playing) {
      if (BCH) spawnBeachBug("fat");
      else newBug("fat", freePoint(), 1.6);
      pop(W / 2, 120, "It's back. Full of blood.", "#ff8a8a", 13);
    }
  }
}

// Timers that run down every frame (shake, flashes, Moshe's face, wake meter, fever beat, ...).
function updTimers(dt) {
  S.shake = Math.max(0, S.shake - dt);
  S.flash = Math.max(0, S.flash - dt);
  S.bitFlash = Math.max(0, S.bitFlash - dt);
  S.bumps.forEach(u => { if (u.R && u.r < u.R) u.r = Math.min(u.R, u.r + dt * 30); });   // bumps grow in
  S.jig = Math.max(0, S.jig - dt * 2.2);
  S.smile = Math.max(0, S.smile - dt);
  S.frown = Math.max(0, S.frown - dt);
  S.wake = Math.max(0, S.wake - (S.lvl ? .02 : .03) * (1 + (S.perks.lull || 0)) * dt);   // Moshe settles down slowly
  S.rage = Math.max(0, S.rage - dt);
  if (S.feverT > 0) {
    // fever beat: a kick drum every 0.25 s
    S.feverT -= dt;
    S.beatT = (S.beatT || 0) - dt;
    if (S.beatT <= 0) {
      S.beatT = .25;
      if (AC) tone(AC.currentTime, "sine", 120, 45, .35, .003, .12);
    }
  }
  S.lampT = Math.max(0, (S.lampT || 0) - dt);
  if (S.slapLight) {
    S.slapLight.t -= dt;
    if (S.slapLight.t <= 0) S.slapLight = null;
  }
  if (S.perks.spray) sprayBtn.style.setProperty("--cd", Math.max(0, S.sprayCD / sprayMax() * 100) + "%");
}

// Beach: Moshe rolls over now and then (everything on screen is mirrored when it finishes), and snores.
function updMosheIdle(dt) {
  if (S.flipT > 0) {
    S.flipT -= dt;
    if (S.flipT <= 0) {
      S.flipT = 0;
      S.flip = !S.flip;
      S.bumps.forEach(u => u.x = W - u.x);
      S.marks.forEach(m => m.x = W - m.x);
      S.fx.forEach(f => { if (f.kind === "splat" && !f.fall) f.x = W - f.x; });
    }
  } else {
    S.flipNext = (S.flipNext ?? 18) - dt;
    if (S.flipNext <= 0) rollOver();
  }
  S.snoreT -= dt;
  if (S.snoreT <= 0) {
    S.snoreT = 3.2;
    sfx("snore");
    S.fx.push({ kind: "z", x: (S.flip ? W - 98 : 98), y: 408, vx: S.flip ? -22 : 22, vy: -34, life: 1.8 });
  }
}

// Particles, slipper marks, floating texts and slap animations: move and expire.
function updEffects(dt) {
  S.fx.forEach(f => {
    f.life -= dt;
    if (f.kind === "drop") {
      // blood drops fall with gravity and slow down
      f.vy += 700 * dt;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.vx *= .96;
    }
    if (f.kind === "z") { f.x += f.vx * dt; f.y += f.vy * dt; }
    if (f.kind === "splat" && f.fall) {
      // killed mid-air: falls to the sand (gy)
      f.vy += 600 * dt;
      f.y = Math.min(f.gy, f.y + f.vy * dt);
    }
  });
  S.fx = S.fx.filter(f => f.life > 0);
  S.marks.forEach(m => m.life -= dt);
  S.marks = S.marks.filter(m => m.life > 0);
  S.pops.forEach(p => { p.y -= 30 * dt; p.life -= dt * .9; });
  S.pops = S.pops.filter(p => p.life > 0);
  S.slaps.forEach(s => s.t += dt);
  S.slaps = S.slaps.filter(s => s.t < .45);
}
