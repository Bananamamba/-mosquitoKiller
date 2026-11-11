// Slipper shop: buy slippers with saved coins, and pick one before each run.
// The slippers, prices and perks are in CFG.slippers. Saved: mosq-owned, mosq-slipper.

let OWNED = load("mosq-owned", ["basic"]);   // ids of slippers the player has
let SLIPPER = load("mosq-slipper", "basic"); // the one picked last (default for the next run)

const slipperDef = id => CFG.slippers.find(s => s.id === id) || CFG.slippers[0];
const currentSlipper = () => slipperDef(OWNED.includes(SLIPPER) ? SLIPPER : "basic");
// A perk of the slipper in use, e.g. slipperPerk("hitMult", 1).
const slipperPerk = (key, fallback) => currentSlipper()[key] ?? fallback;

function buySlipper(id) {
  const s = slipperDef(id);
  if (OWNED.includes(id) || COINS < s.price) return;
  COINS -= s.price;
  OWNED.push(id);
  SLIPPER = id;   // a new slipper is picked right away
  save("mosq-coins", COINS);
  save("mosq-owned", OWNED);
  save("mosq-slipper", SLIPPER);
  showShop();
}

// One card: a drawn preview, name, one-line perk, and a price/state line.
function slipperCard(s, tail, tag, extra) {
  return `<${tag} class="slipcard${extra || ""}"${tag === "button" ? ` type="button" data-pick="${s.id}"` : ""}>`
    + `<canvas class="slip" data-skin="${s.id}" width="128" height="168"></canvas>`
    + `<b>${s.name}</b><span>${s.perk}</span>${tail}</${tag}>`;
}

function showShop() {
  const cards = CFG.slippers.map(s => {
    const owned = OWNED.includes(s.id);
    const tail = owned ? `<i>Owned</i>`
      : `<button type="button" class="buy" data-buy="${s.id}"${COINS < s.price ? " disabled" : ""}>Buy · ${s.price}</button>`;
    return slipperCard(s, tail, "div");
  }).join("");
  ov.innerHTML = `<h2>Slipper shop</h2><p>Your coins: <b class="coins">${COINS}</b></p>`
    + `<div class="shop">${cards}</div>`
    + `<div class="btns"><button type="button" class="beach" data-menu="1">Back</button></div>`
    + debugShopButtons();
  ov.hidden = false;
  drawPreviews();
}

// Before a run: pick one of your slippers (skipped if you only have the basic one).
function showPicker() {
  if (OWNED.length < 2) { startRun(); return; }
  const mine = CFG.slippers.filter(s => OWNED.includes(s.id));
  const cur = currentSlipper().id;
  ov.innerHTML = `<h2>Pick your slipper</h2>`
    + `<div class="shop">${mine.map(s => slipperCard(s, "", "button", s.id === cur ? " sel" : "")).join("")}</div>`
    + `<div class="btns"><button type="button" data-go="1">Go!</button></div>`;
  ov.hidden = false;
  drawPreviews();
}

function pickSlipper(id) {
  if (!OWNED.includes(id)) return;
  SLIPPER = id;
  save("mosq-slipper", SLIPPER);
  showPicker();
}

// Draw each card's slipper picture with the same code the game uses.
function drawPreviews() {
  ov.querySelectorAll("canvas.slip").forEach(cvEl => {
    const c = cvEl.getContext("2d");
    c.setTransform(2, 0, 0, 2, 0, 0);   // canvas is 2x for sharpness
    slipper(32, 42, .72, -.25, 1, cvEl.dataset.skin, c);
  });
}
