(function () {
  const COUNT_API_BASE = "https://countapi.mileshilliard.com/api/v1";
  const MILESTONES = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

  const els = {
    count: document.getElementById("count"),
    tallySub: document.getElementById("tallySub"),
    faceBtn: document.getElementById("faceBtn"),
    faceImg: document.getElementById("faceImg"),
    popLayer: document.getElementById("popLayer"),
    milestoneLayer: document.getElementById("milestoneLayer"),
    shakeLayer: document.getElementById("shakeLayer"),
  };

  const hasImages = Boolean(CONFIG.seriousFace && CONFIG.tongueOutFace);
  if (!hasImages) {
    els.faceBtn.classList.add("no-images");
  } else {
    els.faceImg.src = CONFIG.seriousFace;
    const preload = new Image();
    preload.src = CONFIG.tongueOutFace;
  }

  let displayedCount = 0;
  let swapTimeout = null;
  let clickLocked = false;
  const seenMilestones = new Set();

  const subLines = [
    "the tally never lies",
    "he can feel it, somehow",
    "recorded for posterity",
    "this is fine, apparently",
    "case remains open",
  ];

  function setCount(n) {
    const prev = displayedCount;
    displayedCount = n;
    els.count.textContent = n.toLocaleString();
    if (n > prev) checkMilestones(n);
  }

  function bumpCountAnim() {
    els.count.classList.remove("bump");
    void els.count.offsetWidth;
    els.count.classList.add("bump");
    els.tallySub.textContent = subLines[Math.floor(Math.random() * subLines.length)];
  }

  function spawnPop(x, y) {
    const n = 2 + Math.floor(Math.random() * 2); // 2-3 particles
    for (let i = 0; i < n; i++) {
      const pop = document.createElement("div");
      pop.className = "pop";
      pop.textContent = "+1";
      const dx = (Math.random() - 0.5) * 90;
      const rot = (Math.random() - 0.5) * 20;
      pop.style.left = x + "px";
      pop.style.top = y + "px";
      pop.style.setProperty("--dx", dx + "px");
      pop.style.setProperty("--rot", rot + "deg");
      pop.style.animationDelay = i * 40 + "ms";
      els.popLayer.appendChild(pop);
      setTimeout(() => pop.remove(), 1000);
    }
  }

  function shakeScreen() {
    els.shakeLayer.classList.remove("shaking");
    void els.shakeLayer.offsetWidth;
    els.shakeLayer.classList.add("shaking");
  }

  function showMilestone(n) {
    const toast = document.createElement("div");
    toast.className = "milestone-toast";
    toast.textContent = `MILESTONE — ${n.toLocaleString()} CLICKS`;
    els.milestoneLayer.appendChild(toast);
    setTimeout(() => toast.remove(), 3100);
    shakeScreen();
  }

  function checkMilestones(n) {
    for (const m of MILESTONES) {
      if (n >= m && !seenMilestones.has(m)) {
        seenMilestones.add(m);
        showMilestone(m);
      }
    }
  }

  function playFaceSwap() {
    if (!hasImages) return;
    clearTimeout(swapTimeout);
    els.faceImg.src = CONFIG.tongueOutFace;
    swapTimeout = setTimeout(() => {
      els.faceImg.src = CONFIG.seriousFace;
    }, CONFIG.faceSwapDurationMs);
  }

  async function fetchCount() {
    try {
      const res = await fetch(`${COUNT_API_BASE}/get/${CONFIG.counterKey}`);
      if (res.status === 404) { setCount(0); return; }
      const data = await res.json();
      if (typeof data.value === "number" && data.value > displayedCount) {
        setCount(data.value);
      } else if (typeof data.value === "number") {
        displayedCount = data.value;
      }
    } catch (e) { /* ignore, retry next poll */ }
  }

  async function hitCount() {
    try {
      const res = await fetch(`${COUNT_API_BASE}/hit/${CONFIG.counterKey}`);
      const data = await res.json();
      const value = Number(data.value);
      if (!Number.isNaN(value)) setCount(value);
    } catch (e) {
      setCount(displayedCount + 1);
    }
  }

  function handleClick(e) {
    if (clickLocked) return;
    clickLocked = true;
    setTimeout(() => { clickLocked = false; }, CONFIG.clickCooldownMs);

    playFaceSwap();
    bumpCountAnim();

    els.faceBtn.classList.add("pressed");
    setTimeout(() => els.faceBtn.classList.remove("pressed"), 120);

    const x = e.clientX || (els.faceBtn.getBoundingClientRect().left + 100);
    const y = e.clientY || (els.faceBtn.getBoundingClientRect().top + 20);
    spawnPop(x, y - 10);

    hitCount();
  }

  els.faceBtn.addEventListener("click", handleClick);

  fetchCount();
  setInterval(fetchCount, CONFIG.pollIntervalMs);
})();
