// Place: Big Moshe asleep on the beach. Keep him asleep: misses and bites fill his wake meter.
// Wake meter full, or an empty slap on his face = a life lost.

registerPlace({
  id: "beach",
  name: "Big Moshe",
  tag: "1:30 PM · Beach, Tel Aviv",
  hint: "Keep Moshe asleep. Misses wake him. Never slap his face.",
  threshold: true,
  missions: ["calmN", "pullN", "airN"],
  types: ["coward", "pair", "faker", "stuck", "armored", "splitter"],
  tricksters: true, events: true, fever: true,
  dark: false,
  // decoys fly in and sit on Moshe like the mosquitoes (never on his face)
  trickArrive: "fly",
  trickSpot() {
    let p;
    do p = moshePoint(); while (p.zone === "face");
    return { x: p.x - Math.cos(p.ang) * 16, y: p.y - Math.sin(p.ang) * 16 };
  },

  enter() {},
  // he rolls over now and then, and snores
  update(dt) { if (!S.awakeT && !S.q) updMosheIdle(dt); },

  spawnWave: () => spawnBeachWave(),
  spawnFat() { spawnBeachBug("fat"); },
  spawnCap: e => S.lvl ? 2 + Math.min(3, Math.floor(e / 12)) : 1 + Math.min(2, Math.floor(e / 12)),
  spawnGap: e => S.lvl ? Math.max(.4, .95 - e * .016) : Math.max(.7, 1.3 - e * .015),
  // Moshe is mirrored when he lies the other way, and squeezed during the roll-over
  drawRoom(now) {
    beach(now);
    g.save();
    const sxf = S.flipT > 0 ? (S.flip ? -1 : 1) * Math.cos((1 - S.flipT / .5) * Math.PI) : (S.flip ? -1 : 1);
    g.translate(W / 2, 0);
    g.scale(sxf, 1);
    g.translate(-W / 2, 0);
    moshe(now);
    g.restore();
  },
});
