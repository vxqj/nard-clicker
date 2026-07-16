// ─────────────────────────────────────────────────────────────────────────
// CLICKER CONFIG — this is the only file you should need to touch for images.
//
// 1. Upload Mitchell's two faces to catbox.moe (or imgbb, whichever) and
//    paste the DIRECT image links below (the ones ending in .jpg/.png,
//    not a page link like ibb.co/xxxxx or catbox.moe/c/xxxxx).
//
// 2. The counter is global and public via countapi.mileshilliard.com —
//    no signup needed. counterKey just needs to be unique so nobody
//    else's site accidentally shares your count. It's already set to
//    something unique below, you don't need to change it.
//
// Want to change the title/subtitle text? That lives directly in
// index.html now (search for "masthead") since it's part of the layout.
// ─────────────────────────────────────────────────────────────────────────

const CONFIG = {
  // Face shown normally / after the click animation finishes
  seriousFace: "https://i.ibb.co/XRW2R1p/Chat-GPT-Image-Jul-16-2026-12-07-01-PM-removebg-preview.png",

  // Face shown briefly the instant you click
  tongueOutFace: "https://i.ibb.co/yFvg1KmJ/Pix-Verse-Image-Effect-prompt-Make-me-stick-my-removebg-preview.png",

  // How long the tongue-out face stays up before flipping back, in ms
  faceSwapDurationMs: 220,

  // Minimum time between registered clicks, in ms — stops rapid spam-clicks
  // from firing faster than the animation can keep up with
  clickCooldownMs: 260,

  // Unique key for the global counter (don't need to touch this)
  counterKey: "nardlol-bignard-global-clicker-v1",

  // How often (ms) to poll for other people's clicks
  pollIntervalMs: 2000,
};
