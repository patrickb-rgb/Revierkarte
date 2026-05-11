
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations?.().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  }).catch(() => {});
}

const statusEl = document.getElementById("statusBadge");

const menuBtn = document.getElementById("menuBtn");
const installBtn = document.getElementById("installBtn");

const floatingCreateBtn = document.getElementById("floatingCreateBtn");
const floatingMoveBtn = document.getElementById("floatingMoveBtn");
const floatingPdfBtn = document.getElementById("floatingPdfBtn");
const floatingSeriesBtn = document.getElementById("floatingSeriesBtn");
const floatingBackupBtn = document.getElementById("floatingBackupBtn");
const floatingListBtn = document.getElementById("floatingListBtn");
const floatingGpsBtn = document.getElementById("floatingGpsBtn");

const settingsModal = document.getElementById("settingsModal");
const closeSettingsModalBtn = document.getElementById("closeSettingsModalBtn");

const seriesModal = document.getElementById("seriesModal");
const closeSeriesModalBtn = document.getElementById("closeSeriesModalBtn");

const backupModal = document.getElementById("backupModal");
const closeBackupModalBtn = document.getElementById("closeBackupModalBtn");

const listModal = document.getElementById("listModal");
const closeListModalBtn = document.getElementById("closeListModalBtn");

const pdfModal = document.getElementById("pdfModal");
const closePdfModalBtn = document.getElementById("closePdfModalBtn");

const editModal = document.getElementById("editModal");
const closeEditModalBtn = document.getElementById("closeEditModalBtn");

const loadBtn = document.getElementById("loadBtn");
const saveBtn = document.getElementById("saveBtn");
const clearBtn = document.getElementById("clearBtn");
const createSeriesBtn = document.getElementById("createSeriesBtn");

const exportJsonBtn = document.getElementById("exportJsonBtn");
const importJsonBtn = document.getElementById("importJsonBtn");
const importJsonInput = document.getElementById("importJsonInput");

const newText = document.getElementById("newText");
const newColor = document.getElementById("newColor");
const newShape = document.getElementById("newShape");
const newFontSize = document.getElementById("newFontSize");
const newSymbolSize = document.getElementById("newSymbolSize");
const newWidth = document.getElementById("newWidth");
const newHeight = document.getElementById("newHeight");
const newDescription = document.getElementById("newDescription");

const seriesPrefix = document.getElementById("seriesPrefix");
const seriesStart = document.getElementById("seriesStart");
const seriesEnd = document.getElementById("seriesEnd");

const editText = document.getElementById("editText");
const editColor = document.getElementById("editColor");
const editShape = document.getElementById("editShape");
const editFontSize = document.getElementById("editFontSize");
const editSymbolSize = document.getElementById("editSymbolSize");
const editWidth = document.getElementById("editWidth");
const editHeight = document.getElementById("editHeight");
const editEasting = document.getElementById("editEasting");
const editNorthing = document.getElementById("editNorthing");
const editDescription = document.getElementById("editDescription");
const applyBtn = document.getElementById("applyBtn");
const deleteBtn = document.getElementById("deleteBtn");

const markerListEl = document.getElementById("markerList");
const markerFilterEl = document.getElementById("markerFilter");

const exportAreaEl = document.getElementById("exportArea");
const exportPdfBtn = document.getElementById("exportPdfBtn");

const STORAGE_KEY = "revierkarte_markers_v2";
const TILE_SIZE = 256;
const MERCATOR_LIMIT = 20037508.342789244;

let deferredPrompt = null;

const EXPORT_AREAS = {
  "Killwangen": {
    topLeft: [2667121.422959819, 1253959.7345927265],
    bottomRight: [2669119.7719010995, 1252106.2069397648]
  },
  "Remetschwil": {
    topLeft: [2667201.9893354657, 1252281.0968405611],
    bottomRight: [2669259.2486057994, 1250738.2089206805]
  },
  "Spreitenbach-Nord": {
    topLeft: [2668060.254986482, 1253550.0026197082],
    bottomRight: [2669812.898225366, 1251625.1331947674]
  },
  "Spreitenbach-Süd": {
    topLeft: [2668243.84425783, 1252089.59135246],
    bottomRight: [2671212.569289755, 1250585.7517191079]
  },
  "Bellikon": {
    topLeft: [2667076.4939424605, 1250921.8050311094],
    bottomRight: [2670012.1523289075, 1247439.3552220082]
  },
  "Bergdietikon-Nord": {
    topLeft: [2669231.651667507, 1250847.2904884377],
    bottomRight: [2672321.3875823063, 1248593.9566039904]
  },
  "Bergdietikon-Süd": {
    topLeft: [2669652.0428149523, 1248706.5598144184],
    bottomRight: [2672512.1580805406, 1247172.916863532]
  },
  "Revierkarte": {
    topLeft: [2665863.7398292096, 1253939.9619140048],
    bottomRight: [2673141.04051996, 1246712.843765177]
  }
};

const state = {
  markers: [],
  selectedId: null,
  createMode: false,
  moveMode: false,
  nextId: 1,
  map: null,
  leafletMarkers: new Map(),
  lastTapByMarkerId: new Map(),
  gpsMarker: null,
  gpsAccuracyCircle: null
};

proj4.defs(
  "EPSG:2056",
  "+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 " +
    "+k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel " +
    "+towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs"
);

proj4.defs(
  "EPSG:3857",
  "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 " +
    "+x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs"
);

function setStatus(text) {
  if (statusEl) statusEl.textContent = text;
}

function safeNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function lv95To3857(e, n) {
  return proj4("EPSG:2056", "EPSG:3857", [e, n]);
}

function epsg3857ToLv95(x, y) {
  return proj4("EPSG:3857", "EPSG:2056", [x, y]);
}

function mercatorToPixel(mx, my, zoom) {
  const scale = TILE_SIZE * Math.pow(2, zoom);
  const px = ((mx + MERCATOR_LIMIT) / (2 * MERCATOR_LIMIT)) * scale;
  const py = ((MERCATOR_LIMIT - my) / (2 * MERCATOR_LIMIT)) * scale;
  return [px, py];
}

function chooseExportZoom(minX, minY, maxX, maxY, targetPxW = 4000, targetPxH = 3000, zoomBias = 1) {
  let chosen = 0;

  for (let zoom = 18; zoom >= 0; zoom--) {
    const [px1, py1] = mercatorToPixel(minX, maxY, zoom);
    const [px2, py2] = mercatorToPixel(maxX, minY, zoom);
    const width = Math.abs(px2 - px1);
    const height = Math.abs(py2 - py1);

    if (width <= targetPxW && height <= targetPxH) {
      chosen = zoom;
      break;
    }
  }

  return Math.min(18, Math.max(0, chosen + zoomBias));
}

function getSelectedMarker() {
  return state.markers.find((m) => m.id === state.selectedId) || null;
}

function guessMarkerShape(marker) {
  const explicit = String(marker.shape || "").toLowerCase();
  if (explicit === "circle" || explicit === "triangle" || explicit === "rect") return explicit;

  const type = String(marker.marker_type || marker.type || marker.category || "").toLowerCase();
  if (type.includes("brunnen") || type.includes("salz")) return "circle";

  return "rect";
}

function normalizeMarkers(data) {
  const markers = Array.isArray(data?.markers) ? data.markers : Array.isArray(data) ? data : [];
  return markers.map((m, index) => {
    const markerType = String(m.marker_type || m.type || m.category || "");
    const shape = guessMarkerShape(m);

    return {
      id: Number(m.id) || index + 1,
      text: String(m.text || ""),
      color: String(m.color || "#ff0000"),
      font_size: safeNumber(m.font_size, 30),
      rect_w: safeNumber(m.rect_w, 120),
      rect_h: safeNumber(m.rect_h, 60),
      circle_size: safeNumber(m.circle_size || m.symbol_size, 80),
      shape,
      marker_type: markerType,
      category: String(m.category || markerType || ""),
      lv95_e: safeNumber(m.lv95_e, 0),
      lv95_n: safeNumber(m.lv95_n, 0),
      description: String(m.description || ""),
      updated_at: String(m.updated_at || m.updatedAt || ""),
      updated_by: String(m.updated_by || m.updatedByName || "")
    };
  });
}

function autosaveMarkers() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ markers: state.markers }));
  } catch (error) {
    console.error("Autosave fehlgeschlagen:", error);
  }
}

function updateFloatingButtons() {
  if (floatingCreateBtn) floatingCreateBtn.classList.toggle("active", state.createMode);
  if (floatingMoveBtn) floatingMoveBtn.classList.toggle("active", state.moveMode);
}

function openModal(modal) {
  if (modal) modal.classList.remove("hidden");
}

function closeModal(modal) {
  if (modal) modal.classList.add("hidden");
}

function closeAllModals() {
  [settingsModal, seriesModal, backupModal, listModal, pdfModal, editModal].forEach(closeModal);
}

function updateEditor() {
  const marker = getSelectedMarker();
  const disabled = !marker;

  [
    editText,
    editColor,
    editShape,
    editFontSize,
    editSymbolSize,
    editWidth,
    editHeight,
    editEasting,
    editNorthing,
    editDescription,
    applyBtn,
    deleteBtn
  ].forEach((el) => {
    if (el) el.disabled = disabled;
  });

  if (!marker) {
    if (editText) editText.value = "";
    if (editColor) editColor.value = "#ff0000";
    if (editShape) editShape.value = "rect";
    if (editFontSize) editFontSize.value = "";
    if (editSymbolSize) editSymbolSize.value = "";
    if (editWidth) editWidth.value = "";
    if (editHeight) editHeight.value = "";
    if (editEasting) editEasting.value = "";
    if (editNorthing) editNorthing.value = "";
    if (editDescription) editDescription.value = "";
    return;
  }

  if (editText) editText.value = marker.text || "";
  if (editColor) editColor.value = marker.color || "#ff0000";
  if (editShape) editShape.value = marker.shape || "rect";
  if (editFontSize) editFontSize.value = marker.font_size ?? 30;
  if (editSymbolSize) editSymbolSize.value = marker.circle_size ?? marker.symbol_size ?? 80;
  if (editWidth) editWidth.value = marker.rect_w ?? 120;
  if (editHeight) editHeight.value = marker.rect_h ?? 60;
  if (editEasting) editEasting.value = marker.lv95_e ?? "";
  if (editNorthing) editNorthing.value = marker.lv95_n ?? "";
  if (editDescription) editDescription.value = marker.description || "";
}

function openEditModal(marker) {
  if (!marker) return;
  state.selectedId = marker.id;
  updateEditor();
  rebuildMarkers();
  openModal(editModal);
  setStatus(`Marker „${marker.text}“ bearbeiten.`);
}

function markerSvg(marker, selected = false) {
  const text = String(marker.text || "");
  const fill = marker.color || "#ff0000";
  const outline = selected ? "#00ffff" : "#000000";
  const outlineWidth = selected ? 6 : 3;

  const shape = marker.shape || "rect";

  const rectW = Math.max(20, Number(marker.rect_w) || 120);
  const rectH = Math.max(20, Number(marker.rect_h) || 60);
  const fontSize = Math.max(10, Number(marker.font_size) || 30);

  const symbolSize = Math.max(8, Number(marker.circle_size) || 24);

  if (shape === "circle") {
    const size = symbolSize + outlineWidth * 2;
    const r = symbolSize / 2;

    return `
      <svg xmlns="http://www.w3.org/2000/svg"
           width="${size}"
           height="${size}"
           viewBox="0 0 ${size} ${size}">
        <circle
          cx="${size / 2}"
          cy="${size / 2}"
          r="${r}"
          fill="${fill}"
          stroke="${outline}"
          stroke-width="${outlineWidth}"
        />
      </svg>
    `;
  }

  if (shape === "triangle") {
    const size = symbolSize + outlineWidth * 2;

    return `
      <svg xmlns="http://www.w3.org/2000/svg"
           width="${size}"
           height="${size}"
           viewBox="0 0 ${size} ${size}">
        <polygon
          points="${size / 2},0 0,${size} ${size},${size}"
          fill="${fill}"
          stroke="${outline}"
          stroke-width="${outlineWidth}"
        />
      </svg>
    `;
  }

  const shaftHeight = 20;
  const width = rectW + outlineWidth * 2;
  const height = rectH + shaftHeight + outlineWidth * 2;

  const rectX = outlineWidth;
  const rectY = outlineWidth;

  const shaftX = width / 2 - 2;
  const shaftY = rectH;

  return `
    <svg xmlns="http://www.w3.org/2000/svg"
         width="${width}"
         height="${height}"
         viewBox="0 0 ${width} ${height}">

      <rect
        x="${rectX}"
        y="${rectY}"
        width="${rectW}"
        height="${rectH}"
        fill="${fill}"
        stroke="${outline}"
        stroke-width="${outlineWidth}"
      />

      <rect
        x="${shaftX}"
        y="${shaftY}"
        width="4"
        height="${shaftHeight}"
        fill="${fill}"
        stroke="#000000"
        stroke-width="2"
      />

      <text
        x="${width / 2}"
        y="${rectH / 2 + 3}"
        text-anchor="middle"
        dominant-baseline="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${fontSize}"
        font-weight="700"
        fill="#000000"
      >${text}</text>
    </svg>
  `;
}

function buildDivIcon(marker, selected = false) {
  const shape = marker.shape || "rect";

  if (shape === "circle" || shape === "triangle") {
    const size = Math.max(20, Number(marker.circle_size || marker.symbol_size) || 80) + (selected ? 12 : 6);

    return L.divIcon({
      className: "marker-icon-wrapper",
      html: markerSvg(marker, selected),
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });
  }

  const width = Math.round(Math.max(20, Number(marker.rect_w) || 120));
  const height = Math.round(Math.max(20, Number(marker.rect_h) || 60));
  const shaftHeight = 20;

  return L.divIcon({
    className: "marker-icon-wrapper",
    html: markerSvg(marker, selected),
    iconSize: [width, height + shaftHeight],
    iconAnchor: [Math.round(width / 2), height + shaftHeight]
  });
}

function sortMarkers(markers) {
  return [...markers].sort((a, b) => {
    const ma = String(a.text || "").match(/^(\D*?)(\d+)?$/);
    const mb = String(b.text || "").match(/^(\D*?)(\d+)?$/);

    if (!ma || !mb) {
      return String(a.text || "").localeCompare(String(b.text || ""), "de", { numeric: true });
    }

    const prefixA = ma[1] || "";
    const prefixB = mb[1] || "";
    if (prefixA !== prefixB) return prefixA.localeCompare(prefixB, "de");

    return Number(ma[2] || 0) - Number(mb[2] || 0);
  });
}

function renderMarkerList() {
  if (!markerListEl || !markerFilterEl) return;

  const filter = String(markerFilterEl.value || "").trim().toLowerCase();
  let markers = sortMarkers(state.markers);

  if (filter) {
    markers = markers.filter((m) => String(m.text || "").toLowerCase().includes(filter));
  }

  markerListEl.innerHTML = "";

  for (const marker of markers) {
    const div = document.createElement("div");
    div.className = "marker-item";
    if (marker.id === state.selectedId) div.classList.add("active");

    div.textContent = marker.text || "(ohne Namen)";
    div.addEventListener("click", () => {
      state.selectedId = marker.id;
      rebuildMarkers();

      const [x3857, y3857] = lv95To3857(marker.lv95_e, marker.lv95_n);
      const ll = L.CRS.EPSG3857.unproject(L.point(x3857, y3857));
      state.map.setView(ll, 17);
      closeModal(listModal);
    });

    markerListEl.appendChild(div);
  }
}

function rebuildMarkers() {
  if (!state.map) return;

  // Sicherheitsnetz: fehlende Form-/Typ-Felder ergänzen
  state.markers = normalizeMarkers({ markers: state.markers });

  state.lastTapByMarkerId.clear();

  state.leafletMarkers.forEach((markerObj) => state.map.removeLayer(markerObj));
  state.leafletMarkers.clear();

  for (const marker of state.markers) {
    const [x3857, y3857] = lv95To3857(marker.lv95_e, marker.lv95_n);
    const latLng = L.CRS.EPSG3857.unproject(L.point(x3857, y3857));

    const leafletMarker = L.marker(latLng, {
      draggable: state.moveMode,
      icon: buildDivIcon(marker, marker.id === state.selectedId),
      autoPan: false,
      keyboard: false
    });

    leafletMarker.on("click", () => {
      const now = Date.now();
      const lastTap = state.lastTapByMarkerId.get(marker.id) || 0;

      if (now - lastTap < 300) {
        openEditModal(marker);
      } else {
        state.selectedId = marker.id;
        rebuildMarkers();
      }

      state.lastTapByMarkerId.set(marker.id, now);
    });

    leafletMarker.on("dblclick", () => {
      openEditModal(marker);
    });

    leafletMarker.on("dragend", (event) => {
      const ll = event.target.getLatLng();
      const p = L.CRS.EPSG3857.project(ll);
      const [e, n] = epsg3857ToLv95(p.x, p.y);

      marker.lv95_e = e;
      marker.lv95_n = n;
      state.selectedId = marker.id;
      rebuildMarkers();
      autosaveMarkers();
      setStatus(`Marker „${marker.text}“ verschoben.`);
    });

    leafletMarker.addTo(state.map);
    state.leafletMarkers.set(marker.id, leafletMarker);
  }

  updateEditor();
  renderMarkerList();
  updateFloatingButtons();
}

async function loadMarkers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      state.markers = [];
      state.nextId = 1;
      state.selectedId = null;
      rebuildMarkers();
      setStatus("Keine lokal gespeicherten Marker gefunden.");
      return;
    }

    state.markers = normalizeMarkers(JSON.parse(raw));
    state.nextId = Math.max(1, ...state.markers.map((m) => Number(m.id) || 0)) + 1;
    state.selectedId = null;

    rebuildMarkers();
    setStatus(`${state.markers.length} Marker lokal geladen.`);
  } catch (error) {
    console.error(error);
    setStatus("Lokale Marker konnten nicht geladen werden.");
  }
}

async function saveMarkers() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ markers: state.markers }));
    setStatus("Marker lokal gespeichert.");
    closeModal(backupModal);
  } catch (error) {
    console.error(error);
    setStatus("Lokales Speichern fehlgeschlagen.");
  }
}

function exportJsonBackup() {
  try {
    const payload = {
      exported_at: new Date().toISOString(),
      version: 1,
      markers: state.markers
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `revierkarte_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    setStatus("JSON-Backup exportiert.");
    closeModal(backupModal);
  } catch (error) {
    console.error(error);
    setStatus("JSON-Export fehlgeschlagen.");
  }
}

function importJsonBackup(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      state.markers = normalizeMarkers(JSON.parse(reader.result));
      state.nextId = Math.max(1, ...state.markers.map((m) => Number(m.id) || 0)) + 1;
      state.selectedId = null;

      rebuildMarkers();
      autosaveMarkers();
      setStatus(`${state.markers.length} Marker aus JSON importiert.`);
      closeModal(backupModal);
    } catch (error) {
      console.error(error);
      setStatus("JSON-Import fehlgeschlagen.");
    }
  };

  reader.onerror = () => {
    setStatus("Datei konnte nicht gelesen werden.");
  };

  reader.readAsText(file, "utf-8");
}

function createMarkerAtLatLng(latlng) {
  const p = L.CRS.EPSG3857.project(latlng);
  const [e, n] = epsg3857ToLv95(p.x, p.y);

  const markerType = "";
  const marker = {
    id: state.nextId++,
    text: newText?.value || `M${state.nextId - 1}`,
    color: newColor?.value || "#ff0000",
    font_size: safeNumber(newFontSize?.value, 30),
    rect_w: safeNumber(newWidth?.value, 120),
    rect_h: safeNumber(newHeight?.value, 60),
    circle_size: safeNumber(newSymbolSize?.value, 24),
    symbol_size: safeNumber(newSymbolSize?.value, 80),
    shape: newShape?.value || "rect",
    marker_type: markerType,
    category: markerType,
    lv95_e: e,
    lv95_n: n,
    description: newDescription?.value || ""
  };

  state.markers.push(marker);
  state.selectedId = marker.id;
  rebuildMarkers();
  autosaveMarkers();
  setStatus(`Marker „${marker.text}“ erstellt.`);
}

function createSeriesMarkers() {
  if (!state.map) return;

  const prefix = String(seriesPrefix?.value || "").trim();
  const start = Math.floor(safeNumber(seriesStart?.value, 1));
  const end = Math.floor(safeNumber(seriesEnd?.value, 10));

  if (start < 1 || end < 1 || end < start) {
    setStatus("Ungültiger Bereich für Serienmarker.");
    return;
  }

  const count = end - start + 1;
  if (count > 500) {
    setStatus("Zu viele Serienmarker auf einmal.");
    return;
  }

  const bounds = state.map.getBounds();
  const nw = L.CRS.EPSG3857.project(bounds.getNorthWest());
  const se = L.CRS.EPSG3857.project(bounds.getSouthEast());

  const minX = nw.x;
  const maxX = se.x;
  const maxY = nw.y;
  const minY = se.y;

  const cols = Math.min(10, count);
  const rows = Math.ceil(count / cols);

  const stepX = cols > 1 ? (maxX - minX) / (cols + 1) : (maxX - minX) / 2;
  const stepY = rows > 1 ? (maxY - minY) / (rows + 1) : (maxY - minY) / 2;

  const created = [];

  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);

    const x3857 = cols > 1 ? minX + stepX * (col + 1) : minX + stepX;
    const y3857 = rows > 1 ? maxY - stepY * (row + 1) : maxY - stepY;

    const [e, n] = epsg3857ToLv95(x3857, y3857);

    const markerType = "";
    const marker = {
      id: state.nextId++,
      text: `${prefix}${start + i}`,
      color: newColor?.value || "#ff0000",
      font_size: safeNumber(newFontSize?.value, 30),
      rect_w: safeNumber(newWidth?.value, 120),
      rect_h: safeNumber(newHeight?.value, 60),
      circle_size: safeNumber(newSymbolSize?.value, 80),
      symbol_size: safeNumber(newSymbolSize?.value, 80),
      shape: newShape?.value || "rect",
      marker_type: markerType,
      category: markerType,
      lv95_e: e,
      lv95_n: n,
      description: newDescription?.value || ""
    };

    state.markers.push(marker);
    created.push(marker);
  }

  if (created.length > 0) {
    state.selectedId = created[0].id;
  }

  rebuildMarkers();
  autosaveMarkers();
  setStatus(`${created.length} Serienmarker erstellt.`);
  closeModal(seriesModal);
}

function applyChanges() {
  const marker = getSelectedMarker();
  if (!marker) return;

  marker.text = editText.value || marker.text;
  marker.color = editColor.value || marker.color;
  marker.shape = editShape?.value || marker.shape || "rect";
  marker.font_size = safeNumber(editFontSize.value, marker.font_size);
  marker.circle_size = safeNumber(editSymbolSize?.value, marker.circle_size || 80);
  marker.symbol_size = marker.circle_size;
  marker.rect_w = safeNumber(editWidth.value, marker.rect_w);
  marker.rect_h = safeNumber(editHeight.value, marker.rect_h);
  marker.lv95_e = safeNumber(editEasting.value, marker.lv95_e);
  marker.lv95_n = safeNumber(editNorthing.value, marker.lv95_n);
  marker.description = editDescription.value || "";

  rebuildMarkers();
  autosaveMarkers();

  const [x3857, y3857] = lv95To3857(marker.lv95_e, marker.lv95_n);
  const ll = L.CRS.EPSG3857.unproject(L.point(x3857, y3857));
  state.map.panTo(ll);

  setStatus(`Marker „${marker.text}“ aktualisiert.`);
  closeModal(editModal);
}

function deleteSelectedMarker() {
  const marker = getSelectedMarker();
  if (!marker) return;

  state.markers = state.markers.filter((m) => m.id !== marker.id);
  state.selectedId = null;
  rebuildMarkers();
  autosaveMarkers();
  setStatus("Marker gelöscht.");
  closeModal(editModal);
}

function clearMarkers() {
  const confirmed = window.confirm("Wirklich alle Marker löschen?");
  if (!confirmed) return;

  state.markers = [];
  state.selectedId = null;
  rebuildMarkers();
  autosaveMarkers();
  setStatus("Alle Marker gelöscht.");
  closeModal(backupModal);
}

function toggleCreateMode() {
  state.createMode = !state.createMode;
  if (state.createMode && state.moveMode) state.moveMode = false;

  setStatus(state.createMode ? "Marker-Modus aktiv." : "Marker-Modus aus.");
  rebuildMarkers();
}

function toggleMoveMode() {
  state.moveMode = !state.moveMode;
  if (state.moveMode && state.createMode) state.createMode = false;

  setStatus(state.moveMode ? "Bewegungsmodus aktiv." : "Bewegungsmodus aus.");
  rebuildMarkers();
}

function setupMap() {
  state.map = L.map("map", {
    zoomControl: false,
    markerZoomAnimation: false
  }).setView([47.404, 8.36], 13);

  L.tileLayer(
    "https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg",
    {
      minZoom: 0,
      maxZoom: 18,
      attribution: "swisstopo",
      updateWhenZooming: false,
      updateWhenIdle: true
    }
  ).addTo(state.map);

  state.map.on("click", (event) => {
    if (state.createMode) {
      createMarkerAtLatLng(event.latlng);
      return;
    }

    state.selectedId = null;
    rebuildMarkers();
  });
}

async function locateUser() {
  if (!navigator.geolocation) {
    setStatus("Standortbestimmung wird von diesem Browser nicht unterstützt.");
    return;
  }

  setStatus("Standort wird ermittelt ...");

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      const latLng = L.latLng(latitude, longitude);

      if (state.gpsMarker) state.map.removeLayer(state.gpsMarker);
      if (state.gpsAccuracyCircle) state.map.removeLayer(state.gpsAccuracyCircle);

      state.gpsMarker = L.circleMarker(latLng, {
        radius: 7,
        color: "#0057ff",
        weight: 2,
        fillColor: "#4da3ff",
        fillOpacity: 0.9
      }).addTo(state.map);

      state.gpsAccuracyCircle = L.circle(latLng, {
        radius: accuracy,
        color: "#4da3ff",
        weight: 1,
        fillColor: "#4da3ff",
        fillOpacity: 0.15
      }).addTo(state.map);

      state.map.setView(latLng, 17);
      setStatus(`Standort gefunden (Genauigkeit ca. ${Math.round(accuracy)} m).`);
    },
    (error) => {
      console.error(error);
      if (error.code === 1) {
        setStatus("Standortzugriff wurde abgelehnt.");
      } else if (error.code === 2) {
        setStatus("Standort konnte nicht ermittelt werden.");
      } else if (error.code === 3) {
        setStatus("Standortabfrage hat zu lange gedauert.");
      } else {
        setStatus("Standortbestimmung fehlgeschlagen.");
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

function loadTileImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Tile konnte nicht geladen werden: ${url}`));
    img.src = url;
  });
}

function markerInArea(marker, area) {
  const [e1, n1] = area.topLeft;
  const [e2, n2] = area.bottomRight;

  const minE = Math.min(e1, e2);
  const maxE = Math.max(e1, e2);
  const minN = Math.min(n1, n2);
  const maxN = Math.max(n1, n2);

  return (
    marker.lv95_e >= minE &&
    marker.lv95_e <= maxE &&
    marker.lv95_n >= minN &&
    marker.lv95_n <= maxN
  );
}

async function buildAreaCanvas(areaName) {
  const area = EXPORT_AREAS[areaName];
  if (!area) throw new Error("Unbekannter Exportbereich.");

  const [e1, n1] = area.topLeft;
  const [e2, n2] = area.bottomRight;

  const minE = Math.min(e1, e2);
  const maxE = Math.max(e1, e2);
  const minN = Math.min(n1, n2);
  const maxN = Math.max(n1, n2);

  const [minX, minY] = lv95To3857(minE, minN);
  const [maxX, maxY] = lv95To3857(maxE, maxN);

  const zoom = chooseExportZoom(minX, minY, maxX, maxY, 4000, 3000, 1);

  const [px1, py1] = mercatorToPixel(minX, maxY, zoom);
  const [px2, py2] = mercatorToPixel(maxX, minY, zoom);

  const left = Math.min(px1, px2);
  const right = Math.max(px1, px2);
  const top = Math.min(py1, py2);
  const bottom = Math.max(py1, py2);

  const tileXMin = Math.floor(left / TILE_SIZE);
  const tileXMax = Math.floor((right - 1) / TILE_SIZE);
  const tileYMin = Math.floor(top / TILE_SIZE);
  const tileYMax = Math.floor((bottom - 1) / TILE_SIZE);

  const stitchedCanvas = document.createElement("canvas");
  stitchedCanvas.width = (tileXMax - tileXMin + 1) * TILE_SIZE;
  stitchedCanvas.height = (tileYMax - tileYMin + 1) * TILE_SIZE;
  const stitchedCtx = stitchedCanvas.getContext("2d");

  for (let tx = tileXMin; tx <= tileXMax; tx++) {
    for (let ty = tileYMin; ty <= tileYMax; ty++) {
      const url = `https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/${zoom}/${tx}/${ty}.jpeg`;
      const img = await loadTileImage(url);
      stitchedCtx.drawImage(
        img,
        (tx - tileXMin) * TILE_SIZE,
        (ty - tileYMin) * TILE_SIZE,
        TILE_SIZE,
        TILE_SIZE
      );
    }
  }

  const cropLeft = Math.round(left - tileXMin * TILE_SIZE);
  const cropTop = Math.round(top - tileYMin * TILE_SIZE);
  const cropWidth = Math.round(right - left);
  const cropHeight = Math.round(bottom - top);

  const cropCanvas = document.createElement("canvas");
  cropCanvas.width = cropWidth;
  cropCanvas.height = cropHeight;
  const cropCtx = cropCanvas.getContext("2d");

  cropCtx.drawImage(
    stitchedCanvas,
    cropLeft, cropTop, cropWidth, cropHeight,
    0, 0, cropWidth, cropHeight
  );

  return { canvas: cropCanvas };
}

function drawMarkersOnExportCanvas(canvas, areaName) {
  const area = EXPORT_AREAS[areaName];
  const [e1, n1] = area.topLeft;
  const [e2, n2] = area.bottomRight;

  const minE = Math.min(e1, e2);
  const maxE = Math.max(e1, e2);
  const minN = Math.min(n1, n2);
  const maxN = Math.max(n1, n2);

  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;

  const eRange = maxE - minE;
  const nRange = maxN - minN;

  for (const marker of state.markers) {
    if (!markerInArea(marker, area)) continue;

    const x = ((marker.lv95_e - minE) / eRange) * width;
    const y = ((maxN - marker.lv95_n) / nRange) * height;

    const rectW = Math.max(20, Math.round(marker.rect_w || 50));
    const rectH = Math.max(20, Math.round(marker.rect_h || 25));
    const shaftW = 7;
    const shaftH = 20;

    const left = x - rectW / 2;
    const top = y - shaftH - rectH;

    ctx.fillStyle = marker.color || "#ff0000";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;

    ctx.fillRect(left, top, rectW, rectH);
    ctx.strokeRect(left, top, rectW, rectH);

    ctx.fillRect(x - shaftW / 2, y - shaftH, shaftW, shaftH);
    ctx.strokeRect(x - shaftW / 2, y - shaftH, shaftW, shaftH);

    ctx.fillStyle = "#000000";
    ctx.font = `700 ${Math.max(6, Number(marker.font_size) || 18)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(marker.text || "", x, top + rectH / 2);
  }
}

async function exportPdf() {
  try {
    const areaName = exportAreaEl?.value;
    if (!areaName || !EXPORT_AREAS[areaName]) {
      setStatus("Kein gültiger Exportbereich ausgewählt.");
      return;
    }

    if (!window.jspdf || !window.jspdf.jsPDF) {
      setStatus("PDF-Bibliothek nicht geladen.");
      return;
    }

    setStatus(`PDF wird erstellt: ${areaName} ...`);

    const { jsPDF } = window.jspdf;
    const { canvas } = await buildAreaCanvas(areaName);
    drawMarkersOnExportCanvas(canvas, areaName);

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a4"
    });

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(areaName, pageW / 2, 28, { align: "center" });

    const marginX = 36;
    const topBand = 50;
    const bottomBand = 36;
    const usableW = pageW - marginX * 2;
    const usableH = pageH - topBand - bottomBand;

    const imgW = canvas.width;
    const imgH = canvas.height;
    const scale = Math.min(usableW / imgW, usableH / imgH);

    const drawW = imgW * scale;
    const drawH = imgH * scale;
    const drawX = (pageW - drawW) / 2;
    const drawY = bottomBand + (usableH - drawH) / 2;

    doc.addImage(canvas.toDataURL("image/png"), "PNG", drawX, drawY, drawW, drawH);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(new Date().toLocaleDateString("de-CH"), pageW / 2, pageH - 14, { align: "center" });

    doc.save(`${areaName}.pdf`);
    setStatus(`PDF exportiert: ${areaName}`);
    closeModal(pdfModal);
  } catch (error) {
    console.error(error);
    setStatus("PDF-Export fehlgeschlagen.");
  }
}

function populateExportAreas() {
  if (!exportAreaEl) return;

  const current = exportAreaEl.value;
  exportAreaEl.innerHTML = "";

  for (const areaName of Object.keys(EXPORT_AREAS)) {
    const option = document.createElement("option");
    option.value = areaName;
    option.textContent = areaName;
    exportAreaEl.appendChild(option);
  }

  if (current && EXPORT_AREAS[current]) {
    exportAreaEl.value = current;
  }
}

if (menuBtn) menuBtn.addEventListener("click", () => openModal(settingsModal));
if (floatingCreateBtn) floatingCreateBtn.addEventListener("click", toggleCreateMode);
if (floatingMoveBtn) floatingMoveBtn.addEventListener("click", toggleMoveMode);
if (floatingPdfBtn) floatingPdfBtn.addEventListener("click", () => openModal(pdfModal));
if (floatingSeriesBtn) floatingSeriesBtn.addEventListener("click", () => openModal(seriesModal));
if (floatingBackupBtn) floatingBackupBtn.addEventListener("click", () => openModal(backupModal));
if (floatingListBtn) floatingListBtn.addEventListener("click", () => openModal(listModal));
if (floatingGpsBtn) floatingGpsBtn.addEventListener("click", locateUser);

if (closeSettingsModalBtn) closeSettingsModalBtn.addEventListener("click", () => closeModal(settingsModal));
if (closeSeriesModalBtn) closeSeriesModalBtn.addEventListener("click", () => closeModal(seriesModal));
if (closeBackupModalBtn) closeBackupModalBtn.addEventListener("click", () => closeModal(backupModal));
if (closeListModalBtn) closeListModalBtn.addEventListener("click", () => closeModal(listModal));
if (closePdfModalBtn) closePdfModalBtn.addEventListener("click", () => closeModal(pdfModal));
if (closeEditModalBtn) closeEditModalBtn.addEventListener("click", () => closeModal(editModal));

document.querySelectorAll(".modal").forEach((modal) => {
  modal.addEventListener("click", (event) => {
    if (event.target.classList.contains("modal-backdrop")) {
      closeModal(modal);
    }
  });
});

if (createSeriesBtn) createSeriesBtn.addEventListener("click", createSeriesMarkers);
if (loadBtn) loadBtn.addEventListener("click", loadMarkers);
if (saveBtn) saveBtn.addEventListener("click", saveMarkers);
if (clearBtn) clearBtn.addEventListener("click", clearMarkers);
if (applyBtn) applyBtn.addEventListener("click", applyChanges);
if (deleteBtn) deleteBtn.addEventListener("click", deleteSelectedMarker);
if (markerFilterEl) markerFilterEl.addEventListener("input", renderMarkerList);
if (exportPdfBtn) exportPdfBtn.addEventListener("click", exportPdf);

if (exportJsonBtn) exportJsonBtn.addEventListener("click", exportJsonBackup);

if (importJsonBtn && importJsonInput) {
  importJsonBtn.addEventListener("click", () => importJsonInput.click());
  importJsonInput.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (file) importJsonBackup(file);
    event.target.value = "";
  });
}

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (installBtn) installBtn.classList.remove("hidden");
});

if (installBtn) {
  installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installBtn.classList.add("hidden");
  });
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.error("Service Worker konnte nicht registriert werden:", error);
    });
  });
}

populateExportAreas();
setupMap();
loadMarkers();
updateFloatingButtons();
