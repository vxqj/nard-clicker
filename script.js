(function () {
  document.getElementById("siteTitle").textContent = CONFIG.siteTitle;
  document.getElementById("siteSubtitle").textContent = CONFIG.siteSubtitle;
  document.getElementById("caseTag").textContent = "CASE " + CONFIG.caseNumber;
  document.title = `${CONFIG.siteTitle} Sightings — nard.lol`;

  const els = {
    panelEmpty: document.getElementById("panelEmpty"),
    panelReport: document.getElementById("panelReport"),
    panelCount: document.getElementById("panelCount"),
    reportTag: document.getElementById("reportTag"),
    reportTitle: document.getElementById("reportTitle"),
    reportDate: document.getElementById("reportDate"),
    reportLocation: document.getElementById("reportLocation"),
    reportPhotoWrap: document.getElementById("reportPhotoWrap"),
    reportPhoto: document.getElementById("reportPhoto"),
    reportBody: document.getElementById("reportBody"),
    reportClose: document.getElementById("reportClose"),
  };

  els.panelCount.textContent = `${CONFIG.sightings.length} sighting${CONFIG.sightings.length === 1 ? "" : "s"} on record`;

  function showReport(s) {
    els.reportTag.textContent = s.tag || "SIGHTING";
    els.reportTitle.textContent = s.title;
    els.reportDate.textContent = s.date || "";
    els.reportLocation.textContent = s.location || "";
    els.reportBody.textContent = s.report;

    if (s.image) {
      els.reportPhoto.src = s.image;
      els.reportPhoto.alt = s.title;
      els.reportPhotoWrap.hidden = false;
    } else {
      els.reportPhotoWrap.hidden = true;
    }

    els.panelEmpty.hidden = true;
    els.panelReport.hidden = false;
  }

  function showEmpty() {
    els.panelReport.hidden = true;
    els.panelEmpty.hidden = false;
  }

  els.reportClose.addEventListener("click", showEmpty);

  // ── Map setup ────────────────────────────────────────────────────────
  const map = L.map("map", { zoomControl: true }).setView(
    [CONFIG.mapCenter.lat, CONFIG.mapCenter.lng],
    CONFIG.mapZoom
  );

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19,
  }).addTo(map);

  const nardIcon = L.divIcon({
    className: "",
    html: '<div class="nard-pin"><span>👁️</span></div>',
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -30],
  });

  const markers = [];
  CONFIG.sightings.forEach((s) => {
    const marker = L.marker([s.lat, s.lng], { icon: nardIcon }).addTo(map);
    marker.bindPopup(`<strong>${s.title}</strong><br>${s.location || ""}`);
    marker.on("click", () => showReport(s));
    markers.push(marker);
  });

  if (markers.length > 1) {
    const group = L.featureGroup(markers);
    map.fitBounds(group.getBounds().pad(0.3));
  }
})();
