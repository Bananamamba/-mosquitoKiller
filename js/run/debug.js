// Test mode (open the game with ?debug): shows how many seconds each place took,
// so the thresholds in config.js can be tuned after playtesting. Also printed to the console.

function drawDebug() {
  if (!DEBUG || !S.placeTimes) return;
  const rows = S.placeTimes.slice(-6).map(t => `${t.name} L${t.loop}: ${t.sec.toFixed(1)}s${t.cleared ? "" : " ✗"}`);
  const place = currentPlace();
  rows.unshift(`NOW ${place.name} L${S.lvl + 1}: ${S.placeT.toFixed(1)}s` + (place.threshold ? ` · ${S.score - S.placeStart}/${S.threshold}` : ""));
  g.save();
  g.fillStyle = "rgba(0,0,0,.6)";
  g.fillRect(4, 96, 200, 14 * rows.length + 8);
  g.font = "10px monospace";
  g.textAlign = "left";
  g.fillStyle = "#7fe0ff";
  rows.forEach((r, i) => g.fillText(r, 10, 110 + i * 14));
  g.restore();
}

// Shop test buttons, shown in the shop only in test mode (players never see them).
function debugShopButtons() {
  if (!DEBUG) return "";
  return `<div class="btns debug"><button type="button" data-dbg="unlock">Unlock all slippers</button>`
    + `<button type="button" data-dbg="reset">Reset shop</button></div>`;
}

function debugShop(action) {
  if (!DEBUG) return;
  if (action === "unlock") {
    OWNED = CFG.slippers.map(s => s.id);   // owned for free, coins untouched
  } else if (action === "reset") {
    OWNED = ["basic"];                     // back to a brand-new player
    SLIPPER = "basic";
    COINS = 0;
  }
  save("mosq-owned", OWNED);
  save("mosq-slipper", SLIPPER);
  save("mosq-coins", COINS);
  showShop();
}
