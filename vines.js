// Static vines with paper flowers framing the page edges. Drawn once (and again only if the width changes).
(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var FLOWERS = [
    { petal: "#f7b9cf", inner: "#fcdde7" },
    { petal: "#f4a5c0", inner: "#fad0de" },
    { petal: "#fbc9d9", inner: "#fdecf2" },
    { petal: "#f6b3c4", inner: "#fde3ea" },
    { petal: "#dcc6f0", inner: "#f1e8f9" },
    { petal: "#fff1f5", inner: "#ffffff" },
  ];
  var STEM = "#9fbfa6";
  var LEAF = "#bcd9c2";
  var LEAF_DARK = "#a3c8ab";

  var layer = document.getElementById("vines");
  if (!layer) return;

  // Seeded random so the frame looks the same on every visit and redraw.
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function leaf(x, y, angle, scale, flip) {
    var s = scale;
    return (
      '<g transform="translate(' + x.toFixed(1) + " " + y.toFixed(1) + ") rotate(" + angle.toFixed(1) + ") scale(" + s.toFixed(2) + "," + (flip ? -s : s).toFixed(2) + ')">' +
        '<path d="M0 0 C5 -6 13 -6 18 0 C13 5 5 5 0 0Z" fill="' + LEAF + '"/>' +
        '<path d="M0 0 C5 -6 13 -6 18 0 C12 -1 6 -1 0 0Z" fill="' + LEAF_DARK + '"/>' +
        '<path d="M1 0 L15 0" stroke="#fff" stroke-opacity="0.7" stroke-width="0.6"/>' +
      "</g>"
    );
  }

  function flower(x, y, r, c, rot) {
    var out = '<g class="flower" transform="translate(' + x.toFixed(1) + " " + y.toFixed(1) + ") rotate(" + rot.toFixed(1) + ')">';
    for (var i = 0; i < 5; i++) {
      out +=
        '<g transform="rotate(' + i * 72 + ')">' +
          '<ellipse cx="' + (r * 0.55).toFixed(1) + '" cy="0" rx="' + (r * 0.55).toFixed(1) + '" ry="' + (r * 0.38).toFixed(1) + '" fill="' + c.petal + '"/>' +
          '<ellipse cx="' + (r * 0.5).toFixed(1) + '" cy="0" rx="' + (r * 0.32).toFixed(1) + '" ry="' + (r * 0.2).toFixed(1) + '" fill="' + c.inner + '"/>' +
          '<path d="M' + (r * 0.2).toFixed(1) + " 0 L" + (r * 0.95).toFixed(1) + ' 0" stroke="#fff" stroke-opacity="0.6" stroke-width="0.6"/>' +
        "</g>";
    }
    out += '<circle r="' + (r * 0.22).toFixed(1) + '" fill="#f5dca8"/><circle r="' + (r * 0.1).toFixed(1) + '" fill="#e6bf7a"/></g>';
    return out;
  }

  function bud(x, y, r, c) {
    return '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + r.toFixed(1) + '" fill="' + c.petal + '"/>';
  }

  function pickFlower(rand) {
    return FLOWERS[rand() < 0.75 ? Math.floor(rand() * 4) : 4 + Math.floor(rand() * 2)];
  }

  // A branch along the curve p(t), t in [0, length]: a thin stem with alternating leaves and flowers.
  // `inward` is +1 or -1 and picks which side of the stem faces the page center (flowers lean that way).
  function branch(p, length, opts, rand) {
    var d = "";
    for (var t = 0; t <= length; t += 4) {
      var q = p(t);
      d += (t === 0 ? "M" : "L") + q[0].toFixed(1) + " " + q[1].toFixed(1);
    }
    var leaves = "";
    var blooms = "";
    var side = 1;
    var nextLeaf = rand() * 20;
    var nextFlower = opts.firstFlower + rand() * 30;

    while (nextLeaf < length) {
      var a = p(nextLeaf);
      var b = p(nextLeaf + 1);
      var heading = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
      leaves += leaf(a[0], a[1], heading + side * (40 + rand() * 25), 0.75 + rand() * 0.5, side < 0);
      side = -side;
      nextLeaf += 22 + rand() * 18;
    }
    while (nextFlower < length) {
      var f = p(nextFlower);
      var c = pickFlower(rand);
      if (rand() < 0.25) {
        blooms += bud(f[0] + opts.inward * 4, f[1], 3 + rand() * 1.5, c);
      } else {
        var r = opts.minR + rand() * (opts.maxR - opts.minR);
        blooms += flower(f[0] + opts.inward * r * 0.4, f[1], r, c, rand() * 72);
      }
      nextFlower += opts.flowerGap + rand() * opts.flowerGap * 0.6;
    }
    return '<path d="' + d + '" fill="none" stroke="' + STEM + '" stroke-width="1.3" stroke-linecap="round"/>' + leaves + blooms;
  }

  var drawnW = 0;
  var drawnH = 0;

  function draw() {
    var W = window.innerWidth;
    var H = Math.max(window.innerHeight, drawnH);
    var rand = rng(310);
    var edge = { firstFlower: 30, flowerGap: 90, minR: 9, maxR: 14 };
    var corner = { firstFlower: 10, flowerGap: 42, minR: 9, maxR: 14 };
    var cornerLen = Math.min(150, W * 0.38);

    var svg =
      '<svg xmlns="' + NS + '" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + " " + H + '">' +
        // left and right edges, top to bottom
        branch(function (t) { return [11 + 5 * Math.sin(t / 38), t - 10]; }, H + 20, Object.assign({ inward: 1 }, edge), rand) +
        branch(function (t) { return [W - 11 - 5 * Math.sin(t / 41 + 1.7), t - 10]; }, H + 20, Object.assign({ inward: -1 }, edge), rand) +
        // corner sprays reaching along the top and bottom edges
        branch(function (t) { return [t, 12 + 6 * Math.sin(t / 26) + t * 0.04]; }, cornerLen, Object.assign({ inward: 1 }, corner), rand) +
        branch(function (t) { return [W - t, H - 12 - 6 * Math.sin(t / 28) - t * 0.04]; }, cornerLen, Object.assign({ inward: -1 }, corner), rand) +
        branch(function (t) { return [t, H - 12 - 5 * Math.sin(t / 30)]; }, cornerLen * 0.7, Object.assign({ inward: 1 }, corner), rand) +
        branch(function (t) { return [W - t, 14 + 5 * Math.sin(t / 30)]; }, cornerLen * 0.6, Object.assign({ inward: -1 }, corner), rand) +
      "</svg>";
    layer.innerHTML = svg;
    drawnW = W;
    drawnH = H;
  }

  draw();
  // Mobile browsers resize the height as the address bar hides; only redraw for real layout changes.
  window.addEventListener("resize", function () {
    if (window.innerWidth !== drawnW || window.innerHeight > drawnH + 40) draw();
  });
})();
