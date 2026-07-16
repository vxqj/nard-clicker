// ─────────────────────────────────────────────────────────────────────────
// CLICKER CONFIG — this is the only file you should need to touch for images.
//
// 1. Upload Mitchell's two faces to catbox.moe and paste the DIRECT image
//    links below (the ones ending in .jpg/.png, not a page link like
//    ibb.co/xxxxx). USE CATBOX, NOT IMGBB — imgbb blocks images from
//    loading on any site that isn't imgbb.com itself, which is why the
//    faces haven't been showing up. Catbox doesn't do this.
//
// 2. The counter is global and public via countapi.mileshilliard.com —
//    no signup needed. counterKey just needs to be unique so nobody
//    else's site accidentally shares your count. Already set below.
// ─────────────────────────────────────────────────────────────────────────

const CONFIG = {
  // Face shown normally / after the click animation finishes
  seriousFace: "https://ibb.co/hzg7zbH",

  // Face shown briefly the instant you click
  tongueOutFace: "https://ibb.co/jk032q9F",

  // How long the tongue-out face stays up before flipping back, in ms
  faceSwapDurationMs: 180,

  // Unique key for the global counter (don't need to touch this)
  counterKey: "nardlol-bignard-global-clicker-v1",

  // How often (ms) to poll for other people's clicks
  pollIntervalMs: 2000,
};
