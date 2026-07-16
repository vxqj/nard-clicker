// ─────────────────────────────────────────────────────────────────────────
// SIGHTINGS CONFIG — this is the only file you should need to touch.
//
// HOW TO GET COORDINATES:
// Go to Google Maps, right-click any spot, click the lat/lng numbers at
// the top of the menu to copy them (e.g. "40.712776, -74.005974").
// Paste the first number as `lat`, the second as `lng`.
//
// PHOTOS: upload to catbox.moe (not imgbb — it blocks hotlinking) and
// paste the direct link (ends in .jpg/.png) into `image`. Leave "" for
// no photo on that report.
// ─────────────────────────────────────────────────────────────────────────

const CONFIG = {
  siteTitle: "BIG NARD",
  siteSubtitle: "Confirmed Sightings & Field Reports",
  caseNumber: "NL-0930",

  // Where the map opens by default. Set this to your actual town/area —
  // right-click the center of your town on Google Maps to grab coords.
  mapCenter: { lat: 40.7128, lng: -74.006 },
  mapZoom: 12,

  sightings: [
    {
      title: "The Diagnosis",
      date: "Origin unknown",
      location: "Somewhere, at some point",
      lat: 40.7128,
      lng: -74.006,
      image: "",
      report:
        "First confirmed sighting of the anomaly that would come to define him. Witnesses agree: one side of Mitchell is dramatically, unmistakably larger than the other. The name Big Nard was assigned on-site and has stuck ever since.",
      tag: "ORIGIN",
    },
    {
      title: "The Shack Incident",
      date: "14:55",
      location: "The old shack, deep in the woods",
      lat: 40.7328,
      lng: -73.986,
      image: "",
      report:
        "Subject entered the woods in good spirits. By mid-afternoon, a total lack of bathroom facilities at the shack forced a reckoning his body had already decided to win. It went down his leg. There is no version of this report where it doesn't.",
      tag: "INCIDENT",
    },
    {
      title: "Isaac's Rescue",
      date: "15:20",
      location: "The trail back out of the woods",
      lat: 40.719,
      lng: -73.996,
      image: "",
      report:
        "While others recoiled, Isaac did not hesitate. He walked Mitchell out of the woods personally, step by humiliating step, cracking just enough jokes to keep morale up without making it worse. A true field medic of friendship.",
      tag: "HEROISM",
    },
  ],
};
