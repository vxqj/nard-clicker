(function () {
  document.getElementById("photo").src = CONFIG.photo;
  document.getElementById("crimeText").textContent = "FOR " + CONFIG.crime;
  document.getElementById("nameText").textContent = CONFIG.name;
  document.getElementById("rewardText").textContent = CONFIG.reward + " REWARD";
  document.getElementById("cautionText").textContent = CONFIG.caution;
  document.title = "WANTED — " + CONFIG.name;

  const poster = document.getElementById("poster");

  // ── Torn paper edge as a pixel-space polygon (used to clip the paper canvas) ──
  function tornEdgePoints(w, h) {
    const pts = [];
    function addEdge(vertical, fixed, from, to, steps, perpJitter, tangJitter) {
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        let vary = from + (to - from) * t;
        let f = fixed + (Math.random() - 0.5) * 2 * perpJitter;
        if (i !== 0 && i !== steps) vary += (Math.random() - 0.5) * 2 * tangJitter;
        const px = vertical ? f : vary;
        const py = vertical ? vary : f;
        pts.push([(px / 100) * w, (py / 100) * h]);
      }
    }
    addEdge(false, 0, 0, 100, 15, 1.6, 0.8);    // top
    addEdge(true, 100, 0, 100, 15, 1.6, 0.8);   // right
    addEdge(false, 100, 100, 0, 15, 1.6, 0.8);  // bottom
    addEdge(true, 0, 100, 0, 15, 1.6, 0.8);     // left
    return pts;
  }

  // ── Paper canvas: renders the paper itself, so burning it can punch
  // real transparent holes that reveal the wooden wall behind it ──
  const paperCanvas = document.getElementById("paperCanvas");
  const pctx = paperCanvas.getContext("2d");
  const noiseImg = new Image();
  let noiseReady = false;
  noiseImg.onload = () => {
    noiseReady = true;
  };
  noiseImg.src =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E";

  function paintPaperTexture(w, h) {
    pctx.fillStyle = "#e8d2a0";
    pctx.fillRect(0, 0, w, h);

    pctx.save();
    pctx.globalCompositeOperation = "multiply";
    const g1 = pctx.createRadialGradient(w * 0.15, h * 0.1, 0, w * 0.15, h * 0.1, w * 0.5);
    g1.addColorStop(0, "rgba(122,52,24,0.22)");
    g1.addColorStop(1, "rgba(122,52,24,0)");
    pctx.fillStyle = g1;
    pctx.fillRect(0, 0, w, h);

    const g2 = pctx.createRadialGradient(w * 0.85, h * 0.9, 0, w * 0.85, h * 0.9, w * 0.55);
    g2.addColorStop(0, "rgba(122,52,24,0.26)");
    g2.addColorStop(1, "rgba(122,52,24,0)");
    pctx.fillStyle = g2;
    pctx.fillRect(0, 0, w, h);

    if (noiseReady) {
      const pattern = pctx.createPattern(noiseImg, "repeat");
      pctx.globalAlpha = 0.35;
      pctx.fillStyle = pattern;
      pctx.fillRect(0, 0, w, h);
      pctx.globalAlpha = 1;
    }
    pctx.restore();
  }

  function initPaperCanvas() {
    const rect = poster.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    paperCanvas.width = rect.width * dpr;
    paperCanvas.height = rect.height * dpr;
    pctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // clip to the torn-paper silhouette — this clip persists for the life
    // of the context, so every later burn/texture draw is auto-confined to it
    const pts = tornEdgePoints(rect.width, rect.height);
    pctx.beginPath();
    pts.forEach(([x, y], i) => (i === 0 ? pctx.moveTo(x, y) : pctx.lineTo(x, y)));
    pctx.closePath();
    pctx.clip();

    paintPaperTexture(rect.width, rect.height);
  }

  initPaperCanvas();
  if (!noiseReady) {
    noiseImg.addEventListener("load", () => paintPaperTexture(poster.getBoundingClientRect().width, poster.getBoundingClientRect().height), { once: true });
  }

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(initPaperCanvas, 150);
  });

  // ── Lighter cursor ──
  const cursorEl = document.getElementById("lighterCursor");

  let isLit = false;
  let pointerX = window.innerWidth / 2;
  let pointerY = window.innerHeight / 2;

  function moveCursor(x, y) {
    pointerX = x;
    pointerY = y;
    cursorEl.style.left = x + "px";
    cursorEl.style.top = y + "px";
  }

  function withinPoster(x, y) {
    const rect = poster.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  // an irregular (not perfectly round) blob path — real char marks aren't circles
  function blobPath(ctx, cx, cy, baseR, jag, points) {
    const angleStep = (Math.PI * 2) / points;
    ctx.beginPath();
    for (let i = 0; i <= points; i++) {
      const a = i * angleStep;
      const r = baseR * (1 - jag / 2 + Math.random() * jag);
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r * 0.9;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  // one scorch stamp on the paper canvas, in poster-local coordinates:
  // soft singe -> ragged char ring -> a real burnt-through hole that
  // lets the wall show through. Holding the flame in one spot stacks
  // more punches there, so the hole visibly grows.
  function scorchPaperAt(lx, ly) {
    const cx = lx + (Math.random() - 0.5) * 4;
    const cy = ly + (Math.random() - 0.5) * 4;

    pctx.save();
    pctx.globalCompositeOperation = "multiply";
    pctx.fillStyle = "rgba(120, 60, 20, 0.28)";
    blobPath(pctx, cx, cy, 20 + Math.random() * 8, 0.7, 10);
    pctx.fill();

    pctx.fillStyle = "rgba(60, 26, 10, 0.6)";
    blobPath(pctx, cx, cy, 12 + Math.random() * 5, 0.8, 9);
    pctx.fill();
    pctx.restore();

    pctx.save();
    pctx.globalCompositeOperation = "source-over";
    pctx.fillStyle = "rgba(15, 8, 4, 0.9)";
    blobPath(pctx, cx, cy, 6 + Math.random() * 3, 0.9, 8);
    pctx.fill();

    pctx.strokeStyle = "rgba(35, 16, 6, 0.5)";
    pctx.lineCap = "round";
    const cracks = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < cracks; i++) {
      const a = Math.random() * Math.PI * 2;
      const len = 8 + Math.random() * 14;
      pctx.lineWidth = 0.6 + Math.random() * 1;
      pctx.beginPath();
      pctx.moveTo(cx + Math.cos(a) * 4, cy + Math.sin(a) * 4);
      pctx.lineTo(cx + Math.cos(a) * (4 + len), cy + Math.sin(a) * (4 + len));
      pctx.stroke();
    }
    pctx.restore();

    // the actual burn-through hole — this is what reveals the wooden wall
    pctx.save();
    pctx.globalCompositeOperation = "destination-out";
    blobPath(pctx, cx, cy, 3 + Math.random() * 2, 1, 7);
    pctx.fill();
    pctx.restore();
  }

  // ── Ember canvas: transient cartoon flame licks + a tip glow, both
  // fade out every frame instead of accumulating ──
  const emberCanvas = document.getElementById("emberCanvas");
  const ectx = emberCanvas.getContext("2d");

  function sizeEmberCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    emberCanvas.width = window.innerWidth * dpr;
    emberCanvas.height = window.innerHeight * dpr;
    ectx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  sizeEmberCanvas();
  window.addEventListener("resize", sizeEmberCanvas);

  // bold, flat-colored cartoon flame tongue with a dark outline
  function drawFlameLick(x, y, size, rot) {
    ectx.save();
    ectx.globalCompositeOperation = "source-over";
    ectx.translate(x, y);
    ectx.rotate(rot);
    const w = size * 0.45;
    const h = size;

    ectx.beginPath();
    ectx.moveTo(0, h * 0.15);
    ectx.bezierCurveTo(-w, -h * 0.1, -w * 0.85, -h * 0.7, 0, -h);
    ectx.bezierCurveTo(w * 0.85, -h * 0.7, w, -h * 0.1, 0, h * 0.15);
    ectx.closePath();
    ectx.fillStyle = "rgba(255, 106, 26, 0.95)";
    ectx.fill();
    ectx.lineWidth = 1.4;
    ectx.strokeStyle = "rgba(110, 26, 0, 0.55)";
    ectx.stroke();

    ectx.beginPath();
    ectx.moveTo(0, h * 0.05);
    ectx.bezierCurveTo(-w * 0.5, -h * 0.05, -w * 0.45, -h * 0.5, 0, -h * 0.7);
    ectx.bezierCurveTo(w * 0.45, -h * 0.5, w * 0.5, -h * 0.05, 0, h * 0.05);
    ectx.closePath();
    ectx.fillStyle = "rgba(255, 224, 110, 0.95)";
    ectx.fill();
    ectx.restore();
  }

  function emberLoop() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = emberCanvas.width / dpr;
    const h = emberCanvas.height / dpr;

    ectx.globalCompositeOperation = "destination-out";
    ectx.fillStyle = "rgba(0, 0, 0, 0.16)";
    ectx.fillRect(0, 0, w, h);

    if (isLit && withinPoster(pointerX, pointerY)) {
      ectx.globalCompositeOperation = "lighter";
      const flicker = 8 + Math.sin(Date.now() / 45) * 2 + Math.random() * 2;
      const grad = ectx.createRadialGradient(pointerX, pointerY, 0, pointerX, pointerY, flicker);
      grad.addColorStop(0, "rgba(255, 240, 180, 0.85)");
      grad.addColorStop(0.35, "rgba(255, 140, 30, 0.6)");
      grad.addColorStop(1, "rgba(200, 50, 0, 0)");
      ectx.fillStyle = grad;
      ectx.beginPath();
      ectx.arc(pointerX, pointerY, flicker, 0, Math.PI * 2);
      ectx.fill();
    }

    requestAnimationFrame(emberLoop);
  }
  requestAnimationFrame(emberLoop);

  // fires whenever the paper actually catches: punches the hole/char on
  // the paper canvas and spawns a little cartoon flame lick over it
  function burnAt(clientX, clientY) {
    const rect = poster.getBoundingClientRect();
    scorchPaperAt(clientX - rect.left, clientY - rect.top);

    if (Math.random() < 0.85) {
      drawFlameLick(
        clientX + (Math.random() - 0.5) * 6,
        clientY + (Math.random() - 0.5) * 4,
        11 + Math.random() * 9,
        (Math.random() - 0.5) * 0.7
      );
    }
  }

  function burnAlong(x0, y0, x1, y1) {
    const dist = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(1, Math.floor(dist / 7));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      burnAt(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t);
    }
  }

  let lastBurnX = null;
  let lastBurnY = null;
  let idleBurnTimer = null;

  function startFlame() {
    isLit = true;
    cursorEl.classList.add("lit");
    lastBurnX = pointerX;
    lastBurnY = pointerY;
    if (withinPoster(pointerX, pointerY)) burnAt(pointerX, pointerY);
    idleBurnTimer = window.setInterval(() => {
      if (isLit && withinPoster(pointerX, pointerY)) burnAt(pointerX, pointerY);
    }, 130);
  }

  function extinguish() {
    isLit = false;
    cursorEl.classList.remove("lit");
    lastBurnX = null;
    lastBurnY = null;
    if (idleBurnTimer) {
      clearInterval(idleBurnTimer);
      idleBurnTimer = null;
    }
  }

  window.addEventListener("pointermove", (e) => {
    moveCursor(e.clientX, e.clientY);
    cursorEl.classList.add("ready");
    if (isLit && withinPoster(e.clientX, e.clientY)) {
      if (lastBurnX === null) {
        burnAt(e.clientX, e.clientY);
      } else {
        burnAlong(lastBurnX, lastBurnY, e.clientX, e.clientY);
      }
    }
    lastBurnX = e.clientX;
    lastBurnY = e.clientY;
  });

  window.addEventListener("pointerdown", (e) => {
    moveCursor(e.clientX, e.clientY);
    startFlame();
  });

  window.addEventListener("pointerup", extinguish);
  window.addEventListener("pointercancel", extinguish);
  window.addEventListener("blur", extinguish);
})();
