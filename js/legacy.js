// LEGACY: code from earlier versions that the current game can no longer reach.
// Removed on purpose (see GAME_NOTES.md: "Removed on purpose"): upgrade cards, the 60-second mode.
// Kept unchanged so the split did not change anything. Perk checks elsewhere (S.perks.*) still read 0.
// Deleting this file needs a decision first.

// Unused time formatter (m:ss).
const fmt = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

// ---------- upgrade cards: g = good, p = mixed (incl. curses), r = risky deals ----------
// Each card: [name, description, perk changes]
const CARD = {
  g: [
    ["Wide Slipper", "Bigger hit area.", { wide: 1 }],
    ["Heavy Air", "Mosquitoes are slower.", { slow: 1 }],
    ["Deep Sleeper", "Misses wake Moshe 30% less.", { deep: 1 }],
    ["Lullaby", "Moshe settles down faster.", { lull: 1 }],
    ["Night Vision", "The dark is lighter. One extra lamp flick.", { vision: 1 }],
    ["Thick Skin", "More bites before you're out.", { thick: 1 }]
  ],
  p: [
    ["Gold Rush", "More golden mosquitoes.", { gold: 1 }],
    ["Bug Spray", "A button that wipes out every mosquito on screen.", { spray: 1 }],
    ["Rage Slipper", "Every 10-hit streak: 3 seconds of a giant slipper.", { rage: 1 }],
    ["Steady Hand", "Once per night, one slap to Moshe's face is forgiven.", { steady: 1 }],
    ["Sweaty Hands", "CURSE · Smaller hit area.", { wide: -1 }],
    ["Light Sleeper", "CURSE · Moshe wakes up faster.", { deep: -1 }],
    ["Itchy", "CURSE · Fewer bites before you're out.", { thick: -1 }],
    ["Espresso Mosquitoes", "CURSE · Mosquitoes are faster.", { slow: -1 }]
  ],
  r: [
    ["Glass Cannon", "Double points for the rest of the run. But fewer bites before you're out.", { dbl: 1, thick: -1 }],
    ["Chemical Warfare", "Bug Spray that recharges fast. But mosquitoes are faster.", { spray: 2, slow: -1 }],
    ["Blood Pact", "Rage Slipper and a wider slipper. But Moshe wakes faster.", { rage: 1, wide: 1, deep: -1 }],
    ["Golden Curse", "Golden mosquitoes everywhere. But fewer bites before you're out.", { gold: 3, thick: -1 }],
    ["Insomnia", "Two forgiven face slaps per night. But Moshe never settles down.", { steady: 2, lull: -1 }]
  ]
};

// Reveal the picked card (S.offer is never filled anymore, so this never runs).
function reveal(i) {
  const [c, card] = S.offer[i];
  for (const k in card[2]) S.perks[k] = (S.perks[k] || 0) + card[2][k];
  S.taken.push(card[0]);
  if (S.perks.spray > 0) S.sprayCD = 0;
  const curse = card[1].startsWith("CURSE");
  sfx(curse ? "angry" : "gold");
  ov.innerHTML = `<h2>${curse ? "Cursed!" : c === "r" ? "A deal is a deal." : "Nice."}</h2><div class="backs">${S.offer.map(([cc, cd], j) => `<div class="face ${cc}${j === i ? " mine" : ""}"><b>${cd[0]}</b><span>${cd[1]}</span></div>`).join("")}</div><p class="small">The faded cards are what you could have had.</p><div class="btns">${S.endless ? `<button type="button" data-resume="1">Keep going</button>` : `<button type="button" data-cont="1">Next night</button>`}</div>`;
}

// After a card in endless.
function resumeEndless() {
  ov.hidden = true;
  S.paused = false;
  sprayBtn.hidden = !(S.perks.spray > 0);
  banner(`TIER ${S.tier}`, S.tierDesc, 2);
}

// ---------- Bug Spray perk: kills everything on screen, then a cooldown ----------
function spray() {
  if (!S.playing || STAGE === "one" || S.banner || S.paused || S.sprayCD > 0 || S.awakeT > 0 || !S.perks.spray) return;
  S.sprayCD = sprayMax();
  sfx("spray");
  let n = 0;
  S.bugs.forEach(b => {
    if (!b.dead && b.state !== "out") { killBug(b, true); n++; }
  });
  for (let i = 0; i < 14; i++) S.fx.push({ kind: "cloud", x: 40 + Math.random() * 280, y: 220 + Math.random() * 240, r: 20 + Math.random() * 30, life: 1.2 });
  pop(W / 2, 200, n ? `SPRAYED x${n}` : "Pssht.", "#9be59b", 18);
}
sprayBtn.addEventListener("pointerdown", e => { e.preventDefault(); spray(); });
addEventListener("keydown", e => { if (e.key === "s" || e.key === "S") spray(); });

// ---------- 60-second mode ("blitz") ----------
function startBlitz(st) {
  startEndless(st);
  S.blitz = true;
  S.dur = S.left = 60;
  S.nextQueen = 1e9;
  document.getElementById("tag").textContent = "60 seconds · " + ROOMS[st];
  document.getElementById("hint").textContent = st === "beach" ? "How many in 60 seconds? Moshe can still wake up." : "How many in 60 seconds? Bites don't end it here.";
  banner("60 SECONDS", "How many can you squash?", 2);
}
