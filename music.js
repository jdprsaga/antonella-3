// Background song, looping. On by default, except on iPhone/iPad, where it stays off until the guest
// taps ♪ Music. Browsers block sound until the visitor taps or clicks something, so elsewhere the
// song is loaded right away and starts on the first tap anywhere on the page.
// Played through Web Audio, which loops without a gap and can fade on every phone (iOS ignores
// <audio> volume changes). If a guest turns it off, that's remembered for their next visit.
(function () {
  "use strict";

  var SRC = "HolidayJazzAntonella.mp3";
  var VOLUME = 0.6;
  var PREF = "music"; // localStorage: "off" once the guest turns the music off

  var ctx = null;
  var out = null;
  var buffer = null;
  var source = null;
  var loading = false;
  var playing = false;

  function setup() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    out = ctx.createGain();
    out.gain.value = 0;
    out.connect(ctx.destination);
    return true;
  }

  function load(done) {
    loading = true;
    fetch(SRC)
      .then(function (res) { return res.arrayBuffer(); })
      .then(function (data) {
        // Older Safari only has the callback form of decodeAudioData.
        ctx.decodeAudioData(data, function (decoded) {
          buffer = decoded;
          loading = false;
          done();
        }, function () { loading = false; });
      })
      .catch(function () { loading = false; });
  }

  // Starts the loop. Before the first tap the audio clock is frozen, so the song and its
  // fade-in simply wait and begin from the top once the browser allows sound.
  function begin() {
    if (!playing || source) return; // stopped while loading, or already running
    source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(out);
    source.start();
    fade(VOLUME, 1.2);
  }

  function fade(to, seconds) {
    out.gain.cancelScheduledValues(ctx.currentTime);
    out.gain.setValueAtTime(out.gain.value, ctx.currentTime);
    out.gain.linearRampToValueAtTime(to, ctx.currentTime + seconds);
  }

  function start() {
    if (!ctx && !setup()) return;
    ctx.resume();
    playing = true;
    if (source) fade(VOLUME, 1.2);
    else if (buffer) begin();
    else if (!loading) load(begin);
  }

  function stop() {
    if (!ctx) return;
    playing = false;
    fade(0, 0.4);
    // Pause where it is, so the next tap picks the song up from the same spot.
    setTimeout(function () { if (!playing) ctx.suspend(); }, 450);
  }

  function savePref(on) {
    try {
      if (on) localStorage.removeItem(PREF); else localStorage.setItem(PREF, "off");
    } catch (e) {}
  }

  var button = document.getElementById("music-toggle");
  if (!button) return;
  if (!(window.AudioContext || window.webkitAudioContext) || !window.fetch) {
    button.hidden = true;
    return;
  }

  function render() { button.setAttribute("aria-pressed", String(playing)); }

  // Whether the guest has actually been able to hear the music yet. Until then the button shows
  // "on", and tapping it starts the sound instead of turning it off.
  var heard = false;
  var GESTURES = ["pointerup", "touchend", "keydown"];

  // Some touches (like the end of a scroll) don't count as a tap for the browser, so keep trying
  // on each one until the audio is actually running.
  function unlock(e) {
    if (button.contains(e.target)) return; // the button's own click handles it
    if (!playing || document.hidden) return;
    resume(function () { heard = true; stopListening(); });
  }
  function resume(onRunning) {
    var p = ctx.resume(); // older Safari returns nothing here
    var check = function () { if (ctx.state === "running") onRunning(); };
    if (p && p.then) p.then(check, function () {}); else check();
  }
  function stopListening() {
    GESTURES.forEach(function (type) { document.removeEventListener(type, unlock, true); });
  }

  button.addEventListener("click", function () {
    if (playing && heard) stop(); else start();
    heard = true;
    stopListening();
    savePref(playing);
    render();
  });

  // iPadOS reports itself as a Mac, so also check for a touch screen.
  var iOS = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
  var offByGuest = false;
  try { offByGuest = localStorage.getItem(PREF) === "off"; } catch (e) {}
  if (!offByGuest && !iOS) {
    start(); // loads the song now; sound begins on the first tap (or right away if the browser allows)
    render();
    resume(function () { heard = true; stopListening(); });
    GESTURES.forEach(function (type) { document.addEventListener(type, unlock, true); });
  }

  // Don't keep playing in a background tab.
  document.addEventListener("visibilitychange", function () {
    if (!ctx || !playing) return;
    if (document.hidden) ctx.suspend(); else ctx.resume();
  });
})();
