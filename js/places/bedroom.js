// Place: the dark bedroom. Mosquitoes appear in the flashlight and vanish fast; escaped ones bite.
// Too many bites = a life lost. The Queen can show up (from the second loop).

registerPlace({
  id: "bed",
  name: "Bedroom swarm",
  tag: "3:07 AM · Lights off",
  hint: "Tap mosquitoes when the light finds them. Too many bites and you lose a life.",
  threshold: true,
  missions: ["killN", "streakN", "goldN"],
  types: ["coward", "pair", "faker", "armored", "splitter"],
  tricksters: true, events: true, fever: true,
  dark: true,

  enter(loop) {
    const c = CFG.queen;
    if (loop >= c.fromLoop && Math.random() < c.chance) S.queenAt = rand(c.at);
  },
  update() {
    if (!S.q && !S.queenDone && S.placeT >= S.queenAt) queenStart();
  },

  spawnWave,
  spawnFat() { newBug("fat", freePoint(), 1.6); },
  // e = seconds in the place + loop * 10; the first loop is eased
  spawnCap: e => 1 + Math.min(2, Math.floor(e / (S.lvl ? 10 : 14))),
  spawnGap: e => S.lvl ? Math.max(.3, .85 - e * .017) : Math.max(.45, 1 - e * .015),
  drawRoom: bedroom,
});
