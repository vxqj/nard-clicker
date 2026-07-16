(function () {
  const COUNT_API_BASE = "https://countapi.mileshilliard.com/api/v1";

  const els = {
    title: document.getElementById("title"),
    subtitle: document.getElementById("subtitle"),
    count: document.getElementById("count"),
    faceBtn: document.getElementById("faceBtn"),
    faceImg: document.getElementById("faceImg"),
    popLayer: document.getElementById("popLayer"),
  };

  // ── Apply text + images from config ─────────────────────────────────
  els.title.textContent = CONFIG.title;
  els.subtitle.textContent = CONFIG.subtitle;

  const hasImages = Boolean(CONFIG.seriousFace && CONFIG.tongueOutFace);
  if (!hasImages) {
    els.faceBtn.classList.add("no-images");
  } else {
    els.faceImg.src = CONFIG.seriousFace;
  }

  // Preload the tongue-out frame so the swap is instant
  if (CONFIG.tongueOutFace) {
    const preload = new Image();
    preload.src = CONFIG.tongueOutFace;
  }

  // ── Local count display, synced against the server ──────────────────
  let displayedCount = 0;
  let swapTimeout = null;

  function setCount(n) {
    displayedCount = n;
    els.count.textContent = n.toLocaleString();
  }

  function bumpCountAnim() {
    els.count.classList.remove("bump");
    // force reflow so the animation can retrigger
    void els.count.offsetWidth;
    els.count.classList.add("bump");
  }

  function spawnPop(x, y) {
    const pop = document.createElement("div");
    pop.className = "pop";
    pop.textContent = "+1";
    pop.style.left = x + "px";
    pop.style.top = y + "px";
    els.popLayer.appendChild(pop);
    setTimeout(() => pop.remove(), 950);
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
      if (res.status === 404) {
        setCount(0);
        return;
      }
      const data = await res.json();
      if (typeof data.value === "number") setCount(data.value);
    } catch (e) {
      // silently ignore network hiccups, we'll retry on the next poll
    }
  }

  async function hitCount() {
    try {
      const res = await fetch(`${COUNT_API_BASE}/hit/${CONFIG.counterKey}`);
      const data = await res.json();
      const value = Number(data.value);
      if (!Number.isNaN(value)) setCount(value);
    } catch (e) {
      // if the request fails, do a local optimistic bump so the click
      // still feels responsive; it'll self-correct on the next poll
      setCount(displayedCount + 1);
    }
  }

  function handleClick(e) {
    playFaceSwap();
    bumpCountAnim();

    els.faceBtn.classList.add("pressed");
    setTimeout(() => els.faceBtn.classList.remove("pressed"), 100);

    const rect = els.faceBtn.getBoundingClientRect();
    const x = (e.clientX || rect.left + rect.width / 2) ;
    const y = (e.clientY || rect.top);
    spawnPop(x, y - 10);

    hitCount();
  }

  els.faceBtn.addEventListener("click", handleClick);

  // ── Init + live polling for other people's clicks ───────────────────
  fetchCount();
  setInterval(fetchCount, CONFIG.pollIntervalMs);
})();
