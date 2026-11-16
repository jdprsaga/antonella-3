// A little music-box lullaby, synthesized live with Web Audio (no audio files).
// 16 bars of 4/4 in C major, looping. Browsers only allow sound after a tap, so it starts from the ♪ button.
(function () {
  "use strict";

  var BPM = 84;
  var VOLUME = 0.2;

  // Melody: [note, beats]. Original tune.
  var MELODY = [
    // 1 C               2 Am
    ["G5", .5], ["E5", .5], ["G5", .5], ["C6", .5], ["B5", 1], ["G5", 1],
    ["A5", 1], ["C6", .5], ["A5", .5], ["E5", 2],
    // 3 F               4 G
    ["F5", .5], ["A5", .5], ["C6", .5], ["F6", .5], ["E6", 1], ["C6", 1],
    ["D6", 1], ["B5", .5], ["G5", .5], ["D5", 2],
    // 5 C               6 Am
    ["G5", .5], ["E5", .5], ["G5", .5], ["C6", .5], ["E6", 1], ["D6", 1],
    ["C6", 1], ["A5", .5], ["C6", .5], ["E6", 2],
    // 7 Dm              8 G → C
    ["F6", .5], ["E6", .5], ["D6", .5], ["A5", .5], ["C6", 1], ["B5", 1],
    ["D6", 1], ["B5", 1], ["C6", 2],
    // 9 F               10 G
    ["A5", 1], ["C6", .5], ["F6", .5], ["F6", 1], ["E6", .5], ["D6", .5],
    ["D6", 1], ["B5", .5], ["D6", .5], ["G6", 2],
    // 11 Em             12 Am
    ["G6", .5], ["E6", .5], ["B5", .5], ["E6", .5], ["D6", 1], ["B5", 1],
    ["C6", 1], ["E6", .5], ["C6", .5], ["A5", 2],
    // 13 Dm             14 G
    ["F5", .5], ["A5", .5], ["D6", .5], ["F6", .5], ["E6", 1], ["D6", 1],
    ["B5", .5], ["D6", .5], ["G6", .5], ["F6", .5], ["D6", 1], ["B5", 1],
    // 15 C              16 G
    ["C6", .5], ["G5", .5], ["E5", .5], ["G5", .5], ["C6", 1], ["E6", 1],
    ["D6", 2], ["B5", 1], ["G5", 1],
  ];

  // One chord per half bar (two per bar), arpeggiated softly underneath.
  var CHORDS = [
    "C", "C", "Am", "Am", "F", "F", "G", "G",
    "C", "C", "Am", "Am", "Dm", "Dm", "G", "C",
    "F", "F", "G", "G", "Em", "Em", "Am", "Am",
    "Dm", "Dm", "G", "G", "C", "C", "G", "G",
  ];
  var VOICING = {
    C: ["C4", "G4", "C5", "E5"],
    Am: ["A3", "E4", "A4", "C5"],
    F: ["F3", "C4", "F4", "A4"],
    G: ["G3", "D4", "G4", "B4"],
    Dm: ["D4", "A4", "D5", "F5"],
    Em: ["E4", "B4", "E5", "G5"],
  };

  var BEAT = 60 / BPM;
  var LOOP_BEATS = 64;

  // Flatten everything into [beatOffset, note, velocity] events for one loop.
  var EVENTS = [];
  (function () {
    var beat = 0;
    MELODY.forEach(function (m) {
      EVENTS.push([beat, m[0], 1]);
      beat += m[1];
    });
    if (beat !== LOOP_BEATS) console.warn("music.js: melody is " + beat + " beats, expected " + LOOP_BEATS);
    CHORDS.forEach(function (name, half) {
      var v = VOICING[name];
      [0, 1, 2, 3].forEach(function (i) {
        EVENTS.push([half * 2 + i * 0.5, v[i], i === 0 ? 0.42 : 0.3]);
      });
    });
    EVENTS.sort(function (a, b) { return a[0] - b[0]; });
  })();

  var NOTE_INDEX = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function freq(note) {
    var m = /^([A-G])(#|b)?(\d)$/.exec(note);
    var midi = 12 * (Number(m[3]) + 1) + NOTE_INDEX[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  var ctx = null;
  var out = null;
  var timer = null;
  var loopStart = 0;
  var nextEvent = 0;
  var playing = false;

  function setup() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();

    out = ctx.createGain();
    out.gain.value = 0;
    var tone = ctx.createBiquadFilter();
    tone.type = "lowpass";
    tone.frequency.value = 6000;

    // Small-room reverb from a generated impulse, so it sounds like a box on a table.
    var reverb = ctx.createConvolver();
    var len = Math.floor(ctx.sampleRate * 2.2);
    var ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var ch = 0; ch < 2; ch++) {
      var data = ir.getChannelData(ch);
      for (var i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    reverb.buffer = ir;
    var wet = ctx.createGain();
    wet.gain.value = 0.28;

    out.connect(tone);
    tone.connect(ctx.destination);
    tone.connect(reverb);
    reverb.connect(wet);
    wet.connect(ctx.destination);
    return true;
  }

  // A music-box tine: a pure fundamental, a quieter octave, and a short metallic "ping" partial.
  function pluck(note, time, velocity) {
    var f = freq(note);
    var decay = Math.max(0.9, 2.6 - (f - 260) / 900); // higher tines ring shorter
    var partials = [
      [1, 0.6 * velocity, decay],
      [2, 0.16 * velocity, decay * 0.45],
      [5.93, 0.05 * velocity, 0.12],
    ];
    partials.forEach(function (p) {
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = f * p[0];
      g.gain.setValueAtTime(0.0001, time);
      g.gain.exponentialRampToValueAtTime(p[1], time + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, time + p[2]);
      osc.connect(g);
      g.connect(out);
      osc.start(time);
      osc.stop(time + p[2] + 0.05);
    });
  }

  function schedule() {
    var horizon = ctx.currentTime + 0.4;
    while (true) {
      var e = EVENTS[nextEvent];
      var t = loopStart + e[0] * BEAT;
      if (t > horizon) break;
      pluck(e[1], t, e[2]);
      nextEvent++;
      if (nextEvent === EVENTS.length) {
        nextEvent = 0;
        loopStart += LOOP_BEATS * BEAT;
      }
    }
  }

  function start() {
    if (!ctx && !setup()) return;
    ctx.resume();
    if (!timer) {
      loopStart = ctx.currentTime + 0.15;
      nextEvent = 0;
      timer = setInterval(schedule, 100);
      schedule();
    }
    out.gain.cancelScheduledValues(ctx.currentTime);
    out.gain.setValueAtTime(out.gain.value, ctx.currentTime);
    out.gain.linearRampToValueAtTime(VOLUME, ctx.currentTime + 1.2);
    playing = true;
  }

  function stop() {
    if (!ctx) return;
    playing = false;
    out.gain.cancelScheduledValues(ctx.currentTime);
    out.gain.setValueAtTime(out.gain.value, ctx.currentTime);
    out.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
    setTimeout(function () {
      if (playing) return;
      clearInterval(timer);
      timer = null;
      ctx.suspend();
    }, 450);
  }

  var button = document.getElementById("music-toggle");
  if (!button) return;
  if (!(window.AudioContext || window.webkitAudioContext)) {
    button.hidden = true;
    return;
  }

  button.addEventListener("click", function () {
    if (playing) stop(); else start();
    button.setAttribute("aria-pressed", String(playing));
  });

  // Don't keep playing in a background tab.
  document.addEventListener("visibilitychange", function () {
    if (!ctx || !playing) return;
    if (document.hidden) ctx.suspend(); else ctx.resume();
  });
})();
