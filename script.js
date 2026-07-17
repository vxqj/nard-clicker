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

  // ── FX canvas: a real, continuously-animated fire — a persistent
  // standing flame at the lighter tip, embers that rise and fade, and
  // glowing hot edges left behind at each burn point. Everything here
  // is redrawn from scratch every frame (no accumulation trick), so
  // it looks like actual moving fire instead of static fading stamps.
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

  let flameIntensity = 0; // eases toward isLit ? 1 : 0 for a smooth ignite/extinguish
  const embers = []; // rising sparks
  const hotSpots = []; // lingering glow left behind at burn points

  function spawnHotSpot(x, y) {
    hotSpots.push({
      x,
      y,
      start: performance.now(),
      life: 700 + Math.random() * 500,
      size: 14 + Math.random() * 10,
    });
  }

  function spawnEmbers(x, y, count) {
    for (let i = 0; i < count; i++) {
      embers.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 6,
        vx: (Math.random() - 0.5) * 26,
        vy: -40 - Math.random() * 50,
        start: performance.now(),
        life: 450 + Math.random() * 400,
        size: 1.4 + Math.random() * 2.2,
      });
    }
  }

  // one flame tongue, drawn with a live sine-wave sway/height pulse so it
  // actually flickers frame to frame instead of just fading in place
  function drawTongue(x, y, h, sway, t) {
    const w = h * 0.4;
    ectx.beginPath();
    ectx.moveTo(x, y + h * 0.18);
    ectx.bezierCurveTo(x - w + sway, y - h * 0.15, x - w * 0.7 + sway * 1.4, y - h * 0.75, x + sway * 1.8, y - h);
    ectx.bezierCurveTo(x + w * 0.7 + sway * 1.4, y - h * 0.75, x + w + sway, y - h * 0.15, x, y + h * 0.18);
    ectx.closePath();
    const grad = ectx.createLinearGradient(x, y + h * 0.18, x, y - h);
    grad.addColorStop(0, `rgba(255, 90, 20, ${0.95 * t})`);
    grad.addColorStop(0.55, `rgba(255, 150, 30, ${0.95 * t})`);
    grad.addColorStop(1, `rgba(255, 230, 120, ${0.85 * t})`);
    ectx.fillStyle = grad;
    ectx.fill();
    ectx.lineWidth = 1.3;
    ectx.strokeStyle = `rgba(120, 30, 0, ${0.5 * t})`;
    ectx.stroke();
  }

  function drawStandingFlame(x, y, now) {
    const t = flameIntensity;
    if (t < 0.02) return;

    ectx.save();
    ectx.globalCompositeOperation = "lighter";
    const glowR = 26 * t;
    const glow = ectx.createRadialGradient(x, y - 6, 0, x, y - 6, glowR);
    glow.addColorStop(0, `rgba(255, 200, 120, ${0.55 * t})`);
    glow.addColorStop(1, "rgba(255, 120, 20, 0)");
    ectx.fillStyle = glow;
    ectx.beginPath();
    ectx.arc(x, y - 6, glowR, 0, Math.PI * 2);
    ectx.fill();
    ectx.restore();

    ectx.save();
    ectx.globalCompositeOperation = "source-over";
    const wobble = now / 55;
    // back (bigger, slower) tongue, then front (smaller, faster) tongue on top
    drawTongue(x, y, (17 + Math.sin(wobble) * 2.5) * t, Math.sin(wobble * 0.7) * 3, t);
    drawTongue(x, y, (11 + Math.sin(wobble * 1.6 + 1.4) * 2) * t, Math.sin(wobble * 1.4 + 2) * 2.4, t * 0.95);
    ectx.restore();
  }

  function fxLoop() {
    const now = performance.now();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = emberCanvas.width / dpr;
    const h = emberCanvas.height / dpr;
    ectx.clearRect(0, 0, w, h);

    flameIntensity += ((isLit ? 1 : 0) - flameIntensity) * 0.22;

    // lingering charred-edge glow, oldest first so newer ones sit on top
    for (let i = hotSpots.length - 1; i >= 0; i--) {
      const p = hotSpots[i];
      const t = (now - p.start) / p.life;
      if (t >= 1) {
        hotSpots.splice(i, 1);
        continue;
      }
      const alpha = (1 - t) * 0.6;
      const grad = ectx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * (1 + t * 0.5));
      grad.addColorStop(0, `rgba(255, 130, 40, ${alpha})`);
      grad.addColorStop(1, "rgba(200, 50, 0, 0)");
      ectx.save();
      ectx.globalCompositeOperation = "lighter";
      ectx.fillStyle = grad;
      ectx.beginPath();
      ectx.arc(p.x, p.y, p.size * (1 + t * 0.5), 0, Math.PI * 2);
      ectx.fill();
      ectx.restore();
    }

    // rising embers
    for (let i = embers.length - 1; i >= 0; i--) {
      const e = embers[i];
      const t = (now - e.start) / e.life;
      if (t >= 1) {
        embers.splice(i, 1);
        continue;
      }
      const dt = Math.min((now - (e._last || e.start)) / 1000, 0.05);
      e._last = now;
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.vy += 60 * dt; // gentle drag back down as it cools
      const alpha = 1 - t;
      ectx.save();
      ectx.globalCompositeOperation = "lighter";
      ectx.fillStyle = `rgba(${255}, ${Math.round(200 - t * 120)}, ${Math.round(60 - t * 60)}, ${alpha})`;
      ectx.beginPath();
      ectx.arc(e.x, e.y, e.size * (1 - t * 0.4), 0, Math.PI * 2);
      ectx.fill();
      ectx.restore();
    }

    if (isLit && withinPoster(pointerX, pointerY)) {
      drawStandingFlame(pointerX, pointerY, now);
      if (Math.random() < 0.55) spawnEmbers(pointerX, pointerY - 8, 1);
    }

    requestAnimationFrame(fxLoop);
  }
  requestAnimationFrame(fxLoop);

  // fires whenever the paper actually catches: punches the hole/char on
  // the paper canvas and leaves a glowing hot edge + a burst of embers
  function burnAt(clientX, clientY) {
    const rect = poster.getBoundingClientRect();
    scorchPaperAt(clientX - rect.left, clientY - rect.top);
    spawnHotSpot(clientX, clientY);
    spawnEmbers(clientX, clientY, 2 + Math.floor(Math.random() * 3));
  }

  function burnAlong(x0, y0, x1, y1) {
    const dist = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(1, Math.floor(dist / 9));
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
