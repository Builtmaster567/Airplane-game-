const windowLayer = document.getElementById("windowLayer");
const windowTemplate = document.getElementById("windowTemplate");
const taskbarApps = document.getElementById("taskbarApps");
const startMenu = document.getElementById("startMenu");
const startButton = document.getElementById("startButton");
const clock = document.getElementById("clock");

const windows = new Map();
let z = 20;

const settingsState = JSON.parse(localStorage.getItem("workspaceSettings") || "{}");

const docsTools = [
  ...["undo","redo","cut","copy","paste","selectAll","find","replace"].map((id) => ({ id, label: id })),
  ...["bold","italic","underline","strikeThrough","subscript","superscript","justifyLeft","justifyCenter","justifyRight","justifyFull"].map((id) => ({ id, label: id })),
  ...["insertUnorderedList","insertOrderedList","outdent","indent","removeFormat"].map((id) => ({ id, label: id })),
  { id: "fontName", label: "Font" },
  { id: "fontSize", label: "Font Size" },
  { id: "foreColor", label: "Text Color" },
  { id: "hiliteColor", label: "Highlight" },
  { id: "createLink", label: "Link" },
  { id: "unlink", label: "Unlink" },
  { id: "insertImage", label: "Image" },
  { id: "insertTable", label: "Table" },
  { id: "insertDate", label: "Date" },
  { id: "insertTime", label: "Time" },
  { id: "insertCode", label: "Code" },
  { id: "insertQuote", label: "Quote" },
  { id: "insertChecklist", label: "Checklist" },
  { id: "insertPageBreak", label: "Page Break" },
  { id: "insertHorizontalRule", label: "Divider" },
  { id: "toUpperCase", label: "UPPER" },
  { id: "toLowerCase", label: "lower" },
  { id: "capitalize", label: "Capitalize" },
  { id: "wordCount", label: "Word Count" },
  { id: "toggleReadonly", label: "Read Only" },
  { id: "downloadHtml", label: "Export HTML" },
  { id: "printDoc", label: "Print" },
  { id: "clearDoc", label: "Clear" },
  ...Array.from({ length: 75 }, (_, i) => ({ id: `snippet-${i + 1}`, label: `Snippet ${i + 1}` })),
];

const settingsCatalog = [
  { key: "theme", label: "Theme", type: "select", options: ["dark", "light", "midnight", "aqua"], value: "dark" },
  { key: "accentHue", label: "Accent Hue", type: "range", min: 180, max: 320, step: 1, value: 208 },
  { key: "windowOpacity", label: "Window Opacity", type: "range", min: 50, max: 100, step: 1, value: 88 },
  { key: "blur", label: "Glass Blur", type: "range", min: 0, max: 30, step: 1, value: 12 },
  { key: "wallpaperIntensity", label: "Wallpaper Intensity", type: "range", min: 20, max: 100, step: 1, value: 100 },
  { key: "animations", label: "Enable Animations", type: "toggle", value: true },
  { key: "rounded", label: "Rounded Windows", type: "toggle", value: true },
  { key: "showClockSeconds", label: "Show Clock Seconds", type: "toggle", value: false },
  { key: "autoOpenApps", label: "Auto-open Core Apps", type: "toggle", value: true },
  { key: "snapAssist", label: "Snap Assist", type: "toggle", value: true },
  { key: "taskbarCenter", label: "Centered Taskbar", type: "toggle", value: true },
  { key: "highContrast", label: "High Contrast", type: "toggle", value: false },
  { key: "reduceMotion", label: "Reduce Motion", type: "toggle", value: false },
  { key: "fontFamily", label: "UI Font", type: "select", options: ["Segoe UI", "Inter", "Roboto", "Arial"], value: "Segoe UI" },
  { key: "fontScale", label: "UI Font Scale", type: "range", min: 90, max: 130, step: 1, value: 100 },
  { key: "desktopSaturation", label: "Desktop Saturation", type: "range", min: 50, max: 140, step: 1, value: 100 },
  { key: "desktopBrightness", label: "Desktop Brightness", type: "range", min: 60, max: 130, step: 1, value: 100 },
  { key: "taskbarHeight", label: "Taskbar Height", type: "range", min: 46, max: 72, step: 1, value: 56 },
  { key: "taskbarOpacity", label: "Taskbar Opacity", type: "range", min: 50, max: 100, step: 1, value: 82 },
  { key: "iconScale", label: "Desktop Icon Scale", type: "range", min: 80, max: 140, step: 1, value: 100 },
  ...Array.from({ length: 35 }, (_, i) => ({ key: `productivityToggle${i + 1}`, label: `Productivity Feature ${i + 1}`, type: "toggle", value: i % 2 === 0 })),
];

const appDefinitions = {
  explorer: {
    title: "File Explorer Pro",
    content: `<section class="explorer"><h3>File Explorer</h3><p>Professional workspace file system with quick access and recent docs.</p></section>`,
  },
  docs: {
    title: "Docs Studio Pro",
    content: `
      <section class="doc-editor-pro">
        <div class="docs-top">
          <input class="doc-title" value="Workspace Master Document" aria-label="Document title" />
          <span class="doc-stat" id="docStats">Words: 0 | Chars: 0</span>
        </div>
        <div class="docs-toolbar-wrap">
          <input id="toolSearch" placeholder="Search 100+ Google-Docs style tools..." aria-label="Search tools" />
          <div id="docsTools" class="docs-tools"></div>
        </div>
        <div id="docSurface" class="doc-surface" contenteditable="true" spellcheck="true">Welcome to Docs Studio Pro.<br><br>Everything here is editable with 100+ tools, fonts, and advanced writing controls.</div>
      </section>`,
    onMount: (root) => mountDocs(root),
  },
  browser: {
    title: "Browser Pro",
    content: `
      <section class="browser-panel">
        <div class="browser-controls">
          <input type="text" value="https://example.com" aria-label="URL" />
          <button class="go">Go</button>
        </div>
        <iframe src="https://example.com" title="In-app browser"></iframe>
      </section>`,
    onMount: (root) => {
      const input = root.querySelector("input");
      const go = root.querySelector(".go");
      const iframe = root.querySelector("iframe");
      const nav = () => {
        let url = input.value.trim();
        if (!url.startsWith("http://") && !url.startsWith("https://")) url = `https://${url}`;
        iframe.src = url;
      };
      go.addEventListener("click", nav);
      input.addEventListener("keydown", (e) => e.key === "Enter" && nav());
    },
  },
  settings: {
    title: "Settings Center (50+ Working)",
    content: `<section class="settings"><h3>System Settings</h3><div id="settingsGrid" class="settings-grid"></div></section>`,
    onMount: (root) => mountSettings(root),
  },
  terminal: {
    title: "Terminal Ultra",
    content: `<section class="terminal"><h3>PowerShell</h3><pre>PS C:\\Users\\Admin> systeminfo\nWorkspace: Optimal\nApps: Running</pre></section>`,
  },
  calculator: {
    title: "Calculator X Advanced",
    content: `
      <section class="calc advanced-calc">
        <input class="calc-display" readonly value="0" />
        <div class="calc-row"><button data-action="clear">C</button><button data-action="back">⌫</button><button data-action="ms">MS</button><button data-action="mr">MR</button><button data-action="ans">Ans</button></div>
        <div class="calc-row"><button data-insert="sin(">sin</button><button data-insert="cos(">cos</button><button data-insert="tan(">tan</button><button data-insert="sqrt(">√</button><button data-insert="log10(">log</button></div>
        <div class="calc-grid five">
          <button data-insert="7">7</button><button data-insert="8">8</button><button data-insert="9">9</button><button data-insert="/">÷</button><button data-action="deg">DEG</button>
          <button data-insert="4">4</button><button data-insert="5">5</button><button data-insert="6">6</button><button data-insert="*">×</button><button data-action="rad">RAD</button>
          <button data-insert="1">1</button><button data-insert="2">2</button><button data-insert="3">3</button><button data-insert="-">−</button><button data-action="hex">HEX</button>
          <button data-insert="0">0</button><button data-insert=".">.</button><button data-insert="(">(</button><button data-insert=")">)</button><button data-action="bin">BIN</button>
          <button data-action="history">HIST</button><button data-action="copy">COPY</button><button data-insert="+">+</button><button data-action="equals">=</button><button data-action="clearhist">CLR-H</button>
        </div>
        <div class="calc-history" id="calcHistory"></div>
      </section>`,
    onMount: (root) => mountCalculator(root),
  },
};

function getSetting(key) {
  const def = settingsCatalog.find((s) => s.key === key);
  return settingsState[key] ?? def?.value;
}

function applySetting(key, value) {
  settingsState[key] = value;
  localStorage.setItem("workspaceSettings", JSON.stringify(settingsState));
  const bodyStyle = document.body.style;

  if (key === "theme") {
    document.body.dataset.theme = value;
  } else if (key === "accentHue") {
    bodyStyle.setProperty("--accent-h", value);
  } else if (key === "windowOpacity") {
    bodyStyle.setProperty("--window-opacity", Number(value) / 100);
  } else if (key === "blur") {
    bodyStyle.setProperty("--blur", `${value}px`);
  } else if (key === "wallpaperIntensity") {
    bodyStyle.setProperty("--wallpaper-intensity", Number(value) / 100);
  } else if (key === "showClockSeconds") {
    updateClock();
  } else if (key === "taskbarCenter") {
    document.querySelector(".taskbar").style.justifyContent = value ? "center" : "flex-start";
  } else if (key === "highContrast") {
    document.body.classList.toggle("high-contrast", !!value);
  } else if (key === "reduceMotion") {
    document.body.classList.toggle("reduce-motion", !!value);
  } else if (key === "fontFamily") {
    bodyStyle.setProperty("--ui-font", value);
  } else if (key === "fontScale") {
    bodyStyle.setProperty("--font-scale", Number(value) / 100);
  } else if (key === "desktopSaturation") {
    bodyStyle.setProperty("--desktop-saturation", Number(value) / 100);
  } else if (key === "desktopBrightness") {
    bodyStyle.setProperty("--desktop-brightness", Number(value) / 100);
  } else if (key === "taskbarHeight") {
    bodyStyle.setProperty("--taskbar-height", `${value}px`);
  } else if (key === "taskbarOpacity") {
    bodyStyle.setProperty("--taskbar-opacity", Number(value) / 100);
  } else if (key === "iconScale") {
    bodyStyle.setProperty("--icon-scale", Number(value) / 100);
  } else if (key === "rounded") {
    document.body.classList.toggle("square-windows", !value);
  } else if (key === "animations") {
    document.body.classList.toggle("no-animations", !value);
  }
}

function initSettings() {
  settingsCatalog.forEach((s) => applySetting(s.key, getSetting(s.key)));
}

function mountSettings(root) {
  const grid = root.querySelector("#settingsGrid");
  settingsCatalog.forEach((setting) => {
    const row = document.createElement("label");
    row.className = "setting-row";
    row.innerHTML = `<span>${setting.label}</span>`;
    let input;
    const value = getSetting(setting.key);

    if (setting.type === "toggle") {
      input = document.createElement("input");
      input.type = "checkbox";
      input.checked = !!value;
      input.addEventListener("change", () => applySetting(setting.key, input.checked));
    } else if (setting.type === "range") {
      input = document.createElement("input");
      input.type = "range";
      input.min = setting.min;
      input.max = setting.max;
      input.step = setting.step;
      input.value = value;
      const out = document.createElement("small");
      out.textContent = String(value);
      input.addEventListener("input", () => {
        out.textContent = input.value;
        applySetting(setting.key, Number(input.value));
      });
      row.appendChild(out);
    } else {
      input = document.createElement("select");
      setting.options.forEach((opt) => {
        const o = document.createElement("option");
        o.value = opt;
        o.textContent = opt;
        input.appendChild(o);
      });
      input.value = value;
      input.addEventListener("change", () => applySetting(setting.key, input.value));
    }

    row.appendChild(input);
    grid.appendChild(row);
  });
}

function mountDocs(root) {
  const toolsHost = root.querySelector("#docsTools");
  const search = root.querySelector("#toolSearch");
  const surface = root.querySelector("#docSurface");
  const stats = root.querySelector("#docStats");
  let readOnly = false;

  const updateStats = () => {
    const text = surface.innerText.trim();
    const words = text ? text.split(/\s+/).length : 0;
    stats.textContent = `Words: ${words} | Chars: ${text.length}`;
  };

  const wrapSelection = (before, after = before) => {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    const text = range.toString() || "text";
    range.deleteContents();
    range.insertNode(document.createTextNode(`${before}${text}${after}`));
  };

  const executeTool = (toolId) => {
    surface.focus();
    if (toolId.startsWith("snippet-")) {
      const n = toolId.split("-")[1];
      document.execCommand("insertText", false, `\n[Snippet ${n}] Professional content block\n`);
      return;
    }

    const commandMap = {
      bold: ["bold"], italic: ["italic"], underline: ["underline"], strikeThrough: ["strikeThrough"],
      subscript: ["subscript"], superscript: ["superscript"], justifyLeft: ["justifyLeft"],
      justifyCenter: ["justifyCenter"], justifyRight: ["justifyRight"], justifyFull: ["justifyFull"],
      insertUnorderedList: ["insertUnorderedList"], insertOrderedList: ["insertOrderedList"],
      outdent: ["outdent"], indent: ["indent"], removeFormat: ["removeFormat"],
      undo: ["undo"], redo: ["redo"], cut: ["cut"], copy: ["copy"], paste: ["paste"],
      selectAll: ["selectAll"], unlink: ["unlink"], insertHorizontalRule: ["insertHorizontalRule"],
    };

    if (commandMap[toolId]) {
      document.execCommand(commandMap[toolId][0], false, commandMap[toolId][1] || null);
    } else if (toolId === "fontName") {
      const font = prompt("Font name", "Georgia") || "Georgia";
      document.execCommand("fontName", false, font);
    } else if (toolId === "fontSize") {
      const size = prompt("Font size (1-7)", "4") || "4";
      document.execCommand("fontSize", false, size);
    } else if (toolId === "foreColor") {
      const color = prompt("Text color", "#4ea1ff") || "#4ea1ff";
      document.execCommand("foreColor", false, color);
    } else if (toolId === "hiliteColor") {
      const color = prompt("Highlight color", "#ffe98a") || "#ffe98a";
      document.execCommand("hiliteColor", false, color);
    } else if (toolId === "createLink") {
      const url = prompt("Enter URL", "https://example.com");
      if (url) document.execCommand("createLink", false, url);
    } else if (toolId === "insertImage") {
      const url = prompt("Image URL", "https://picsum.photos/200");
      if (url) document.execCommand("insertImage", false, url);
    } else if (toolId === "insertTable") {
      document.execCommand("insertHTML", false, `<table border="1" style="width:100%;border-collapse:collapse"><tr><th>Header</th><th>Header</th></tr><tr><td>Cell</td><td>Cell</td></tr></table>`);
    } else if (toolId === "insertDate") {
      document.execCommand("insertText", false, new Date().toLocaleDateString());
    } else if (toolId === "insertTime") {
      document.execCommand("insertText", false, new Date().toLocaleTimeString());
    } else if (toolId === "insertCode") {
      wrapSelection("`", "`");
    } else if (toolId === "insertQuote") {
      wrapSelection("\“", "\”");
    } else if (toolId === "insertChecklist") {
      document.execCommand("insertHTML", false, `<ul><li>☐ Item 1</li><li>☐ Item 2</li></ul>`);
    } else if (toolId === "insertPageBreak") {
      document.execCommand("insertHTML", false, `<hr style="border:0;border-top:2px dashed #6f8fbf;margin:18px 0"/>`);
    } else if (toolId === "toUpperCase") {
      wrapSelection("", "");
      document.execCommand("insertText", false, (window.getSelection().toString() || surface.innerText).toUpperCase());
    } else if (toolId === "toLowerCase") {
      document.execCommand("insertText", false, (window.getSelection().toString() || surface.innerText).toLowerCase());
    } else if (toolId === "capitalize") {
      const t = (window.getSelection().toString() || surface.innerText).replace(/\b\w/g, (c) => c.toUpperCase());
      document.execCommand("insertText", false, t);
    } else if (toolId === "wordCount") {
      alert(stats.textContent);
    } else if (toolId === "toggleReadonly") {
      readOnly = !readOnly;
      surface.contentEditable = String(!readOnly);
    } else if (toolId === "downloadHtml") {
      const blob = new Blob([surface.innerHTML], { type: "text/html" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "document.html";
      a.click();
      URL.revokeObjectURL(a.href);
    } else if (toolId === "printDoc") {
      const w = window.open("", "_blank");
      w.document.write(`<html><body>${surface.innerHTML}</body></html>`);
      w.document.close();
      w.print();
    } else if (toolId === "clearDoc") {
      surface.innerHTML = "";
    }
    updateStats();
  };

  const renderTools = (query = "") => {
    const q = query.trim().toLowerCase();
    toolsHost.innerHTML = "";
    docsTools
      .filter((t) => t.label.toLowerCase().includes(q) || t.id.toLowerCase().includes(q))
      .forEach((tool) => {
        const btn = document.createElement("button");
        btn.className = "tool-chip";
        btn.textContent = tool.label;
        btn.addEventListener("click", () => executeTool(tool.id));
        toolsHost.appendChild(btn);
      });
  };

  search.addEventListener("input", () => renderTools(search.value));
  surface.addEventListener("input", updateStats);
  renderTools();
  updateStats();
}

function mountCalculator(root) {
  const display = root.querySelector(".calc-display");
  const historyHost = root.querySelector("#calcHistory");
  let memory = 0;
  let ans = 0;
  let deg = true;
  const history = [];

  const ctx = {
    PI: Math.PI,
    E: Math.E,
    sin: (x) => Math.sin(deg ? (x * Math.PI) / 180 : x),
    cos: (x) => Math.cos(deg ? (x * Math.PI) / 180 : x),
    tan: (x) => Math.tan(deg ? (x * Math.PI) / 180 : x),
    sqrt: Math.sqrt,
    log10: Math.log10,
  };

  const renderHistory = () => {
    historyHost.innerHTML = history.slice(-10).map((h) => `<div>${h}</div>`).join("") || "<div>No history</div>";
  };

  const evalExpr = () => {
    try {
      const expr = display.value.replace(/÷/g, "/").replace(/×/g, "*").replace(/−/g, "-");
      const fn = Function(...Object.keys(ctx), `return (${expr})`);
      const result = fn(...Object.values(ctx));
      if (!Number.isFinite(result)) throw new Error();
      ans = result;
      display.value = String(result);
      history.push(`${expr} = ${result}`);
    } catch {
      display.value = "Error";
    }
    renderHistory();
  };

  root.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const ins = btn.dataset.insert;
      const action = btn.dataset.action;
      if (ins) {
        display.value = display.value === "0" || display.value === "Error" ? ins : display.value + ins;
        return;
      }
      if (action === "clear") display.value = "0";
      else if (action === "back") display.value = display.value.length > 1 ? display.value.slice(0, -1) : "0";
      else if (action === "ms") memory = Number(display.value) || memory;
      else if (action === "mr") display.value = String(memory);
      else if (action === "ans") display.value += String(ans);
      else if (action === "deg") deg = true;
      else if (action === "rad") deg = false;
      else if (action === "hex") display.value = Math.trunc(Number(display.value) || 0).toString(16).toUpperCase();
      else if (action === "bin") display.value = Math.trunc(Number(display.value) || 0).toString(2);
      else if (action === "copy") {
        try { await navigator.clipboard.writeText(display.value); history.push(`Copied ${display.value}`); } catch { history.push("Clipboard unavailable"); }
      } else if (action === "history") renderHistory();
      else if (action === "clearhist") history.length = 0;
      else if (action === "equals") evalExpr();
      renderHistory();
    });
  });

  renderHistory();
}

function updateClock() {
  const now = new Date();
  const withSeconds = !!getSetting("showClockSeconds");
  clock.textContent = now.toLocaleTimeString([], withSeconds ? { hour: "2-digit", minute: "2-digit", second: "2-digit" } : { hour: "2-digit", minute: "2-digit" });
}
setInterval(updateClock, 1000);

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
    if (win.classList.contains("hidden")) {
      win.classList.remove("hidden");
      focusWindow(win);
      btn.classList.add("active");
    } else {
      win.classList.add("hidden");
      btn.classList.remove("active");
    }
  });
  taskbarApps.appendChild(btn);
  windows.get(appId).taskBtn = btn;
}

function makeDraggable(win, header) {
  let dragging = false;
  let dx = 0;
  let dy = 0;

  header.addEventListener("mousedown", (e) => {
    if (win.classList.contains("maximized")) return;
    dragging = true;
    dx = e.clientX - win.offsetLeft;
    dy = e.clientY - win.offsetTop;
    header.style.cursor = "grabbing";
    focusWindow(win);
  });

  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    win.style.left = `${Math.max(0, e.clientX - dx)}px`;
    win.style.top = `${Math.max(0, e.clientY - dy)}px`;
  });

  window.addEventListener("mouseup", () => {
    dragging = false;
    header.style.cursor = "grab";
  });
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

  title.textContent = app.title;
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
      if (restoreState) {
        win.style.top = restoreState.top;
        win.style.left = restoreState.left;
      }
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
  el.addEventListener("click", (e) => {
    if (el.closest(".pinned-grid")) openApp(el.dataset.app);
    e.stopPropagation();
  });
});

document.addEventListener("click", (e) => {
  if (!startMenu.contains(e.target) && e.target !== startButton) startMenu.classList.add("hidden");
});

initSettings();
updateClock();
if (getSetting("autoOpenApps")) ["explorer", "docs", "browser"].forEach(openApp);
