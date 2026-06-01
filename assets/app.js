const state = {
  clinics: [],
  filtered: [],
  markers: new Map(),
  activeCategories: new Set(["GP", "Specialist", "TCM"]),
  activeRatings: new Set(["4.5+", "4.0-4.4", "<4.0 / no rating"]),
  activePriorities: new Set(["low", "medium", "high"]),
  query: "",
};

const colors = {
  GP: "#1d71b8",
  Specialist: "#b83a4b",
  TCM: "#2f855a",
};

const categoryLabels = [
  ["GP", "GP"],
  ["Specialist", "Specialist"],
  ["TCM", "TCM"],
];

const ratingLabels = [
  ["4.5+", "4.5+"],
  ["4.0-4.4", "4.0-4.4"],
  ["<4.0 / no rating", "<4.0 / no rating"],
];

const priorityLabels = [
  ["low", "Low"],
  ["medium", "Medium"],
  ["high", "High"],
];

const map = L.map("map", {
  zoomControl: false,
  preferCanvas: true,
}).setView([1.3521, 103.8198], 11);

L.control.zoom({ position: "bottomright" }).addTo(map);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

const markerLayer = L.layerGroup().addTo(map);

const elements = {
  searchInput: document.querySelector("#searchInput"),
  resultSummary: document.querySelector("#resultSummary"),
  categoryFilters: document.querySelector("#categoryFilters"),
  ratingFilters: document.querySelector("#ratingFilters"),
  resetButton: document.querySelector("#resetButton"),
  locateButton: document.querySelector("#locateButton"),
  toggleCategories: document.querySelector("#toggleCategories"),
  toggleRatings: document.querySelector("#toggleRatings"),
};

function refreshMapLayout() {
  requestAnimationFrame(() => {
    map.invalidateSize({ animate: false, pan: false });
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function compact(value, fallback = "Not available") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function ratingText(clinic) {
  if (clinic.rating == null) return "No rating";
  const count = clinic.reviewCount == null ? "reviews unavailable" : `${clinic.reviewCount} reviews`;
  return `${clinic.rating.toFixed(1)} · ${count}`;
}

function createMarkerIcon(clinic) {
  const label = clinic.category === "Specialist" ? "S" : clinic.category === "TCM" ? "T" : "G";
  const priorityClass = clinic.reviewPriority === "high" ? " priority-high" : "";
  return L.divIcon({
    className: "",
    html: `<div class="marker-pin${priorityClass}" style="background:${colors[clinic.category] || "#176b87"}">${label}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

function popupHtml(clinic) {
  const specialty = clinic.specialty ? `<div class="popup-row">${escapeHtml(clinic.specialty)}</div>` : "";
  const phone = clinic.phone ? `<div class="popup-row">Phone: ${escapeHtml(clinic.phone)}</div>` : "";
  return `
    <div class="popup">
      <h3>${escapeHtml(clinic.name)}</h3>
      <div class="popup-meta">
        <span class="pill">${escapeHtml(clinic.category)}</span>
        <span class="pill">${escapeHtml(clinic.ratingBand)}</span>
        <span class="pill">${escapeHtml(ratingText(clinic))}</span>
      </div>
      ${specialty}
      <div class="popup-row">${escapeHtml(clinic.address)}</div>
      ${phone}
      <div class="popup-row">Google: ${escapeHtml(compact(clinic.googlePlaceName))}</div>
      <a class="maps-link" href="${escapeHtml(clinic.googleMapsUrl)}" target="_blank" rel="noopener">Open in Google Maps</a>
    </div>
  `;
}

function createCheckbox(container, [value, label], set, options = {}) {
  const item = document.createElement("label");
  item.className = "check-item";

  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = set.has(value);
  input.addEventListener("change", () => {
    if (input.checked) set.add(value);
    else set.delete(value);
    applyFilters();
  });

  if (options.swatch) {
    const swatch = document.createElement("span");
    swatch.className = "swatch";
    swatch.style.background = options.swatch(value);
    item.append(input, swatch);
  } else {
    item.append(input);
  }

  const text = document.createElement("span");
  text.className = "check-label";
  text.textContent = label;
  item.append(text);
  container.append(item);
}

function setupFilters() {
  categoryLabels.forEach((item) =>
    createCheckbox(elements.categoryFilters, item, state.activeCategories, {
      swatch: (value) => colors[value],
    }),
  );
  ratingLabels.forEach((item) => createCheckbox(elements.ratingFilters, item, state.activeRatings));
}

function searchableText(clinic) {
  return [
    clinic.name,
    clinic.category,
    clinic.ratingBand,
    clinic.address,
    clinic.phone,
    clinic.specialty,
    clinic.area,
    clinic.region,
    clinic.googlePlaceName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function matchesSearch(clinic) {
  const query = state.query.trim().toLowerCase();
  if (!query) return true;
  return query.split(/\s+/).every((part) => searchableText(clinic).includes(part));
}

function applyFilters() {
  state.query = elements.searchInput.value;
  state.filtered = state.clinics.filter(
    (clinic) =>
      state.activeCategories.has(clinic.category) &&
      state.activeRatings.has(clinic.ratingBand) &&
      matchesSearch(clinic),
  );
  renderMarkers();
  updateSummary();
  refreshMapLayout();
}

function renderMarkers() {
  markerLayer.clearLayers();
  state.markers.clear();

  state.filtered.forEach((clinic) => {
    const marker = L.marker([clinic.lat, clinic.lng], {
      icon: createMarkerIcon(clinic),
      title: clinic.name,
    }).bindPopup(popupHtml(clinic), { maxWidth: 340 });
    marker.addTo(markerLayer);
    state.markers.set(clinic.id, marker);
  });
}

function updateSummary() {
  const total = state.clinics.length;
  const visible = state.filtered.length;
  elements.resultSummary.textContent = `${visible.toLocaleString()} of ${total.toLocaleString()} clinics visible`;
}

function resetFilters() {
  state.activeCategories = new Set(["GP", "Specialist", "TCM"]);
  state.activeRatings = new Set(["4.5+", "4.0-4.4", "<4.0 / no rating"]);
  state.activePriorities = new Set(["low", "medium", "high"]);
  elements.searchInput.value = "";
  elements.categoryFilters.replaceChildren();
  elements.ratingFilters.replaceChildren();
  setupFilters();
  applyFilters();
}

function toggleSet(set, values, container, labels, options) {
  const allSelected = values.every((value) => set.has(value));
  set.clear();
  if (!allSelected) values.forEach((value) => set.add(value));
  container.replaceChildren();
  labels.forEach((item) => createCheckbox(container, item, set, options));
  applyFilters();
}

async function loadClinics() {
  const response = await fetch("data/clinics_latest.json");
  const data = await response.json();
  state.clinics = data.clinics;
  setupFilters();
  applyFilters();
  [0, 150, 500, 1000].forEach((delay) => {
    window.setTimeout(refreshMapLayout, delay);
  });
}

elements.searchInput.addEventListener("input", applyFilters);
elements.resetButton.addEventListener("click", resetFilters);
elements.toggleCategories.addEventListener("click", () =>
  toggleSet(state.activeCategories, categoryLabels.map(([value]) => value), elements.categoryFilters, categoryLabels, {
    swatch: (value) => colors[value],
  }),
);
elements.toggleRatings.addEventListener("click", () =>
  toggleSet(state.activeRatings, ratingLabels.map(([value]) => value), elements.ratingFilters, ratingLabels),
);
elements.locateButton.addEventListener("click", () => {
  map.locate({ setView: true, maxZoom: 15 });
});
window.addEventListener("resize", refreshMapLayout);
window.addEventListener("orientationchange", () => window.setTimeout(refreshMapLayout, 250));
window.addEventListener("pageshow", refreshMapLayout);

loadClinics().catch((error) => {
  elements.resultSummary.textContent = "Unable to load clinic data.";
  console.error(error);
});
