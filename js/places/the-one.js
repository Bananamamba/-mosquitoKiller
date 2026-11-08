// Place: The One. Total darkness, one smart mosquito. No score threshold: catching it moves on.
// Out of slaps, out of time or bitten too often = a life lost. No tricksters here.
// The mosquito's own logic is in js/the-one.js.

registerPlace({
  id: "one",
  name: "The One",
  tag: "3:12 AM · Just one mosquito",
  hint: "Hold to listen with your hand. Let go to slap. When the buzz stops, it has landed.",
  threshold: false,
  missions: ["slapsN", "noLamp", "airCatch"],
  types: [],
  tricksters: false, events: false, fever: false,
  dark: true,

  enter() {
    oneStart();
    lampBtn.hidden = false;
  },
  leave() {
    lampBtn.hidden = true;
    S.hold = false;
  },
  update(dt) {
    updOne(dt);
    // the night clock (stops once it is caught)
    if (S.one && !S.one.dead) {
      S.left -= dt;
      if (S.left <= 0) { S.left = 0; loseLife("sunrise"); }
    }
  },

  // hold = listen, release = slap
  onPress(p, e) {
    try { cv.setPointerCapture(e.pointerId); } catch (err) {}
    S.hold = true;
    S.ear = p;
    return true;
  },
  onMove(p) { if (S.hold) S.ear = p; },
  onRelease() { if (S.hold) { S.hold = false; oneSlap(S.ear); } },

  drawRoom: bedroom,
});
