// Sound: everything is synthesized with Web Audio (placeholder sounds, no audio files).

let AC = null, master = null, NB = null;   // audio context, master volume, shared noise buffer

// Browsers only allow audio after a user gesture, so this is called from button clicks.
function audioOn() {
  try {
    if (!AC) {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      master = AC.createGain();
      master.gain.value = .55;
      master.connect(AC.destination);
    }
    AC.resume();
  } catch (e) { AC = null; }
}

// ---------- building blocks ----------

// Half a second of white noise, created once and reused.
function noise() {
  if (!NB) {
    NB = AC.createBuffer(1, AC.sampleRate * .5 | 0, AC.sampleRate);
    const a = NB.getChannelData(0);
    for (let i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1;
  }
  return NB;
}

// Attack/decay volume envelope.
function env(gn, n, peak, att, dec) {
  gn.gain.setValueAtTime(.0001, n);
  gn.gain.exponentialRampToValueAtTime(peak, n + att);
  gn.gain.exponentialRampToValueAtTime(.001, n + att + dec);
}

// Filtered noise burst (slaps, splats, spray). f2 = optional filter sweep target.
function nz(n, type, f1, q, peak, att, dec, f2) {
  const s = AC.createBufferSource();
  s.buffer = noise();
  s.loop = true;
  const f = AC.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(f1, n);
  if (f2) f.frequency.exponentialRampToValueAtTime(f2, n + att + dec);
  f.Q.value = q;
  const gn = AC.createGain();
  env(gn, n, peak, att, dec);
  s.connect(f);
  f.connect(gn);
  gn.connect(master);
  s.start(n);
  s.stop(n + att + dec + .05);
}

// Single oscillator note with optional pitch slide (f2) and bandpass (ff). Returns the oscillator.
function tone(n, type, f1, f2, peak, att, dec, ff) {
  const o = AC.createOscillator(), gn = AC.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f1, n);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, n + att + dec);
  env(gn, n, peak, att, dec);
  if (ff) {
    const f = AC.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = ff;
    f.Q.value = 3;
    o.connect(f);
    f.connect(gn);
  } else o.connect(gn);
  gn.connect(master);
  o.start(n);
  o.stop(n + att + dec + .05);
  return o;
}

// Vibrato: an LFO wobbling an oscillator's pitch.
function wobble(o, n, rate, depth, len) {
  const l = AC.createOscillator(), lg = AC.createGain();
  l.frequency.value = rate;
  lg.gain.value = depth;
  l.connect(lg);
  lg.connect(o.frequency);
  l.start(n);
  l.stop(n + len);
}

// ---------- sound effects ----------
// v: for "slap" the streak (pitch rises with it); for "oi" a softer variant.
function sfx(kind, v) {
  if (!AC) return;
  try {
    const n = AC.currentTime;
    if (kind === "slap") {
      nz(n, "bandpass", 1700, .7, .85, .003, .09);
      tone(n, "sine", 170, 50, .65, .003, .13);
      tone(n + .05, "triangle", 440 * Math.pow(2, Math.min(v - 1, 12) / 12), 0, .1, .01, .22);
    } else if (kind === "fatsplat") {
      nz(n, "lowpass", 700, .8, .9, .003, .2);
      tone(n, "sine", 120, 40, .8, .003, .25);
      nz(n + .04, "bandpass", 900, 2, .3, .01, .25, 300);
    } else if (kind === "whiff") {
      nz(n, "lowpass", 480, .7, .5, .003, .08);
      tone(n, "sine", 110, 50, .35, .003, .1);
    } else if (kind === "gold") {
      [0, .08, .16].forEach((o, i) => tone(n + o, "triangle", 880 * Math.pow(1.26, i), 0, .14, .01, .25));
    } else if (kind === "squeak") {
      tone(n, "square", 1400, 2600, .07, .005, .1);
      tone(n + .09, "square", 2000, 3000, .05, .005, .07);
    } else if (kind === "spray") {
      nz(n, "highpass", 2500, .7, .4, .03, .9);
      nz(n, "bandpass", 6000, 1, .2, .03, .7);
    } else if (kind === "wave") {
      [0, .1, .2, .32].forEach((o, i) => tone(n + o, "triangle", 523 * Math.pow(1.19, i), 0, .13, .01, .3));
    } else if (kind === "fever") {
      [0, .07, .14, .21, .28].forEach((o, i) => tone(n + o, "square", 523 * Math.pow(1.26, i), 0, .12, .005, .18));
      tone(n, "sine", 90, 40, .6, .003, .4);
    } else if (kind === "bite") {
      tone(n, "sine", 900, 1400, .1, .005, .08);
    } else if (kind === "oi") {
      tone(n, "sawtooth", v ? 150 : 190, v ? 110 : 120, .28, .02, v ? .22 : .32, 520);
    } else if (kind === "snore") {
      nz(n, "lowpass", 260, 1, .16, .5, .7, 180);
    } else if (kind === "angry") {
      tone(n, "sawtooth", 200, 90, .4, .02, .6, 600);
      tone(n + .05, "sawtooth", 160, 70, .3, .02, .6, 450);
    } else if (kind === "screech") {
      nz(n, "bandpass", 1800, 6, .75, .02, 1.0, 3800);
      wobble(tone(n, "sawtooth", 700, 1500, .22, .02, .95), n, 38, 140, 1.05);
      tone(n, "sine", 90, 38, .7, .005, .6);
    } else if (kind === "mini") {
      nz(n, "bandpass", 2400, 5, .45, .01, .35, 3600);
      tone(n, "sine", 80, 40, .45, .005, .3);
    } else if (kind === "laugh") {
      for (let i = 0; i < 9; i++) tone(n + i * .21, "sawtooth", 240 - i * 10, 170 - i * 8, .4, .02, .16, 750);
    } else if (kind === "qhit") {
      nz(n, "bandpass", 2200, 3, .42, .003, .16);
      tone(n, "sine", 130, 50, .5, .003, .14);
    } else if (kind === "die") {
      wobble(tone(n, "sawtooth", 1100, 45, .3, .01, 1.35), n, 22, 80, 1.4);
    }
  } catch (e) {}
}

// ---------- mosquito buzz (one continuous voice per mosquito) ----------

// Starts a buzz for bug b; pitch depends on its type. Panned left/right by position.
function buzzFor(b) {
  if (!AC) return;
  try {
    const o = AC.createOscillator(), lfo = AC.createOscillator(), lg = AC.createGain();
    const f = AC.createBiquadFilter(), gn = AC.createGain();
    const pn = AC.createStereoPanner ? AC.createStereoPanner() : null;
    o.type = "sawtooth";
    o.frequency.value = (b.type === "gold" ? 760 : b.type === "fat" ? 380 : b.type === "coward" ? 640 : 520) + Math.random() * 120;
    lfo.frequency.value = 7 + Math.random() * 4;
    lg.gain.value = 20;
    lfo.connect(lg);
    lg.connect(o.frequency);
    f.type = "bandpass";
    f.frequency.value = 950;
    f.Q.value = .8;
    gn.gain.value = 0;
    o.connect(f);
    f.connect(gn);
    if (pn) { gn.connect(pn); pn.connect(master); } else gn.connect(master);
    o.start();
    lfo.start();
    b.snd = { o, lfo, gn, pn };
  } catch (e) {}
}

// Sets buzz volume (silent when not playing) and stereo pan from the bug's x.
function buzzSet(b, v) {
  if (!b.snd) return;
  const n = AC.currentTime;
  b.snd.gn.gain.setTargetAtTime(S.playing ? v : 0, n, .04);
  if (b.snd.pn) b.snd.pn.pan.setTargetAtTime(Math.max(-1, Math.min(1, (b.x - W / 2) / (W / 2))), n, .05);
}

// cut = instant silence (a kill: "silence is the reward"); otherwise a quick fade.
function buzzStop(b, cut) {
  if (!b.snd) return;
  try {
    const n = AC.currentTime;
    if (cut) {
      b.snd.gn.gain.cancelScheduledValues(n);
      b.snd.gn.gain.setValueAtTime(0, n);
    } else b.snd.gn.gain.setTargetAtTime(0, n, .03);
    b.snd.o.stop(n + .15);
    b.snd.lfo.stop(n + .15);
  } catch (e) {}
  b.snd = null;
}

// ---------- the Queen's low drone ----------

function droneStart(q) {
  if (!AC) return;
  try {
    const o = AC.createOscillator(), o2 = AC.createOscillator(), f = AC.createBiquadFilter(), gn = AC.createGain();
    o.type = o2.type = "sawtooth";
    o.frequency.value = 55;
    o2.frequency.value = 58.5;
    f.type = "lowpass";
    f.frequency.value = 600;
    gn.gain.value = 0;
    o.connect(f);
    o2.connect(f);
    f.connect(gn);
    gn.connect(master);
    o.start();
    o2.start();
    q.snd = { o, o2, gn };
  } catch (e) {}
}

// Louder and higher as her sting fills; loudest when she lunges.
function droneUpd(q) {
  if (!q.snd) return;
  const n = AC.currentTime;
  const v = q.phase === "fight" ? (q.vanish > 0 ? .05 : .1 + .28 * q.sting)
    : q.phase === "lunge" ? .4
    : q.phase === "dying" ? .08 * Math.max(0, 1 - q.t)
    : 0;
  const fr = 55 + 50 * (q.phase === "lunge" ? 1 : q.sting);
  q.snd.gn.gain.setTargetAtTime(v, n, .05);
  q.snd.o.frequency.setTargetAtTime(fr, n, .05);
  q.snd.o2.frequency.setTargetAtTime(fr * 1.064, n, .05);
}

function droneStop(q) {
  if (!q || !q.snd) return;
  try {
    const n = AC.currentTime;
    q.snd.gn.gain.setValueAtTime(0, n);
    q.snd.o.stop(n + .05);
    q.snd.o2.stop(n + .05);
  } catch (e) {}
  q.snd = null;
}
