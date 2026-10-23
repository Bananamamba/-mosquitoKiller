// Menu and overlay buttons: the main menu, the lives row, and one click handler for every overlay button.

// Three mosquito heads = campaign lives (n left), as inline SVG for the overlay screens.
function headsHTML(n) {
  const one = on => `<svg width="36" height="36" viewBox="-20 -20 40 40" style="opacity:${on ? 1 : .2}" aria-hidden="true">`
    + `<path d="M8 5 L18 13" stroke="#2b1a12" stroke-width="2.5" stroke-linecap="round"/>`              // needle
    + `<path d="M-8 -9 L-13 -17 M8 -9 L13 -17" stroke="#3b2b2b" stroke-width="2" stroke-linecap="round"/>` // antennae
    + `<circle r="12" fill="#3b2b2b"/>`
    + `<circle cx="-5" cy="-3" r="4.2" fill="#e2354b"/><circle cx="5" cy="-3" r="4.2" fill="#e2354b"/>`  // eyes
    + `<circle cx="-4" cy="-4" r="1.3" fill="#fff"/><circle cx="6" cy="-4" r="1.3" fill="#fff"/>`
    + `<path d="M-5 5 Q0 9.5 5 5" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/>`  // grin
    + `</svg>`;
  return `<div style="display:flex;gap:8px;justify-content:center" role="img" aria-label="${n} of 3 lives left">`
    + [0, 1, 2].map(i => one(i < n)).join("")
    + `</div>`;
}

// Main menu: three endless rooms (with records) and the campaign (with "Continue run" if saved).
function showMenu() {
  const ck = savedCk();
  S.ck = ck;
  const rec = k => {
    const r = EREC[k];
    return r && r.k ? `<i>Best: ${r.k} ${k === "one" ? "caught" : k.startsWith("b_") ? "kills" : `points · tier ${r.t}`}</i>` : `<i>No record yet</i>`;
  };
  ov.innerHTML = `<h2>Something's<br>buzzing.</h2><p class="small" style="font-weight:800;letter-spacing:.12em;color:var(--lamp)">ENDLESS</p><div class="cards">
    <button type="button" class="card" data-endless="bed"><b>Bedroom swarm</b><span>Dark room. Tap them when the light finds them. Gets harder every 10 seconds. Three escape and you're out.</span>${rec("s_bed")}</button>
    <button type="button" class="card" data-endless="beach"><b>Big Moshe</b><span>Keep Moshe asleep. Misses wake him. Never slap his face.</span>${rec("s_beach")}</button>
    <button type="button" class="card" data-endless="one"><b>The One</b><span>One smart mosquito in the dark. Each catch, the next is smarter.</span>${rec("one")}</button>
  </div><p class="small" style="font-weight:800;letter-spacing:.12em;color:var(--lamp)">CAMPAIGN</p><div class="cards">
    <button type="button" class="card" data-run="1"><b>Full run</b><span>All rooms in a row. Three lives: lose a night, lose a life, and move on.</span></button>
    ${ck && ck.idx > 0 ? `<button type="button" class="card" data-retry="1"><b>Continue run</b><span>From Night ${ck.idx + 1} · ${ck.lives ?? 3} ${(ck.lives ?? 3) === 1 ? "life" : "lives"} left</span></button>` : ""}
  </div><p class="small">Sound on. Headphones help.</p>`;
  ov.hidden = false;
}

// Every overlay button says what it does with a data-* attribute.
ov.addEventListener("click", e => {
  const btn = sel => e.target.closest(sel);
  const pc = btn("button[data-pick]");
  if (pc) { reveal(+pc.dataset.pick); return; }            // legacy card pick
  if (btn("button[data-cont]")) { startStage(S.idx + 1); return; }
  const bz = btn("button[data-blitz]");
  if (bz) { startBlitz(bz.dataset.blitz); return; }         // legacy 60-second mode
  const en = btn("button[data-endless]");
  if (en) { startEndless(en.dataset.endless); return; }
  if (btn("button[data-resume]")) { resumeEndless(); return; }
  const rm = btn("button[data-room]");
  if (rm) { playRoom(rm.dataset.room); return; }
  if (btn("button[data-menu]")) { showMenu(); return; }
  if (btn("button[data-retry]")) { retry(S.ck || savedCk()); return; }
  if (btn("button[data-run]")) startRun();
});
