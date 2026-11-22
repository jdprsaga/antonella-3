// Subtle glitter: tiny sparkles that twinkle in and out at random spots. Purely decorative.
// All sparkles are painted onto one fixed <canvas> behind the page. (As separate moving elements,
// they made the browser keep re-splitting the text into layers, which made the text jiggle.)
(function () {
  "use strict";

  var COUNT = 22;
  // Mostly warm gold, with a touch of rose and lilac. (Pale or white sparkles vanish on the cream paper.)
  var COLORS = ["#e3b54f", "#e3b54f", "#eac46d", "#d9a441", "#e99ab3", "#c9a6e6"];
  var MAX_SIZE = 19; // px, largest sparkle

  var STAR = "M0 -10 C1 -2.5 2.5 -1 10 0 C2.5 1 1 2.5 0 10 C-1 2.5 -2.5 1 -10 0 C-2.5 -1 -1 -2.5 0 -10Z";

  function sparkleSVG(color, dot) {
    var shape = dot
      ? '<circle r="4" fill="url(#c)"/>'
      : '<path d="' + STAR + '" fill="url(#c)"/>';
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-12 -12 24 24">' +
        '<defs><radialGradient id="c"><stop offset="0" stop-color="#fff"/><stop offset="0.45" stop-color="' + color + '"/>' +
        '<stop offset="1" stop-color="' + color + '" stop-opacity="0.85"/></radialGradient>' +
        '<radialGradient id="g"><stop offset="0" stop-color="' + color + '" stop-opacity="0.55"/><stop offset="1" stop-color="' + color + '" stop-opacity="0"/></radialGradient></defs>' +
        '<circle r="12" fill="url(#g)"/>' + shape +
      "</svg>"
    );
  }

  function rand(a, b) { return a + Math.random() * (b - a); }

  var canvas = document.getElementById("glitter");
  if (!canvas || !canvas.getContext || !window.onFrame) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var ctx = canvas.getContext("2d");
  var dpr = Math.min(window.devicePixelRatio || 1, 3);

  function fit() {
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
  }
  fit();
  window.addEventListener("resize", fit);

  // Each color/shape is drawn once into a small bitmap ("sprite"); every frame just stamps those.
  var sprites = {};
  function sprite(color, dot) {
    var key = color + (dot ? "o" : "*");
    if (sprites[key] !== undefined) return sprites[key];
    sprites[key] = null; // not ready yet
    var img = new Image();
    img.onload = function () {
      var px = Math.ceil(MAX_SIZE * dpr);
      var c = document.createElement("canvas");
      c.width = c.height = px;
      c.getContext("2d").drawImage(img, 0, 0, px, px);
      sprites[key] = c;
    };
    img.src = "data:image/svg+xml," + encodeURIComponent(sparkleSVG(color, dot));
    return null;
  }

  var sparkles = [];
  for (var i = 0; i < COUNT; i++) {
    var s = {
      dot: Math.random() < 0.3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      wait: rand(0, 2.5),
    };
    sprite(s.color, s.dot);
    reset(s);
    sparkles.push(s);
  }

  function reset(s) {
    s.x = rand(0, window.innerWidth);
    s.y = rand(0, window.innerHeight);
    s.size = s.dot ? rand(6, 9) : rand(11, MAX_SIZE);
    s.life = rand(1.4, 2.6);  // seconds from fade-in to fade-out
    s.age = 0;
    s.peak = rand(0.75, 1);
    s.spin = rand(0, 45);
  }

  window.onFrame(function (dt) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (var i = 0; i < sparkles.length; i++) {
      var s = sparkles[i];
      if (s.wait > 0) { s.wait -= dt; continue; }

      s.age += dt;
      var p = s.age / s.life;
      if (p >= 1) {
        reset(s);
        s.wait = rand(0.3, 2.5); // rest before twinkling somewhere else
        continue;
      }

      var img = sprite(s.color, s.dot);
      if (!img) continue;

      // Swell in and out, turning a little as it glints.
      var glow = Math.sin(Math.PI * p);
      var size = s.size * (0.35 + 0.65 * glow) * dpr;
      ctx.globalAlpha = s.peak * glow * glow;
      ctx.setTransform(1, 0, 0, 1, s.x * dpr, s.y * dpr);
      ctx.rotate(((s.spin + 40 * p) * Math.PI) / 180);
      ctx.drawImage(img, -size / 2, -size / 2, size, size);
    }
    ctx.globalAlpha = 1;
  });
})();
