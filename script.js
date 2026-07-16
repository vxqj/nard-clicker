(function () {
  const COUNT_API_BASE = "https://countapi.mileshilliard.com/api/v1";
  const MILESTONES = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000];
  const POP_COLORS = ["#ff6b1f", "#ffc93c", "#ff9142", "#ff3b3b"];

  const els = {
    count: document.getElementById("count"),
    cps: document.getElementById("cps"),
    streak: document.getElementById("streak"),
    faceBtn: document.getElementById("faceBtn"),
    faceImg: document.getElementById("faceImg"),
    popLayer: document.getElementById("popLayer"),
    milestoneLayer: document.getElementById("milestoneLayer"),
    flash: document.getElementById("flash"),
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
  const seenMilestones = new Set();
  const clickTimes = [];
  let streak = 0;
  let lastClickAt = 0;

  function setCountIfHigher(n) {
    if (n > displayedCount) {
      displayedCount = n;
      els.count.textContent = n.toLocaleString();
      checkMilestones(n);
    }
  }

  function incrementLocal() {
    displayedCount += 1;
    els.count.textContent = displayedCount.toLocaleString();
    checkMilestones(displayedCount);
  }

  function bumpCountAnim() {
    els.count.classList.remove("bump");
    void els.count.offsetWidth;
    els.count.classList.add("bump");
  }

  function updateRateStats(now) {
    clickTimes.push(now);
    while (clickTimes.length && now - clickTimes[0] > 1000) clickTimes.shift();
    els.cps.textContent = clickTimes.length;

    if (now - lastClickAt < 700) {
      streak += 1;
    } else {
      streak = 1;
    }
    lastClickAt = now;
    els.streak.textContent = streak;
  }

  function spawnPop(x, y) {
    const n = 2 + Math.floor(Math.random() * 3); // 2-4 particles
    for (let i = 0; i < n; i++) {
      const pop = document.createElement("div");
      pop.className = "pop";
      pop.textContent = "+1";
      const dx = (Math.random() - 0.5) * 120;
      const rot = (Math.random() - 0.5) * 30;
      const size = 16 + Math.random() * 12;
      pop.style.left = x + "px";
      pop.style.top = y + "px";
      pop.style.fontSize = size + "px";
      pop.style.color = POP_COLORS[Math.floor(Math.random() * POP_COLORS.length)];
      pop.style.setProperty("--dx", dx + "px");
      pop.style.setProperty("--rot", rot + "deg");
      pop.style.animationDelay = i * 30 + "ms";
      els.popLayer.appendChild(pop);
      setTimeout(() => pop.remove(), 900);
    }
  }

  function flashScreen() {
    els.flash.classList.remove("go");
    void els.flash.offsetWidth;
    els.flash.classList.add("go");
  }

  function showMilestone(n) {
    const toast = document.createElement("div");
    toast.className = "milestone-toast";
    toast.textContent = `${n.toLocaleString()} CLICKS 🔥`;
    els.milestoneLayer.appendChild(toast);
    setTimeout(() => toast.remove(), 2900);
    flashScreen();
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
      if (res.status === 404) return;
      const data = await res.json();
      if (typeof data.value === "number") setCountIfHigher(data.value);
    } catch (e) { /* ignore, retry next poll */ }
  }

  function hitCount() {
    // fire-and-forget: UI already updated optimistically, this just
    // syncs the shared total in the background without blocking anything
    fetch(`${COUNT_API_BASE}/hit/${CONFIG.counterKey}`)
      .then((res) => res.json())
      .then((data) => {
        const value = Number(data.value);
        if (!Number.isNaN(value)) setCountIfHigher(value);
      })
      .catch(() => { /* local optimistic count already stands, fine as-is */ });
  }

  function handleClick(e) {
    const now = performance.now();

    playFaceSwap();
    incrementLocal();
    bumpCountAnim();
    updateRateStats(now);

    els.faceBtn.classList.add("pressed");
    setTimeout(() => els.faceBtn.classList.remove("pressed"), 90);

    const rect = els.faceBtn.getBoundingClientRect();
    const x = e.clientX || (rect.left + rect.width / 2);
    const y = e.clientY || (rect.top + rect.height / 2);
    spawnPop(x, y);

    hitCount();
  }

  els.faceBtn.addEventListener("click", handleClick);

  fetchCount();
  setInterval(fetchCount, CONFIG.pollIntervalMs);
})();
