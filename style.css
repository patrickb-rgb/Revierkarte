:root {
  --bg: #f5f6f8;
  --panel: #ffffff;
  --border: #d8dde6;
  --text: #1b1f24;
  --muted: #67707c;
  --accent: #1f6feb;
  --danger: #c62828;
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: Arial, Helvetica, sans-serif;
  color: var(--text);
  background: var(--bg);
}

body {
  height: 100vh;
  overflow: hidden;
}

.hidden {
  display: none !important;
}

.map-container {
  position: relative;
  width: 100vw;
  height: 100vh;
}

#map {
  width: 100%;
  height: 100%;
}

.floating-ui {
  position: fixed;
  top: 10px;
  left: 10px;
  z-index: 3000;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.floating-btn {
  width: 46px;
  height: 46px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.94);
  color: var(--text);
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.floating-btn.active {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

.status-badge {
  position: fixed;
  top: 10px;
  left: 72px;
  right: 10px;
  min-height: 46px;
  z-index: 2990;
  display: flex;
  align-items: center;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.94);
  color: var(--muted);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.14);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  font-size: 13px;
  line-height: 1.3;
}

.source-note {
  position: absolute;
  right: 10px;
  bottom: 10px;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 5px 8px;
  font-size: 11px;
  color: var(--muted);
}

.modal {
  position: fixed;
  inset: 0;
  z-index: 5000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
}

.modal-card {
  position: relative;
  z-index: 1;
  width: min(92vw, 440px);
  max-height: 88vh;
  overflow-y: auto;
  background: white;
  border-radius: 18px;
  border: 1px solid var(--border);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.25);
  padding: 14px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.modal-header h2 {
  margin: 0;
  font-size: 18px;
}

.modal-close {
  width: 40px;
  height: 40px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: white;
  font-size: 18px;
  padding: 0;
  flex: 0 0 auto;
}

label {
  display: block;
  margin: 8px 0 4px;
  font-size: 12px;
  color: var(--muted);
}

input,
textarea,
button,
select {
  width: 100%;
  font: inherit;
}

input,
textarea,
select {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 12px;
  background: white;
  font-size: 14px;
  color: var(--text);
}

textarea {
  resize: vertical;
}

button {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 12px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  color: var(--text);
}

button.primary {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

button.danger {
  border-color: #efc4c4;
  color: var(--danger);
  background: #fff6f6;
}

.button-grid {
  display: grid;
  gap: 8px;
}

.row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.marker-list {
  max-height: 240px;
  overflow-y: auto;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: white;
  margin-top: 8px;
}

.marker-item {
  padding: 8px 10px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  font-size: 14px;
}

.marker-item:last-child {
  border-bottom: none;
}

.marker-item.active {
  background: #d0e4ff;
  font-weight: 700;
}

.marker-icon-wrapper {
  background: transparent !important;
  border: none !important;
}

.marker-icon-wrapper svg {
  display: block;
  overflow: visible;
}

.leaflet-control-zoom {
  display: none !important;
}

@media (max-width: 600px) {
  .floating-ui {
    top: 8px;
    left: 8px;
    gap: 6px;
  }

  .floating-btn {
    width: 42px;
    height: 42px;
    font-size: 16px;
  }

  .status-badge {
    top: 8px;
    left: 64px;
    right: 8px;
    min-height: 42px;
    font-size: 12px;
    padding: 0 12px;
  }

  .source-note {
    right: 8px;
    bottom: 8px;
    font-size: 10px;
    padding: 4px 7px;
  }

  .modal-card {
    width: min(96vw, 520px);
    max-height: 90vh;
    padding: 12px;
    border-radius: 16px;
  }

  .modal-header h2 {
    font-size: 16px;
  }

  input,
  textarea,
  select,
  button {
    font-size: 13px;
  }

  .row-2 {
    gap: 6px;
  }

  .marker-list {
    max-height: 180px;
  }
}