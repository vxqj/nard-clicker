(function () {
  document.getElementById("photo").src = CONFIG.photo;
  document.getElementById("crimeText").textContent = "FOR " + CONFIG.crime;
  document.getElementById("nameText").textContent = CONFIG.name;
  document.getElementById("rewardText").textContent = CONFIG.reward + " REWARD";
  document.getElementById("cautionText").textContent = CONFIG.caution;
  document.title = "WANTED — " + CONFIG.name;

  // ── Torn paper edge, built as a clip-path so it can only ever affect
  // the .paper-shape element itself — never the photo or text on top ──
  function tornEdgeClipPath() {
    const pts = [];
    function addEdge(vertical, fixed, from, to, steps, perpJitter, tangJitter) {
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        let vary = from + (to - from) * t;
        let f = fixed + (Math.random() - 0.5) * 2 * perpJitter;
        if (i !== 0 && i !== steps) vary += (Math.random() - 0.5) * 2 * tangJitter;
        pts.push(vertical ? `${f.toFixed(2)}% ${vary.toFixed(2)}%` : `${vary.toFixed(2)}% ${f.toFixed(2)}%`);
      }
    }
    addEdge(false, 0, 0, 100, 15, 1.6, 0.8);    // top
    addEdge(true, 100, 0, 100, 15, 1.6, 0.8);   // right
    addEdge(false, 100, 100, 0, 15, 1.6, 0.8);  // bottom
    addEdge(true, 0, 100, 0, 15, 1.6, 0.8);     // left
    return `polygon(${pts.join(",")})`;
  }

  document.querySelector(".paper-shape").style.clipPath = tornEdgeClipPath();

  const stage = document.getElementById("posterStage");
  const poster = document.getElementById("poster");
  const dust = document.getElementById("dustLayer");
  const scene = document.getElementById("scene");

  let targetX = 0, targetY = 0; // -1 to 1
  let curX = 0, curY = 0;

  function applyTilt() {
    // smooth easing toward target
    curX += (targetX - curX) * 0.08;
    curY += (targetY - curY) * 0.08;

    const rotY = curX * 14;   // left-right tilt
    const rotX = -curY * 14;  // up-down tilt

    poster.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    dust.style.transform = `translate(${curX * -30}px, ${curY * -20}px)`;

    requestAnimationFrame(applyTilt);
  }

  function handlePointer(clientX, clientY) {
    const rect = scene.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;  // 0 to 1
    const y = (clientY - rect.top) / rect.height;
    targetX = (x - 0.5) * 2;
    targetY = (y - 0.5) * 2;
  }

  window.addEventListener("pointermove", (e) => {
    handlePointer(e.clientX, e.clientY);
  });

  window.addEventListener("pointerleave", () => {
    targetX = 0;
    targetY = 0;
  });

  // gentle device-tilt parallax on mobile, if permission isn't gated
  window.addEventListener("deviceorientation", (e) => {
    if (e.gamma == null || e.beta == null) return;
    targetX = Math.max(-1, Math.min(1, e.gamma / 30));
    targetY = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
  });

  requestAnimationFrame(applyTilt);

  // ── Lighter cursor + burn effect ──
  const cursorEl = document.getElementById("lighterCursor");
  const burnCanvas = document.getElementById("burnCanvas");
  const bctx = burnCanvas.getContext("2d");
  const emberCanvas = document.getElementById("emberCanvas");
  const ectx = emberCanvas.getContext("2d");

  function sizeCanvases() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    for (const [canvas, ctx] of [[burnCanvas, bctx], [emberCanvas, ectx]]) {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }
  sizeCanvases();
  window.addEventListener("resize", sizeCanvases);

  let isLit = false;
  let lastBurnX = null;
  let lastBurnY = null;
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
      const y = cy + Math.sin(a) * r * 0.9; // slightly flattened, paper-scorch style
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  // one scorch stamp: wide soft singe (multiplies into the paper color),
  // a ragged dark char ring, a near-black burnt-through core, and a few
  // thin radiating fiber cracks — this is what gets baked permanently
  // into the burn canvas.
  function burnAt(x, y) {
    const cx = x + (Math.random() - 0.5) * 4;
    const cy = y + (Math.random() - 0.5) * 4;

    bctx.save();
    bctx.globalCompositeOperation = "multiply";
    bctx.fillStyle = "rgba(120, 60, 20, 0.22)";
    blobPath(bctx, cx, cy, 20 + Math.random() * 8, 0.7, 10);
    bctx.fill();

    bctx.fillStyle = "rgba(70, 32, 12, 0.5)";
    blobPath(bctx, cx, cy, 12 + Math.random() * 5, 0.8, 9);
    bctx.fill();
    bctx.restore();

    bctx.save();
    bctx.globalCompositeOperation = "source-over";
    bctx.fillStyle = "rgba(18, 9, 5, 0.88)";
    blobPath(bctx, cx, cy, 5.5 + Math.random() * 3, 0.9, 8);
    bctx.fill();

    // fiber cracks radiating from the core
    bctx.strokeStyle = "rgba(35, 16, 6, 0.5)";
    bctx.lineCap = "round";
    const cracks = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < cracks; i++) {
      const a = Math.random() * Math.PI * 2;
      const len = 8 + Math.random() * 14;
      bctx.lineWidth = 0.6 + Math.random() * 1;
      bctx.beginPath();
      bctx.moveTo(cx + Math.cos(a) * 4, cy + Math.sin(a) * 4);
      bctx.lineTo(cx + Math.cos(a) * (4 + len), cy + Math.sin(a) * (4 + len));
      bctx.stroke();
    }
    bctx.restore();
  }

  function burnAlong(x0, y0, x1, y1) {
    const dist = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(1, Math.floor(dist / 6));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      burnAt(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t);
    }
  }

  // glowing ember layer: fades every frame instead of accumulating,
  // so the flame glow trails and dies out instead of leaving hard dots
  function emberLoop() {
    const w = emberCanvas.width / (Math.min(window.devicePixelRatio || 1, 2));
    const h = emberCanvas.height / (Math.min(window.devicePixelRatio || 1, 2));

    ectx.globalCompositeOperation = "destination-out";
    ectx.fillStyle = "rgba(0, 0, 0, 0.15)";
    ectx.fillRect(0, 0, w, h);

    if (isLit && withinPoster(pointerX, pointerY)) {
      ectx.globalCompositeOperation = "lighter";
      const flicker = 12 + Math.sin(Date.now() / 45) * 3 + Math.random() * 3;
      const grad = ectx.createRadialGradient(
        pointerX, pointerY, 0,
        pointerX, pointerY, flicker
      );
      grad.addColorStop(0, "rgba(255, 240, 180, 0.9)");
      grad.addColorStop(0.35, "rgba(255, 140, 30, 0.7)");
      grad.addColorStop(1, "rgba(200, 50, 0, 0)");
      ectx.fillStyle = grad;
      ectx.beginPath();
      ectx.arc(pointerX, pointerY, flicker, 0, Math.PI * 2);
      ectx.fill();
    }

    requestAnimationFrame(emberLoop);
  }
  requestAnimationFrame(emberLoop);

  let idleBurnTimer = null;

  function startFlame() {
    isLit = true;
    cursorEl.classList.add("lit");
    lastBurnX = pointerX;
    lastBurnY = pointerY;
    if (withinPoster(pointerX, pointerY)) burnAt(pointerX, pointerY);
    idleBurnTimer = window.setInterval(() => {
      if (isLit && withinPoster(pointerX, pointerY)) burnAt(pointerX, pointerY);
    }, 110);
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
      lastBurnX = e.clientX;
      lastBurnY = e.clientY;
    } else {
      lastBurnX = e.clientX;
      lastBurnY = e.clientY;
    }
  });

  window.addEventListener("pointerdown", (e) => {
    moveCursor(e.clientX, e.clientY);
    startFlame();
  });

  window.addEventListener("pointerup", extinguish);
  window.addEventListener("pointercancel", extinguish);
  window.addEventListener("blur", extinguish);
})();
