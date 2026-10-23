// What happens when a mosquito bites you, gets squashed, splits or dodges.

// Points per kill by type (before multipliers).
const POINTS = { norm: 1, gold: 5, coward: 2, faker: 2, pair: 1, fat: 3, armored: 3, splitter: 2, mini: 1, stuck: 4 };

function bite(b) {
  if (!S.playing || S.awakeT > 0) return;
  S.bites++;
  sfx("bite");
  S.bitFlash = .35;
  if (STAGE === "beach") {
    // a red bump grows where it bit; Moshe frowns and stirs
    S.bumps.push({ x: b.hx, y: b.hy, r: 0, R: 6 + Math.random() * 3 });
    S.frown = 1.4;
    S.jig = .6;
    wakeAdd((S.lvl ? .06 : .045) * Math.pow(.6, S.perks.thick || 0));
    pop(b.hx, b.hy - 44, Math.random() < .5 ? "OUCH!" : "*scratch*", "#ff8a8a", 15);
  } else pop(b.hx, b.hy - 40, "Bitten!", "#ff8a8a", 14);

  // half the time it comes back 2-4 s later as a fat, blood-filled one
  if (b.type !== "fat" && Math.random() < .5) S.fatQ.push({ t: 2 + Math.random() * 2 });

  if (S.endless && STAGE !== "one" && b.type !== "mini") {
    // endless: every escape is a strike, three = game over
    S.strikes = (S.strikes || 0) + 1;
    pop(W / 2, 110, "✕ ONE GOT AWAY", "#ff5a6e", 18);
    S.shake = RM ? .05 : .15;
    S.shakeA = 0;
    if (S.strikes >= 3) { finish("escaped"); return; }
  } else if (STAGE === "bed" && S.bites >= maxBites()) finish("bitten");
}

// quiet = no slap sound / hit-stop (used by the bug spray).
function killBug(b, quiet) {
  b.dead = true;
  buzzStop(b, true);   // the buzz cuts off instantly: silence is the reward
  S.streak++;
  S.kills++;
  feverAdd(b.type === "gold" ? .15 : .07);
  if (S.perks.rage && S.streak % 10 === 0) { S.rage = 3; pop(W / 2, 150, "RAGE SLIPPER", "#ff8a3d", 22); }

  // score: base + clutch bonus (hit in the last quarter before it bites), times all multipliers
  const m = mult(), base = POINTS[b.type] || 1;
  const clutch = b.state === "on" && b.st > b.life * .75;
  const pts = (base + (clutch ? 1 : 0)) * m * (1 + (S.perks.dbl || 0)) * (S.feverT > 0 ? 3 : 1) * ((S.ev && S.ev.k === "heat") ? 2 : 1);
  const fat = b.type === "fat";
  S.score += pts;
  if (!quiet) {
    sfx(fat ? "fatsplat" : "slap", S.streak);
    if (b.type === "gold") sfx("gold");
    S.stop = fat ? .1 : .06;   // hit-stop: the game freezes for a moment
    S.shake = RM ? .05 : fat ? .22 : .14;
    S.shakeA = Math.random() * 6.28;
    S.flash = .08;
  }

  // splat stays on the wall; a mosquito killed mid-air on the beach falls to the sand
  const air = b.beach && b.state === "fly";
  S.fx.push({
    kind: "splat", fall: air, vy: 0, gy: 478 + Math.random() * 50, x: b.x, y: b.y, life: 5, face: b.face, type: b.type, r: fat ? 14 : 8,
    dots: Array.from({ length: fat ? 16 : 8 }, () => [(Math.random() - .5) * (fat ? 60 : 34), (Math.random() - .5) * (fat ? 60 : 34), 1 + Math.random() * (fat ? 5 : 3.2)])
  });
  // blood drops
  const n = fat ? 40 : 16;
  for (let i = 0; i < n; i++) {
    const an = Math.random() * 6.28, sp = 140 + Math.random() * (fat ? 420 : 300);
    S.fx.push({ kind: "drop", x: b.x, y: b.y, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp - 60, r: 1 + Math.random() * (fat ? 4 : 2.5), life: .5 + Math.random() * .5 });
  }
  pop(b.x, b.y - 60, "+" + pts, b.type === "gold" ? "#ffc94d" : "#e8eef7", b.type === "gold" || fat ? 22 : 18);
  if (clutch) pop(b.x, b.y - 84, "CLUTCH", "#7fe0ff", 14);
  if (b.type === "splitter") split(b);

  // killing a fat one gives a bite back (and removes the nearest bump on Moshe)
  if (fat) {
    if (S.bites > 0) S.bites--;
    if (S.bumps.length) {
      let i = 0, bd = 1e9;
      S.bumps.forEach((u, k) => {
        const dd = Math.hypot(u.x - b.x, u.y - b.y);
        if (dd < bd) { bd = dd; i = k; }
      });
      S.bumps.splice(i, 1);
    }
    pop(b.x, b.y - 84, "BLOOD BACK", "#ff8a8a", 14);
  }

  // streak messages: x2 at 5, and a bonus every 10 in a row
  if (S.streak === 5) pop(W / 2, 96, `STREAK x${m}`, "#ffc94d", 22);
  if (S.streak % 10 === 0) {
    const sb = S.streak * 2;
    S.score += sb;
    pop(W / 2, 126, `${S.streak} IN A ROW! +${sb}`, "#ffc94d", 22);
    sfx("wave");
  }
  if (S.endless && S.streak % 25 === 0 && S.strikes > 0) {
    S.strikes--;
    pop(W / 2, 156, "Strike cleared!", "#9be59b", 16);
  }
}

// Splitter: three minis burst out around it.
function split(b) {
  pop(b.x, b.y - 84, "SPLIT!", "#c9a0ff", 16);
  for (let i = 0; i < 3; i++) {
    if (b.beach) {
      const m = spawnBeachBug("mini");
      m.sx = m.x = b.x;
      m.sy = m.y = b.y;
      m.dur = .7;
    } else {
      const a = i * 2.1 + Math.random();
      const m = newBug("mini", { x: Math.max(30, Math.min(W - 30, b.x + Math.cos(a) * 55)), y: Math.max(70, Math.min(470, b.y + Math.sin(a) * 55)), zone: null }, .8);
      m.a = 1;
      m.state = "on";
    }
  }
}

// Coward: dodges the first slap and reappears somewhere else.
function dodge(b) {
  b.scared = true;
  sfx("squeak");
  pop(b.x, b.y - 56, "Nope!", "#cfe6ff", 15);
  if (b.beach) {
    const p = moshePoint(), off = 16 * b.sc;
    b.sx = b.x; b.sy = b.y;
    b.tx = p.x - Math.cos(p.ang) * off;
    b.ty = p.y - Math.sin(p.ang) * off;
    b.hx = p.x; b.hy = p.y;
    b.zone = p.zone;
    b.ang = p.ang;
    b.state = "fly";
    b.st = 0;
    b.dur = .6;
    b.blood = 0;
    return;
  }
  const p = freePoint();
  b.hx = p.x; b.hy = p.y;
  b.zone = p.zone;
  b.state = "in";
  b.st = 0;
  b.life = .75;
  b.a = 0;
}

// A miss: streak back to 0 (and fever drains a bit in endless).
function breakStreak() {
  if (S.endless && !(S.feverT > 0)) S.fever = Math.max(0, (S.fever || 0) - .25);
  if (S.streak >= 5) pop(W / 2, 96, "Streak lost", "#93a0c4", 15);
  S.streak = 0;
}
