const windowLayer = document.getElementById("windowLayer");
const windowTemplate = document.getElementById("windowTemplate");
const taskbarApps = document.getElementById("taskbarApps");
const startMenu = document.getElementById("startMenu");
const startButton = document.getElementById("startButton");
const clock = document.getElementById("clock");
const desktop = document.getElementById("desktop");

const windows = new Map();
let z = 20;

const settingsCatalog = [
  { key: "theme", label: "Theme", type: "select", options: ["dark", "light", "aqua", "midnight"], default: "dark" },
  { key: "accent", label: "Accent Color", type: "color", default: "#4ea1ff" },
  { key: "blur", label: "Window Blur", type: "range", min: 0, max: 24, default: 12 },
  { key: "windowOpacity", label: "Window Opacity", type: "range", min: 55, max: 100, default: 88 },
  { key: "iconScale", label: "Desktop Icon Scale", type: "range", min: 80, max: 140, default: 100 },
  { key: "taskbarHeight", label: "Taskbar Height", type: "range", min: 46, max: 74, default: 56 },
  { key: "taskbarOpacity", label: "Taskbar Opacity", type: "range", min: 55, max: 100, default: 84 },
  { key: "showSeconds", label: "Clock Seconds", type: "checkbox", default: false },
  { key: "use24Hour", label: "24-Hour Clock", type: "checkbox", default: false },
  { key: "wallpaperHue", label: "Wallpaper Hue", type: "range", min: 0, max: 360, default: 0 },
  { key: "wallpaperSat", label: "Wallpaper Saturation", type: "range", min: 50, max: 150, default: 100 },
  { key: "wallpaperBright", label: "Wallpaper Brightness", type: "range", min: 60, max: 140, default: 100 },
  { key: "overlayOpacity", label: "Overlay Opacity", type: "range", min: 0, max: 100, default: 100 },
  { key: "overlayAngle", label: "Overlay Angle", type: "range", min: 0, max: 360, default: 120 },
  { key: "windowRadius", label: "Window Radius", type: "range", min: 0, max: 18, default: 12 },
  { key: "windowBorder", label: "Window Border Width", type: "range", min: 0, max: 3, default: 1 },
  { key: "windowShadow", label: "Window Shadow Strength", type: "range", min: 0, max: 80, default: 45 },
  { key: "fontSize", label: "UI Font Size", type: "range", min: 13, max: 20, default: 16 },
  { key: "fontFamily", label: "UI Font", type: "select", options: ["Segoe UI", "Inter", "Roboto", "Arial", "Calibri"], default: "Segoe UI" },
  { key: "compactMode", label: "Compact Mode", type: "checkbox", default: false },
  { key: "startMenuWidth", label: "Start Menu Width", type: "range", min: 420, max: 760, default: 620 },
  { key: "taskbarAlign", label: "Taskbar Alignment", type: "select", options: ["center", "start"], default: "center" },
  { key: "highContrast", label: "High Contrast", type: "checkbox", default: false },
  { key: "reduceMotion", label: "Reduce Motion", type: "checkbox", default: false },
  { key: "glassEffect", label: "Glass Effect", type: "checkbox", default: true },
  { key: "focusRing", label: "Focus Ring", type: "checkbox", default: true },
  { key: "widgetClock", label: "Widget: Clock", type: "checkbox", default: true },
  { key: "widgetNotes", label: "Widget: Notes", type: "checkbox", default: true },
  { key: "widgetWeather", label: "Widget: Weather", type: "checkbox", default: false },
  { key: "widgetCalendar", label: "Widget: Calendar", type: "checkbox", default: false },
  { key: "widgetSystem", label: "Widget: System Status", type: "checkbox", default: false },
  { key: "browserHome", label: "Browser Home", type: "select", options: ["https://example.com", "https://developer.mozilla.org", "https://www.wikipedia.org"], default: "https://example.com" },
  { key: "openExplorerOnBoot", label: "Open Explorer on Boot", type: "checkbox", default: true },
  { key: "openDocsOnBoot", label: "Open Docs on Boot", type: "checkbox", default: true },
  { key: "openBrowserOnBoot", label: "Open Browser on Boot", type: "checkbox", default: true },
  { key: "autoSaveDocs", label: "Docs Auto-Save", type: "checkbox", default: true },
  { key: "showWordCount", label: "Docs Word Count", type: "checkbox", default: true },
  { key: "showLineCount", label: "Docs Line Count", type: "checkbox", default: true },
  { key: "docsWideMode", label: "Docs Wide Editor", type: "checkbox", default: true },
  { key: "explorerPreviewLarge", label: "Files Large Preview", type: "checkbox", default: true },
  { key: "explorerListDense", label: "Files Dense List", type: "checkbox", default: false },
  { key: "calcScientific", label: "Calculator Scientific", type: "checkbox", default: true },
  { key: "soundEffects", label: "UI Sound Effects", type: "checkbox", default: false },
  { key: "notifications", label: "Desktop Notifications", type: "checkbox", default: true },
  { key: "startupTip", label: "Show Startup Tip", type: "checkbox", default: true },
  { key: "edgeGlow", label: "Window Edge Glow", type: "checkbox", default: false },
  { key: "titleUppercase", label: "Uppercase Window Titles", type: "checkbox", default: false },
  { key: "showDesktopWidgets", label: "Show Desktop Widgets", type: "checkbox", default: true },
  { key: "smoothScroll", label: "Smooth Scroll", type: "checkbox", default: true },
  { key: "browserSuggestions", label: "Browser Quick Suggestions", type: "checkbox", default: true },
];

const settingsDefaults = Object.fromEntries(settingsCatalog.map((s) => [s.key, s.default]));
const settingsState = loadState("workspaceSettings", settingsDefaults);

const docDefaults = {
  docs: [{ id: crypto.randomUUID(), title: "Welcome Document", content: "<h1>Welcome</h1><p>This is your professional Docs workspace.</p>", updatedAt: Date.now(), versions: [] }],
  currentId: null,
};
const docsState = loadState("workspaceDocs", docDefaults);
if (!docsState.currentId && docsState.docs[0]) docsState.currentId = docsState.docs[0].id;

const sessionFiles = [];

const docsToolbar = [
  { group: "File", tools: ["newDoc", "saveDoc", "deleteDoc", "exportHtml", "printDoc", "restoreVersion"] },
  { group: "Edit", tools: ["undo", "redo", "find", "replace", "clearFormat"] },
  { group: "Format", tools: ["bold", "italic", "underline", "strikeThrough", "h1", "h2", "paragraph", "fontName", "fontSize", "foreColor", "hiliteColor"] },
  { group: "Insert", tools: ["link", "image", "table", "checklist", "quote", "divider", "date", "time"] },
  { group: "Layout", tools: ["alignLeft", "alignCenter", "alignRight", "justify", "ul", "ol", "indent", "outdent"] },
];
const toolLabels = {
  newDoc: "New", saveDoc: "Save", deleteDoc: "Delete", exportHtml: "Export", printDoc: "Print", restoreVersion: "History",
  undo: "Undo", redo: "Redo", find: "Find", replace: "Replace", clearFormat: "Clear",
  bold: "Bold", italic: "Italic", underline: "Underline", strikeThrough: "Strike", h1: "H1", h2: "H2", paragraph: "P", fontName: "Font", fontSize: "Size", foreColor: "Text", hiliteColor: "Highlight",
  link: "Link", image: "Image", table: "Table", checklist: "Checklist", quote: "Quote", divider: "Divider", date: "Date", time: "Time",
  alignLeft: "Left", alignCenter: "Center", alignRight: "Right", justify: "Justify", ul: "Bullets", ol: "Numbers", indent: "Indent", outdent: "Outdent",
};

const appDefinitions = {
  explorer: {
    title: "Files & Media",
    content: `<section class="explorer-pro"><div class="files-toolbar"><label class="upload-btn">Upload Files<input id="fileInput" type="file" multiple hidden /></label><button id="clearFiles">Clear Session Files</button></div><div class="files-layout"><aside><h4>My Files</h4><div id="fileList" class="file-list"></div></aside><main><h4>Preview</h4><div id="filePreview" class="file-preview">Select a file to preview it.</div></main></div></section>`,
    onMount: mountExplorer,
  },
  docs: {
    title: "Google Docs Style Studio",
    content: `<section class="docs-pro"><div class="docs-home" id="docsHome"></div><div class="docs-editor hidden" id="docsEditor"><div class="docs-header"><button id="backToHome">← Home</button><input id="docTitle" class="doc-title" /><button id="saveDoc">Save</button><span id="docMeta" class="doc-meta"></span></div><div id="toolGroups" class="tool-groups"></div><div id="docSurface" class="doc-surface" contenteditable="true"></div></div></section>`,
    onMount: mountDocs,
  },
  browser: {
    title: "Browser Pro",
    content: `<section class="browser-panel"><div class="browser-controls browser-pro-controls"><button class="back">←</button><button class="forward">→</button><button class="reload">↻</button><button class="home">⌂</button><input type="text" class="url" aria-label="URL or search" /><button class="go">Go</button><button class="new-tab">+ Tab</button></div><div class="browser-sub"><div id="tabStrip" class="tab-strip"></div><div id="quickLinks" class="quick-links"></div></div><iframe title="In-app browser"></iframe></section>`,
    onMount: mountBrowser,
  },
  settings: {
    title: "Settings Center",
    content: `<section class="settings"><h3>Real System Settings (50 Working)</h3><div id="settingsGrid" class="settings-grid"></div></section>`,
    onMount: mountSettings,
  },
  terminal: { title: "Terminal", content: `<section class="terminal"><h3>PowerShell</h3><pre>PS C:\\Users\\Admin> status\nDesktop online\nDocs synced locally\nFiles viewer ready</pre></section>` },
  calculator: {
    title: "Calculator X",
    content: `<section class="calc"><input class="calc-display" readonly value="0" /><div class="calc-grid"><button>C</button><button>(</button><button>)</button><button>/</button><button>7</button><button>8</button><button>9</button><button>*</button><button>4</button><button>5</button><button>6</button><button>-</button><button>1</button><button>2</button><button>3</button><button>+</button><button>0</button><button>.</button><button>=</button><button>%</button></div></section>`,
    onMount: (root) => {
      const d = root.querySelector(".calc-display");
      root.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
        const v = b.textContent;
        if (v === "C") d.value = "0";
        else if (v === "=") { try { d.value = String(Function(`return (${d.value})`)()); } catch { d.value = "Error"; } }
        else d.value = d.value === "0" || d.value === "Error" ? v : d.value + v;
      }));
    },
  },
};

function loadState(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "null");
    return parsed ? { ...fallback, ...parsed } : structuredClone(fallback);
  } catch {
    return structuredClone(fallback);
  }
}
function saveState(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function getCurrentDoc() { return docsState.docs.find((d) => d.id === docsState.currentId) || docsState.docs[0]; }

function updateClock() {
  const now = new Date();
  clock.textContent = now.toLocaleTimeString([], settingsState.showSeconds
    ? { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: !settingsState.use24Hour }
    : { hour: "2-digit", minute: "2-digit", hour12: !settingsState.use24Hour });
}
setInterval(updateClock, 1000);

function applySetting(key, value) {
  settingsState[key] = value;
  saveState("workspaceSettings", settingsState);
  const s = document.body.style;
  switch (key) {
    case "theme": document.body.dataset.theme = value; break;
    case "accent": s.setProperty("--accent", value); break;
    case "blur": s.setProperty("--blur", `${value}px`); break;
    case "windowOpacity": s.setProperty("--window-opacity", value / 100); break;
    case "iconScale": s.setProperty("--icon-scale", value / 100); break;
    case "taskbarHeight": s.setProperty("--taskbar-height", `${value}px`); break;
    case "taskbarOpacity": s.setProperty("--taskbar-opacity", value / 100); break;
    case "wallpaperHue": s.setProperty("--wallpaper-hue", `${value}deg`); break;
    case "wallpaperSat": s.setProperty("--wallpaper-sat", `${value}%`); break;
    case "wallpaperBright": s.setProperty("--wallpaper-bright", `${value}%`); break;
    case "overlayOpacity": s.setProperty("--overlay-opacity", value / 100); break;
    case "overlayAngle": s.setProperty("--overlay-angle", `${value}deg`); break;
    case "windowRadius": s.setProperty("--window-radius", `${value}px`); break;
    case "windowBorder": s.setProperty("--window-border", `${value}px`); break;
    case "windowShadow": s.setProperty("--window-shadow", `${value}`); break;
    case "fontSize": s.setProperty("--ui-font-size", `${value}px`); break;
    case "fontFamily": s.setProperty("--ui-font-family", value); break;
    case "compactMode": document.body.classList.toggle("compact-mode", value); break;
    case "startMenuWidth": s.setProperty("--start-width", `${value}px`); break;
    case "taskbarAlign": document.querySelector(".taskbar").style.justifyContent = value === "start" ? "flex-start" : "center"; break;
    case "highContrast": document.body.classList.toggle("high-contrast", value); break;
    case "reduceMotion": document.body.classList.toggle("reduce-motion", value); break;
    case "glassEffect": document.body.classList.toggle("no-glass", !value); break;
    case "focusRing": document.body.classList.toggle("no-focus-ring", !value); break;
    case "docsWideMode": document.body.classList.toggle("docs-narrow", !value); break;
    case "explorerPreviewLarge": document.body.classList.toggle("files-small-preview", !value); break;
    case "explorerListDense": document.body.classList.toggle("files-dense", value); break;
    case "calcScientific": document.body.classList.toggle("calc-basic", !value); break;
    case "edgeGlow": document.body.classList.toggle("edge-glow", value); break;
    case "titleUppercase": document.body.classList.toggle("title-uppercase", value); break;
    case "smoothScroll": document.documentElement.style.scrollBehavior = value ? "smooth" : "auto"; break;
    default: break;
  }
  if (["showSeconds", "use24Hour", "widgetClock", "widgetNotes", "widgetWeather", "widgetCalendar", "widgetSystem", "showDesktopWidgets", "notifications", "startupTip"].includes(key)) {
    renderWidgets();
    updateClock();
  }
}

function applyAllSettings() { settingsCatalog.forEach((opt) => applySetting(opt.key, settingsState[opt.key] ?? opt.default)); }

function renderWidgets() {
  let panel = document.getElementById("widgetPanel");
  if (!panel) {
    panel = document.createElement("aside");
    panel.id = "widgetPanel";
    panel.className = "widget-panel";
    desktop.appendChild(panel);
  }
  panel.classList.toggle("hidden", !settingsState.showDesktopWidgets);

  const cards = [];
  if (settingsState.widgetClock) cards.push(`<div class="widget"><h4>Clock</h4><p>${new Date().toLocaleString()}</p></div>`);
  if (settingsState.widgetCalendar) cards.push(`<div class="widget"><h4>Calendar</h4><p>${new Date().toDateString()}</p></div>`);
  if (settingsState.widgetWeather) cards.push(`<div class="widget"><h4>Weather</h4><p>Cloudy 22°C • Workspace City</p></div>`);
  if (settingsState.widgetSystem) cards.push(`<div class="widget"><h4>System</h4><p>CPU: 24% | RAM: 58% | Network: Stable</p></div>`);
  if (settingsState.widgetNotes) cards.push(`<div class="widget"><h4>Quick Notes</h4><textarea id="quickNote">${localStorage.getItem("quickNote") || "Write quick notes..."}</textarea></div>`);
  panel.innerHTML = cards.join("");

  const note = panel.querySelector("#quickNote");
  if (note) note.addEventListener("input", () => localStorage.setItem("quickNote", note.value));
}

function mountSettings(root) {
  const grid = root.querySelector("#settingsGrid");
  settingsCatalog.forEach((item) => {
    const row = document.createElement("label");
    row.className = "setting-row";
    row.innerHTML = `<span>${item.label}</span>`;
    let input;

    if (item.type === "select") {
      input = document.createElement("select");
      item.options.forEach((opt) => {
        const o = document.createElement("option");
        o.value = opt;
        o.textContent = opt;
        input.appendChild(o);
      });
      input.value = settingsState[item.key] ?? item.default;
      input.addEventListener("change", () => applySetting(item.key, input.value));
    } else if (item.type === "color") {
      input = document.createElement("input");
      input.type = "color";
      input.value = settingsState[item.key] ?? item.default;
      input.addEventListener("input", () => applySetting(item.key, input.value));
    } else if (item.type === "range") {
      input = document.createElement("input");
      input.type = "range";
      input.min = item.min;
      input.max = item.max;
      input.value = settingsState[item.key] ?? item.default;
      const val = document.createElement("small");
      val.textContent = input.value;
      input.addEventListener("input", () => {
        val.textContent = input.value;
        applySetting(item.key, Number(input.value));
      });
      row.appendChild(val);
    } else {
      input = document.createElement("input");
      input.type = "checkbox";
      input.checked = !!(settingsState[item.key] ?? item.default);
      input.addEventListener("change", () => applySetting(item.key, input.checked));
    }

    row.appendChild(input);
    grid.appendChild(row);
  });
}

function mountExplorer(root) {
  const input = root.querySelector("#fileInput");
  const list = root.querySelector("#fileList");
  const preview = root.querySelector("#filePreview");
  const clear = root.querySelector("#clearFiles");

  const renderList = () => {
    list.innerHTML = "";
    if (!sessionFiles.length) return (list.innerHTML = "<p>No uploaded files yet.</p>");
    sessionFiles.forEach((file, idx) => {
      const b = document.createElement("button");
      b.className = "file-item";
      b.textContent = `${file.name} (${Math.ceil(file.size / 1024)} KB)`;
      b.addEventListener("click", () => previewFile(idx));
      list.appendChild(b);
    });
  };

  const previewFile = (idx) => {
    const file = sessionFiles[idx];
    const url = URL.createObjectURL(file);
    if (file.type.startsWith("image/")) preview.innerHTML = `<img src="${url}" alt="${file.name}" />`;
    else if (file.type === "application/pdf") preview.innerHTML = `<embed src="${url}" type="application/pdf" width="100%" height="420" />`;
    else if (file.type.startsWith("video/")) preview.innerHTML = `<video src="${url}" controls width="100%"></video>`;
    else if (file.type.startsWith("audio/")) preview.innerHTML = `<audio src="${url}" controls></audio>`;
    else if (file.type.startsWith("text/")) file.text().then((t) => { preview.textContent = t.slice(0, 8000); });
    else preview.innerHTML = `<p>Cannot preview this file type here, but file is uploaded: ${file.name}</p>`;
  };

  input.addEventListener("change", () => {
    sessionFiles.push(...Array.from(input.files));
    renderList();
  });
  clear.addEventListener("click", () => {
    sessionFiles.length = 0;
    renderList();
    preview.textContent = "Select a file to preview it.";
  });
  renderList();
}

function mountDocs(root) {
  const home = root.querySelector("#docsHome");
  const editor = root.querySelector("#docsEditor");
  const surface = root.querySelector("#docSurface");
  const titleInput = root.querySelector("#docTitle");
  const meta = root.querySelector("#docMeta");
  const groups = root.querySelector("#toolGroups");
  const saveBtn = root.querySelector("#saveDoc");
  const backBtn = root.querySelector("#backToHome");

  const persistCurrent = () => {
    const current = getCurrentDoc();
    if (!current) return;
    current.title = titleInput.value.trim() || "Untitled";
    current.content = surface.innerHTML;
    current.updatedAt = Date.now();
    current.versions = current.versions || [];
    current.versions.push({ content: current.content, title: current.title, at: current.updatedAt });
    if (current.versions.length > 20) current.versions.shift();
    saveState("workspaceDocs", docsState);
    renderHome();
    updateMeta();
  };

  const openDoc = (id) => {
    docsState.currentId = id;
    saveState("workspaceDocs", docsState);
    const doc = getCurrentDoc();
    titleInput.value = doc.title;
    surface.innerHTML = doc.content;
    home.classList.add("hidden");
    editor.classList.remove("hidden");
    updateMeta();
  };

  const renderHome = () => {
    home.innerHTML = `<div class="docs-home-header"><h3>Documents Home</h3><button id="createDoc">+ New Document</button></div><div class="docs-cards">${docsState.docs.map((d) => `<article class="doc-card"><h4>${d.title}</h4><p>Updated ${new Date(d.updatedAt).toLocaleString()}</p><div><button data-open="${d.id}">Open</button><button data-delete="${d.id}">Delete</button></div></article>`).join("")}</div>`;
    home.querySelector("#createDoc").addEventListener("click", () => {
      const doc = { id: crypto.randomUUID(), title: `Untitled ${docsState.docs.length + 1}`, content: "<p>Start typing...</p>", updatedAt: Date.now(), versions: [] };
      docsState.docs.unshift(doc);
      docsState.currentId = doc.id;
      saveState("workspaceDocs", docsState);
      renderHome();
      openDoc(doc.id);
    });
    home.querySelectorAll("[data-open]").forEach((b) => b.addEventListener("click", () => openDoc(b.dataset.open)));
    home.querySelectorAll("[data-delete]").forEach((b) => b.addEventListener("click", () => {
      docsState.docs = docsState.docs.filter((d) => d.id !== b.dataset.delete);
      if (!docsState.docs.length) docsState.docs.push({ id: crypto.randomUUID(), title: "New Document", content: "<p>Start typing...</p>", updatedAt: Date.now(), versions: [] });
      docsState.currentId = docsState.docs[0].id;
      saveState("workspaceDocs", docsState);
      renderHome();
    }));
  };

  const updateMeta = () => {
    const text = surface.innerText || "";
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lines = text ? text.split(/\n/).length : 0;
    const parts = [];
    if (settingsState.showWordCount) parts.push(`Words: ${words}`);
    parts.push(`Chars: ${text.length}`);
    if (settingsState.showLineCount) parts.push(`Lines: ${lines}`);
    meta.textContent = parts.join(" | ");
  };

  const exec = (id) => {
    surface.focus();
    const commands = {
      undo: () => document.execCommand("undo"), redo: () => document.execCommand("redo"),
      find: () => { const q = prompt("Find text"); if (q) window.find(q); },
      replace: () => { const from = prompt("Find"); const to = prompt("Replace with"); if (from) surface.innerHTML = surface.innerHTML.split(from).join(to || ""); },
      clearFormat: () => document.execCommand("removeFormat"),
      bold: () => document.execCommand("bold"), italic: () => document.execCommand("italic"), underline: () => document.execCommand("underline"), strikeThrough: () => document.execCommand("strikeThrough"),
      h1: () => document.execCommand("formatBlock", false, "h1"), h2: () => document.execCommand("formatBlock", false, "h2"), paragraph: () => document.execCommand("formatBlock", false, "p"),
      fontName: () => document.execCommand("fontName", false, prompt("Font", "Arial") || "Arial"),
      fontSize: () => document.execCommand("fontSize", false, prompt("Size (1-7)", "4") || "4"),
      foreColor: () => document.execCommand("foreColor", false, prompt("Text color", "#000000") || "#000000"),
      hiliteColor: () => document.execCommand("hiliteColor", false, prompt("Highlight", "#fff59d") || "#fff59d"),
      link: () => { const u = prompt("URL", "https://"); if (u) document.execCommand("createLink", false, u); },
      image: () => { const u = prompt("Image URL"); if (u) document.execCommand("insertImage", false, u); },
      table: () => document.execCommand("insertHTML", false, "<table border='1' style='width:100%;border-collapse:collapse'><tr><th>Header</th><th>Header</th></tr><tr><td>Cell</td><td>Cell</td></tr></table>"),
      checklist: () => document.execCommand("insertHTML", false, "<ul><li>☐ Task 1</li><li>☐ Task 2</li></ul>"),
      quote: () => document.execCommand("formatBlock", false, "blockquote"),
      divider: () => document.execCommand("insertHorizontalRule"),
      date: () => document.execCommand("insertText", false, new Date().toLocaleDateString()),
      time: () => document.execCommand("insertText", false, new Date().toLocaleTimeString()),
      alignLeft: () => document.execCommand("justifyLeft"), alignCenter: () => document.execCommand("justifyCenter"), alignRight: () => document.execCommand("justifyRight"), justify: () => document.execCommand("justifyFull"),
      ul: () => document.execCommand("insertUnorderedList"), ol: () => document.execCommand("insertOrderedList"), indent: () => document.execCommand("indent"), outdent: () => document.execCommand("outdent"),
      newDoc: () => home.querySelector("#createDoc")?.click(), saveDoc: persistCurrent,
      deleteDoc: () => { const cur = getCurrentDoc(); docsState.docs = docsState.docs.filter((d) => d.id !== cur.id); if (!docsState.docs.length) docsState.docs.push({ id: crypto.randomUUID(), title: "New Document", content: "<p>Start typing...</p>", updatedAt: Date.now(), versions: [] }); docsState.currentId = docsState.docs[0].id; saveState("workspaceDocs", docsState); renderHome(); home.classList.remove("hidden"); editor.classList.add("hidden"); },
      exportHtml: () => { const blob = new Blob([surface.innerHTML], { type: "text/html" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${titleInput.value || "document"}.html`; a.click(); },
      printDoc: () => { const w = window.open("", "_blank"); w.document.write(`<html><body>${surface.innerHTML}</body></html>`); w.document.close(); w.print(); },
      restoreVersion: () => { const current = getCurrentDoc(); const versions = (current.versions || []).slice(-10).reverse(); if (!versions.length) return alert("No version history yet."); const pick = Number(prompt(`Choose version 1-${versions.length}`)); const chosen = versions[pick - 1]; if (chosen) { current.content = chosen.content; current.title = chosen.title; titleInput.value = current.title; surface.innerHTML = current.content; saveState("workspaceDocs", docsState); } },
    };
    commands[id]?.();
    if (settingsState.autoSaveDocs) persistCurrent();
    updateMeta();
  };

  groups.innerHTML = docsToolbar.map((g) => `<div class="tool-group"><h4>${g.group}</h4><div>${g.tools.map((t) => `<button data-tool="${t}">${toolLabels[t]}</button>`).join("")}</div></div>`).join("");
  groups.querySelectorAll("[data-tool]").forEach((b) => b.addEventListener("click", () => exec(b.dataset.tool)));
  saveBtn.addEventListener("click", persistCurrent);
  titleInput.addEventListener("input", updateMeta);
  surface.addEventListener("input", () => { updateMeta(); if (settingsState.autoSaveDocs) persistCurrent(); });
  backBtn.addEventListener("click", () => { persistCurrent(); home.classList.remove("hidden"); editor.classList.add("hidden"); });

  renderHome();
  home.classList.remove("hidden");
  editor.classList.add("hidden");
}

function mountBrowser(root) {
  const input = root.querySelector(".url");
  const iframe = root.querySelector("iframe");
  const tabStrip = root.querySelector("#tabStrip");
  const quick = root.querySelector("#quickLinks");
  const backBtn = root.querySelector(".back");
  const forwardBtn = root.querySelector(".forward");
  const reloadBtn = root.querySelector(".reload");
  const homeBtn = root.querySelector(".home");
  const goBtn = root.querySelector(".go");
  const newTabBtn = root.querySelector(".new-tab");

  const tabs = [];
  let active = -1;

  const parseInput = (raw) => {
    const q = raw.trim();
    if (!q) return settingsState.browserHome;
    const looksUrl = /^https?:\/\//i.test(q) || q.includes(".");
    if (!looksUrl || q.includes(" ")) return `https://duckduckgo.com/?q=${encodeURIComponent(q)}`;
    return /^https?:\/\//i.test(q) ? q : `https://${q}`;
  };

  const navigate = (raw) => {
    const url = parseInput(raw);
    if (active < 0) return;
    const tab = tabs[active];
    tab.history = tab.history.slice(0, tab.index + 1);
    tab.history.push(url);
    tab.index += 1;
    tab.url = url;
    iframe.src = url;
    input.value = raw.trim() || url;
    renderTabs();
  };

  const renderTabs = () => {
    tabStrip.innerHTML = "";
    tabs.forEach((tab, i) => {
      const b = document.createElement("button");
      b.className = `tab-btn ${i === active ? "active" : ""}`;
      b.textContent = tab.url.replace(/^https?:\/\//, "").slice(0, 26) || "New Tab";
      b.addEventListener("click", () => switchTab(i));
      tabStrip.appendChild(b);
    });
  };

  const switchTab = (i) => {
    active = i;
    const tab = tabs[active];
    iframe.src = tab.url;
    input.value = tab.url;
    renderTabs();
  };

  const addTab = (url = settingsState.browserHome) => {
    tabs.push({ url, history: [url], index: 0 });
    active = tabs.length - 1;
    switchTab(active);
  };

  backBtn.addEventListener("click", () => {
    const t = tabs[active];
    if (!t || t.index <= 0) return;
    t.index -= 1;
    t.url = t.history[t.index];
    iframe.src = t.url;
    input.value = t.url;
    renderTabs();
  });
  forwardBtn.addEventListener("click", () => {
    const t = tabs[active];
    if (!t || t.index >= t.history.length - 1) return;
    t.index += 1;
    t.url = t.history[t.index];
    iframe.src = t.url;
    input.value = t.url;
    renderTabs();
  });
  reloadBtn.addEventListener("click", () => {
    iframe.src = tabs[active]?.url || settingsState.browserHome;
  });
  homeBtn.addEventListener("click", () => navigate(settingsState.browserHome));
  goBtn.addEventListener("click", () => navigate(input.value));
  input.addEventListener("keydown", (e) => e.key === "Enter" && navigate(input.value));
  newTabBtn.addEventListener("click", () => addTab(settingsState.browserHome));

  quick.innerHTML = settingsState.browserSuggestions
    ? ["OpenAI", "Wikipedia", "MDN", "GitHub", "YouTube", "Stack Overflow"].map((q) => `<button data-q="${q}">${q}</button>`).join("")
    : "";
  quick.querySelectorAll("[data-q]").forEach((b) => b.addEventListener("click", () => navigate(b.dataset.q)));

  addTab(settingsState.browserHome);
}

function focusWindow(win) {
  z += 1;
  win.style.zIndex = String(z);
  document.querySelectorAll(".window").forEach((w) => w.classList.remove("focused"));
  win.classList.add("focused");
}
function addTaskbarItem(appId, title, win) {
  const btn = document.createElement("button");
  btn.className = "taskbar-item active";
  btn.textContent = title;
  btn.addEventListener("click", () => {
    if (win.classList.contains("hidden")) { win.classList.remove("hidden"); focusWindow(win); btn.classList.add("active"); }
    else { win.classList.add("hidden"); btn.classList.remove("active"); }
  });
  taskbarApps.appendChild(btn);
  windows.get(appId).taskBtn = btn;
}
function makeDraggable(win, header) {
  let dragging = false, dx = 0, dy = 0;
  header.addEventListener("mousedown", (e) => {
    if (win.classList.contains("maximized")) return;
    dragging = true; dx = e.clientX - win.offsetLeft; dy = e.clientY - win.offsetTop;
    header.style.cursor = "grabbing"; focusWindow(win);
  });
  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    win.style.left = `${Math.max(0, e.clientX - dx)}px`;
    win.style.top = `${Math.max(0, e.clientY - dy)}px`;
  });
  window.addEventListener("mouseup", () => { dragging = false; header.style.cursor = "grab"; });
}

function openApp(appId) {
  if (windows.has(appId)) {
    const existing = windows.get(appId).element;
    existing.classList.remove("hidden");
    focusWindow(existing);
    windows.get(appId).taskBtn?.classList.add("active");
    startMenu.classList.add("hidden");
    return;
  }
  const app = appDefinitions[appId];
  if (!app) return;

  const win = windowTemplate.content.firstElementChild.cloneNode(true);
  const title = win.querySelector(".window-title");
  const content = win.querySelector(".window-content");
  const header = win.querySelector(".window-header");

  title.textContent = settingsState.titleUppercase ? app.title.toUpperCase() : app.title;
  content.innerHTML = app.content;
  win.style.left = `${Math.floor(Math.random() * 240 + 120)}px`;
  win.style.top = `${Math.floor(Math.random() * 140 + 70)}px`;

  win.addEventListener("mousedown", () => focusWindow(win));
  makeDraggable(win, header);

  let restoreState = null;
  win.querySelector(".minimize").addEventListener("click", () => {
    win.classList.add("hidden");
    windows.get(appId).taskBtn.classList.remove("active");
  });
  win.querySelector(".maximize").addEventListener("click", () => {
    if (win.classList.contains("maximized")) {
      win.classList.remove("maximized");
      if (restoreState) { win.style.top = restoreState.top; win.style.left = restoreState.left; }
    } else {
      restoreState = { top: win.style.top, left: win.style.left };
      win.classList.add("maximized");
    }
    focusWindow(win);
  });
  win.querySelector(".close").addEventListener("click", () => {
    windows.get(appId).taskBtn.remove();
    windows.delete(appId);
    win.remove();
  });

  windowLayer.appendChild(win);
  focusWindow(win);
  windows.set(appId, { element: win });
  addTaskbarItem(appId, app.title, win);
  app.onMount?.(content);
  startMenu.classList.add("hidden");
}

startButton.addEventListener("click", () => startMenu.classList.toggle("hidden"));
document.querySelectorAll("[data-app]").forEach((el) => {
  el.addEventListener("dblclick", () => openApp(el.dataset.app));
  el.addEventListener("click", (e) => { if (el.closest(".pinned-grid")) openApp(el.dataset.app); e.stopPropagation(); });
});
document.addEventListener("click", (e) => { if (!startMenu.contains(e.target) && e.target !== startButton) startMenu.classList.add("hidden"); });

applyAllSettings();
updateClock();
if (settingsState.startupTip && settingsState.notifications) setTimeout(() => alert("Welcome! Open Settings to customize 50 real options."), 300);
if (settingsState.openExplorerOnBoot) openApp("explorer");
if (settingsState.openDocsOnBoot) openApp("docs");
if (settingsState.openBrowserOnBoot) openApp("browser");
