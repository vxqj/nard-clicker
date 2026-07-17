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

  function sizeBurnCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    burnCanvas.width = window.innerWidth * dpr;
    burnCanvas.height = window.innerHeight * dpr;
    bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  sizeBurnCanvas();
  window.addEventListener("resize", sizeBurnCanvas);

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

  // stamp one scorch mark: outer singe, mid char, dark core
  function burnAt(x, y) {
    const jitter = () => (Math.random() - 0.5) * 6;
    const cx = x + jitter();
    const cy = y + jitter();

    bctx.globalCompositeOperation = "source-over";

    bctx.beginPath();
    bctx.fillStyle = "rgba(90, 50, 20, 0.16)";
    bctx.arc(cx, cy, 16 + Math.random() * 6, 0, Math.PI * 2);
    bctx.fill();

    bctx.beginPath();
    bctx.fillStyle = "rgba(40, 20, 8, 0.45)";
    bctx.arc(cx, cy, 9 + Math.random() * 4, 0, Math.PI * 2);
    bctx.fill();

    bctx.beginPath();
    bctx.fillStyle = "rgba(8, 4, 2, 0.9)";
    bctx.arc(cx, cy, 4 + Math.random() * 2.5, 0, Math.PI * 2);
    bctx.fill();
  }

  function burnAlong(x0, y0, x1, y1) {
    const dist = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(1, Math.floor(dist / 5));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      burnAt(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t);
    }
  }

  let idleBurnTimer = null;

  function startFlame() {
    isLit = true;
    cursorEl.classList.add("lit");
    lastBurnX = pointerX;
    lastBurnY = pointerY;
    if (withinPoster(pointerX, pointerY)) burnAt(pointerX, pointerY);
    idleBurnTimer = window.setInterval(() => {
      if (isLit && withinPoster(pointerX, pointerY)) burnAt(pointerX, pointerY);
    }, 90);
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
