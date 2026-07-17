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
})();
