// Screen layout: the canvas fills as much of the screen as possible (keeping its shape),
// so the whole game fits on a phone without zooming. While playing, the title and hint are hidden.

const stageEl = document.querySelector(".stage"), wrapEl = document.querySelector(".wrap");

function fitCanvas() {
  const gap = parseFloat(getComputedStyle(stageEl).rowGap) || 0;
  const others = [...stageEl.children].filter(el => el !== wrapEl && el.offsetParent !== null);
  const used = others.reduce((sum, el) => sum + el.offsetHeight + gap, 0);
  const bs = getComputedStyle(document.body);
  const availH = window.innerHeight - parseFloat(bs.paddingTop) - parseFloat(bs.paddingBottom) - used;
  const w = Math.max(200, Math.min(stageEl.clientWidth, availH * W / H));
  wrapEl.style.width = w + "px";
}

// Called when a run starts / ends.
function setPlaying(on) {
  document.body.classList.toggle("playing", on);
  fitCanvas();
}

addEventListener("resize", fitCanvas);
addEventListener("orientationchange", fitCanvas);
addEventListener("load", fitCanvas);   // after fonts/images settle
