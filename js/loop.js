// Main loop: one update + draw per animation frame.

let last = performance.now();

function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000);   // seconds, capped so a hiccup can't jump too far
  last = now;
  // hit-stop: freeze the game for a moment after a hit, but keep drawing
  if (S.stop > 0) { S.stop -= dt; draw(now); requestAnimationFrame(frame); return; }
  if (S.paused) { draw(now); requestAnimationFrame(frame); return; }
  S.t += dt;
  const place = currentPlace();

  if (S.awakeT > 0) {
    // Moshe is awake and angry: wait, then the life is lost
    S.awakeT -= dt;
    if (S.awakeT <= 0) { S.awakeT = 0; loseLife(S.wokeBy || "wake"); }
  } else if (S.playing && S.banner) {
    // banner on screen: the game waits; queued banners follow
    S.banner.t -= dt;
    if (S.banner.t <= 0) S.banner = S.banners.shift() || null;
  } else if (S.playing) {
    // any of these may lose a life and move to the next place, so later steps check same()
    const same = () => S.playing && currentPlace() === place;
    if (place.update) place.update(dt);
    if (place.events) updEvents(dt);
    updTricksters(dt);
    updEffectTimers(dt);
    updSlowTaps(dt);
    updPull(dt);
    if (S.q) updQueen(dt);
    if (place.spawnWave && !S.q && same()) updSpawning(dt, place);
    if (same()) updRun(dt);
  } else if (place.spawnWave) {
    // menu / end screen: a few silent mosquitoes in the background
    updSpawning(dt, place);
  }

  updTimers(dt);
  S.bugs.forEach(b => updBug(b, dt));
  S.bugs = S.bugs.filter(b => !b.dead);
  updParticles(dt);
  draw(now);
  requestAnimationFrame(frame);
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
    missionEvent("pull");
    killBug(b);
    pop(b.hx, b.hy - 84, "PLOP!", "#ffc94d", 18);
  }
}

// Spawning: a max number on screen (cap) that grows with pressure, and a spawn timer that gets shorter.
// The place sets both; fever and the "bad luck" effect add more and spawn faster.
function updSpawning(dt, place) {
  const e = pressure(), more = effectOn("moreEnemies") ? CFG.effects.moreEnemies : null;
  const cap = S.playing ? place.spawnCap(e) : 1;
  S.spawn -= dt * (S.feverT > 0 ? 1.8 : 1) * (more ? more.spawnMult : 1);
  if (S.spawn <= 0 && S.bugs.filter(b => b.state !== "out").length < cap + (more ? more.capAdd : 0) + (S.feverT > 0 ? 2 : 0)) {
    place.spawnWave();
    S.spawn = S.playing ? place.spawnGap(e) : 1.4;
  }
  // fat ones coming back after a bite
  S.fatQ.forEach(f => f.t -= dt);
  if (S.fatQ.length && S.fatQ[0].t <= 0) {
    S.fatQ.shift();
    if (S.playing) {
      place.spawnFat();
      pop(W / 2, 120, "It's back. Full of blood.", "#ff8a8a", 13);
    }
  }
}

// Timers that run down every frame (shake, flashes, Moshe's face, wake meter, fever beat, ...).
function updTimers(dt) {
  S.shake = Math.max(0, S.shake - dt);
  S.flash = Math.max(0, S.flash - dt);
  S.bitFlash = Math.max(0, S.bitFlash - dt);
  S.fade = Math.max(0, (S.fade || 0) - dt);
  S.bumps.forEach(u => { if (u.R && u.r < u.R) u.r = Math.min(u.R, u.r + dt * 30); });   // bumps grow in
  S.jig = Math.max(0, S.jig - dt * 2.2);
  S.smile = Math.max(0, S.smile - dt);
  S.frown = Math.max(0, S.frown - dt);
  S.wake = Math.max(0, S.wake - (S.lvl ? .02 : .03) * dt);   // Moshe settles down slowly
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
function updParticles(dt) {
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
