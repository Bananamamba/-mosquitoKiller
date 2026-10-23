// Campaign (full run): Bedroom → Big Moshe → The One → repeat, each loop harder.
// Three lives; progress is saved so the run can be continued from the menu.
// Winning/losing a night is handled in stage.js (stageWon / finish).

function startRun() {
  S.solo = false;
  S.endless = false;
  S.lives = 3;
  audioOn();
  S.perks = {};
  S.taken = [];
  S.score = 0;
  S.kills = 0;
  startStage(0);
}

// "Continue run": restore the saved checkpoint and start that night.
function retry(ck) {
  if (!ck) return;
  S.solo = false;
  S.endless = false;
  S.lives = ck.lives ?? 3;
  audioOn();
  S.perks = { ...ck.perks };
  S.taken = [...ck.taken];
  S.score = ck.score;
  S.kills = ck.kills;
  startStage(ck.idx);
}

function savedCk() {
  try { return JSON.parse(localStorage.getItem("mosq-ck") || "null"); } catch (e) { return null; }
}
