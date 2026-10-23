// Big Moshe (beach): hit zones, landing spots, the wake meter, rolling over, and slaps on him.
// Coordinates are for Moshe lying with his head on the left; S.flip mirrors them.

// What did a tap at (x, y) hit? "face", "body" or null (sand). Nothing while he rolls over.
function zoneAt(x, y) {
  if (S.flipT > 0) return null;
  if (S.flip) x = W - x;
  if (STAGE !== "beach") return null;
  if (Math.hypot(x - 76, y - 413) < 26) return "face";
  if (Math.hypot(x - 64, y - 436) < 38) return "body";                           // head
  if (y < 474 && ((x - 205) / 126) ** 2 + ((y - 468) / 173) ** 2 < 1) return "body"; // belly
  if (((x - 112) / 46) ** 2 + ((y - 440) / 38) ** 2 < 1) return "body";           // neck/shoulder
  if (x > 100 && x < 230 && y > 446 && y < 476) return "body";                   // arm
  if (x > 274 && x < 358 && y > 418 && y < 476) return "body";                   // legs
  return null;
}

// Random landing spot on Moshe's skin: {x, y, zone, ang} where ang points into the skin.
// The face is rare (and never two mosquitoes on it at once).
function moshePoint() {
  let r = Math.random();
  if (r >= .58 && r < .7 && (Math.random() < .65 || S.bugs.some(b => b.zone === "face" && !b.dead && b.state !== "out"))) r = .2;
  let x, y, nx, ny, zone = "body";
  if (r < .5) {
    // belly
    const th = (-168 + Math.random() * 156) * Math.PI / 180;
    x = 205 + 118 * Math.cos(th);
    y = Math.min(452, 468 + 165 * Math.sin(th));
    nx = Math.cos(th) / 118;
    ny = Math.sin(th) / 165;
  } else if (r < .58) {
    // shoulder
    const th = (-130 + Math.random() * 60) * Math.PI / 180;
    x = 112 + 42 * Math.cos(th);
    y = 440 + 34 * Math.sin(th);
    nx = Math.cos(th) / 42;
    ny = Math.sin(th) / 34;
  } else if (r < .7) {
    // face
    const th = (-105 + Math.random() * 75) * Math.PI / 180;
    x = 64 + 34 * Math.cos(th);
    y = 436 + 34 * Math.sin(th);
    nx = Math.cos(th);
    ny = Math.sin(th);
    zone = "face";
  } else if (r < .8) {
    // arm
    x = 128 + Math.random() * 80;
    y = 452;
    nx = 0;
    ny = -1;
  } else if (r < .94) {
    // legs
    x = 300 + Math.random() * 36;
    y = 432 + (x - 296) * .12;
    nx = -.1;
    ny = -1;
  } else {
    // foot
    x = 348;
    y = 426 + Math.random() * 8;
    nx = .3;
    ny = -1;
  }
  const L = Math.hypot(nx, ny);
  nx /= L;
  ny /= L;
  if (S.flip) { x = W - x; nx = -nx; }
  return { x, y, zone, ang: Math.atan2(-ny, -nx) };
}

// Raise the wake meter. Full = he wakes up, everything flies away, and the night is lost.
function wakeAdd(v) {
  if (STAGE !== "beach" || S.awakeT > 0) return;
  v *= Math.pow(.7, S.perks.deep || 0);
  S.wake = Math.min(1, S.wake + v);
  if (S.wake >= 1) {
    S.wokeBy = S.wokeBy || "wake";
    S.awakeT = 1.8;   // angry pause before the result screen
    sfx("angry");
    S.shake = RM ? .1 : .45;
    S.shakeA = 0;
    S.bugs.forEach(b => buzzStop(b, true));
    S.bugs = [];
    if (S.q) { droneStop(S.q); S.q = null; }
    pop(W / 2, 118, "WHO'S SLAPPING ME?!", "#ff8a8a", 17);
  }
}

// Every ~15-30 s he rolls over: head switches sides, landed mosquitoes fly off,
// and flying ones re-aim at the mirrored spot.
function rollOver() {
  S.flipNext = (S.lvl ? 14 : 20) + Math.random() * 10;
  S.flipT = .5;
  S.pull = null;
  sfx("oi", 1);
  pop(W / 2, 180, "*Moshe rolls over*", "#ffe0c0", 16);
  S.bugs.forEach(b => {
    if (!b.beach || b.dead) return;
    if (b.state === "land" || b.state === "bite" || b.state === "stuck") {
      b.state = "out";
      b.st = 0;
      b.vx = (Math.random() - .5) * 300;
      b.vy = -260;
      b.hd = Math.atan2(b.vy, b.vx);
    } else if (b.state === "fly") {
      const p = moshePoint(), np = { ...p, x: W - p.x, ang: Math.PI - p.ang }, off = 16 * b.sc;
      b.hx = np.x; b.hy = np.y;
      b.zone = np.zone;
      b.ang = np.ang;
      b.tx = np.x - Math.cos(np.ang) * off;
      b.ty = np.y - Math.sin(np.ang) * off;
    }
  });
}

// Empty slap on the face = instant loss (unless the Steady Hand perk forgives it).
function faceSlap() {
  if (S.awakeT > 0) return;
  if ((S.perks.steady || 0) > S.steadyUsed) {
    S.steadyUsed++;
    S.frown = 1.5;
    S.jig = .5;
    sfx("oi");
    pop((S.flip ? W - 70 : 70), 372, "Hmmph... (Steady Hand)", "#ffe0c0", 14);
    return;
  }
  S.wokeBy = "face";
  S.wake = 1;
  S.awakeT = 2;
  sfx("angry");
  S.shake = RM ? .1 : .6;
  S.shakeA = 0;
  S.bugs.forEach(b => buzzStop(b, true));
  S.bugs = [];
  pop(W / 2, 118, "WHO SLAPPED ME?!", "#ff8a8a", 18);
}

// A slap that landed on/near Moshe. killed = it squashed a mosquito; soft = gentler (dodge, Queen miss).
function mosheSlap(p, killed, soft) {
  if (STAGE !== "beach" || !S.playing) return;
  const z = zoneAt(p.x, p.y);
  // missed him (sand): an empty slap still makes noise
  if (!z) {
    if (!killed) wakeAdd((soft ? .02 : .04) * (S.lvl ? 1 : .5));
    return;
  }
  // face: a kill is allowed but wakes him a lot; an empty slap loses the night
  if (z === "face") {
    if (killed) {
      wakeAdd(.3);
      S.frown = 1.5;
      S.jig = .5;
      sfx("oi");
      pop((S.flip ? W - 70 : 70), 372, "HNNGH!", "#ff8a8a", 18);
    } else faceSlap();
    return;
  }
  // body: red slipper mark; a kill sometimes makes him smile, a miss wakes him a bit
  S.jig = 1;
  S.marks.push({ x: p.x, y: p.y, rot: -.4 + Math.random() * .3, life: 2.5 });
  if (killed) {
    if (Math.random() < .35) { S.smile = 1.2; pop(p.x + 30, p.y - 24, "hehe", "#ffe0c0", 14); }
  } else {
    wakeAdd((soft ? .05 : .1) * (S.lvl ? 1 : .6));
    pop(p.x + 28, p.y - 26, "mmph", "#ffe0c0", 14);
    sfx("oi", 1);
  }
}
