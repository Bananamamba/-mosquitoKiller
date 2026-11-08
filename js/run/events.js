// Good surprises for places with events/fever: random events (golden hour, heat wave) and fever.

// ---------- random events ----------

// [title, color]
const EVTXT = {
  gold: ["GOLDEN HOUR!", "#ffc94d"],
  heat: ["HEAT WAVE! x2 points", "#ff9a4d"]
};

function startEvent() {
  const k = ["gold", "heat"][Math.random() * 2 | 0], sec = CFG.events[k].sec;
  S.ev = { k, t: sec, max: sec };
  S.evT = rand(CFG.events.gap);
  pop(W / 2, 140, EVTXT[k][0], EVTXT[k][1], 22);
  sfx(k === "gold" ? "gold" : "wave");
}

// Paused during the Queen.
function updEvents(dt) {
  if (S.q) return;
  if (S.ev) {
    S.ev.t -= dt;
    if (S.ev.t <= 0) S.ev = null;
  } else {
    S.evT -= dt;
    if (S.evT <= 0) startEvent();
  }
}

const heatOn = () => S.ev && S.ev.k === "heat";

// ---------- fever ----------

// Kills fill the fever meter; full = a few seconds of extra points, big slipper, beat, pink screen.
function feverAdd(v) {
  if (!currentPlace().fever || S.feverT > 0) return;
  S.fever = Math.max(0, Math.min(1, (S.fever || 0) + v));
  if (S.fever >= 1) {
    S.fever = 0;
    S.feverT = CFG.fever.sec;
    sfx("fever");
    pop(W / 2, 150, "FEVER!", "#ff6ad5", 30);
  }
}
