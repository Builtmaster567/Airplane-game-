const windowLayer = document.getElementById("windowLayer");
const windowTemplate = document.getElementById("windowTemplate");
const taskbarApps = document.getElementById("taskbarApps");
const startMenu = document.getElementById("startMenu");
const startButton = document.getElementById("startButton");
const clock = document.getElementById("clock");
const desktop = document.getElementById("desktop");

const windows = new Map();
let z = 20;

const settingsDefaults = {
  theme: "dark",
  accent: "#4ea1ff",
  blur: 12,
  windowOpacity: 88,
  showSeconds: false,
  iconScale: 100,
  taskbarHeight: 56,
  widgetClock: true,
  widgetNotes: true,
  widgetWeather: false,
};

const docDefaults = {
  docs: [
    {
      id: crypto.randomUUID(),
      title: "Welcome Document",
      content: "<h1>Welcome</h1><p>This is your professional Docs workspace.</p>",
      updatedAt: Date.now(),
      versions: [],
    },
  ],
  currentId: null,
};

const settingsState = loadState("workspaceSettings", settingsDefaults);
const docsState = loadState("workspaceDocs", docDefaults);
if (!docsState.currentId && docsState.docs[0]) docsState.currentId = docsState.docs[0].id;

const sessionFiles = [];

const docsToolbar = [
  {
    group: "File",
    tools: [
      { id: "newDoc", label: "New" },
      { id: "saveDoc", label: "Save" },
      { id: "deleteDoc", label: "Delete" },
      { id: "exportHtml", label: "Export" },
      { id: "printDoc", label: "Print" },
      { id: "restoreVersion", label: "History" },
    ],
  },
  {
    group: "Edit",
    tools: [
      { id: "undo", label: "Undo" },
      { id: "redo", label: "Redo" },
      { id: "find", label: "Find" },
      { id: "replace", label: "Replace" },
      { id: "clearFormat", label: "Clear" },
    ],
  },
  {
    group: "Format",
    tools: [
      { id: "bold", label: "Bold" },
      { id: "italic", label: "Italic" },
      { id: "underline", label: "Underline" },
      { id: "strikeThrough", label: "Strike" },
      { id: "h1", label: "H1" },
      { id: "h2", label: "H2" },
      { id: "paragraph", label: "P" },
      { id: "fontName", label: "Font" },
      { id: "fontSize", label: "Size" },
      { id: "foreColor", label: "Text" },
      { id: "hiliteColor", label: "Highlight" },
    ],
  },
  {
    group: "Insert",
    tools: [
      { id: "link", label: "Link" },
      { id: "image", label: "Image" },
      { id: "table", label: "Table" },
      { id: "checklist", label: "Checklist" },
      { id: "quote", label: "Quote" },
      { id: "divider", label: "Divider" },
      { id: "date", label: "Date" },
      { id: "time", label: "Time" },
    ],
  },
  {
    group: "Layout",
    tools: [
      { id: "alignLeft", label: "Left" },
      { id: "alignCenter", label: "Center" },
      { id: "alignRight", label: "Right" },
      { id: "justify", label: "Justify" },
      { id: "ul", label: "Bullets" },
      { id: "ol", label: "Numbers" },
      { id: "indent", label: "Indent" },
      { id: "outdent", label: "Outdent" },
    ],
  },
];

const appDefinitions = {
  explorer: {
    title: "Files & Media",
    content: `
      <section class="explorer-pro">
        <div class="files-toolbar">
          <label class="upload-btn">Upload Files<input id="fileInput" type="file" multiple hidden /></label>
          <button id="clearFiles">Clear Session Files</button>
        </div>
        <div class="files-layout">
          <aside>
            <h4>My Files</h4>
            <div id="fileList" class="file-list"></div>
          </aside>
          <main>
            <h4>Preview</h4>
            <div id="filePreview" class="file-preview">Select a file to preview it.</div>
          </main>
        </div>
      </section>`,
    onMount: (root) => mountExplorer(root),
  },
  docs: {
    title: "Google Docs Style Studio",
    content: `
      <section class="docs-pro">
        <div class="docs-home" id="docsHome"></div>
        <div class="docs-editor hidden" id="docsEditor">
          <div class="docs-header">
            <button id="backToHome">← Home</button>
            <input id="docTitle" class="doc-title" />
            <button id="saveDoc">Save</button>
            <span id="docMeta" class="doc-meta"></span>
          </div>
          <div id="toolGroups" class="tool-groups"></div>
          <div id="docSurface" class="doc-surface" contenteditable="true"></div>
        </div>
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
    title: "Settings Center",
    content: `<section class="settings"><h3>Real System Settings</h3><div id="settingsGrid" class="settings-grid"></div></section>`,
    onMount: (root) => mountSettings(root),
  },
  terminal: {
    title: "Terminal",
    content: `<section class="terminal"><h3>PowerShell</h3><pre>PS C:\\Users\\Admin> status\nDesktop online\nDocs synced locally\nFiles viewer ready</pre></section>`,
  },
  calculator: {
    title: "Calculator X",
    content: `<section class="calc"><input class="calc-display" readonly value="0" /><div class="calc-grid"><button>C</button><button>(</button><button>)</button><button>/</button><button>7</button><button>8</button><button>9</button><button>*</button><button>4</button><button>5</button><button>6</button><button>-</button><button>1</button><button>2</button><button>3</button><button>+</button><button>0</button><button>.</button><button>=</button><button>%</button></div></section>`,
    onMount: (root) => {
      const d = root.querySelector(".calc-display");
      root.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
        const v = b.textContent;
        if (v === "C") d.value = "0";
        else if (v === "=") {
          try { d.value = String(Function(`return (${d.value})`)()); } catch { d.value = "Error"; }
        } else d.value = d.value === "0" || d.value === "Error" ? v : d.value + v;
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

function saveState(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getCurrentDoc() {
  return docsState.docs.find((d) => d.id === docsState.currentId) || docsState.docs[0];
}

function updateClock() {
  const now = new Date();
  clock.textContent = now.toLocaleTimeString([], settingsState.showSeconds ? { hour: "2-digit", minute: "2-digit", second: "2-digit" } : { hour: "2-digit", minute: "2-digit" });
}
setInterval(updateClock, 1000);

function applySettings() {
  document.body.dataset.theme = settingsState.theme;
  document.body.style.setProperty("--accent", settingsState.accent);
  document.body.style.setProperty("--blur", `${settingsState.blur}px`);
  document.body.style.setProperty("--window-opacity", settingsState.windowOpacity / 100);
  document.body.style.setProperty("--icon-scale", settingsState.iconScale / 100);
  document.body.style.setProperty("--taskbar-height", `${settingsState.taskbarHeight}px`);
  renderWidgets();
  updateClock();
}

function renderWidgets() {
  let panel = document.getElementById("widgetPanel");
  if (!panel) {
    panel = document.createElement("aside");
    panel.id = "widgetPanel";
    panel.className = "widget-panel";
    desktop.appendChild(panel);
  }

  const cards = [];
  if (settingsState.widgetClock) cards.push(`<div class="widget"><h4>Clock</h4><p>${new Date().toLocaleString()}</p></div>`);
  if (settingsState.widgetWeather) cards.push(`<div class="widget"><h4>Weather</h4><p>Cloudy 22°C • Workspace City</p></div>`);
  if (settingsState.widgetNotes) cards.push(`<div class="widget"><h4>Quick Notes</h4><textarea id="quickNote">${localStorage.getItem("quickNote") || "Write quick notes..."}</textarea></div>`);
  panel.innerHTML = cards.join("");

  const note = panel.querySelector("#quickNote");
  if (note) note.addEventListener("input", () => localStorage.setItem("quickNote", note.value));
}

function mountSettings(root) {
  const options = [
    { key: "theme", label: "Theme", type: "select", options: ["dark", "light", "aqua", "midnight"] },
    { key: "accent", label: "Accent Color", type: "color" },
    { key: "blur", label: "Window Blur", type: "range", min: 0, max: 24 },
    { key: "windowOpacity", label: "Window Opacity", type: "range", min: 50, max: 100 },
    { key: "showSeconds", label: "Clock Seconds", type: "checkbox" },
    { key: "iconScale", label: "Desktop Icon Scale", type: "range", min: 80, max: 140 },
    { key: "taskbarHeight", label: "Taskbar Height", type: "range", min: 46, max: 74 },
    { key: "widgetClock", label: "Widget: Clock", type: "checkbox" },
    { key: "widgetNotes", label: "Widget: Notes", type: "checkbox" },
    { key: "widgetWeather", label: "Widget: Weather", type: "checkbox" },
  ];

  const advanced = Array.from({ length: 45 }, (_, i) => ({ key: `pref${i + 1}`, label: `System Preference ${i + 1}`, type: "checkbox" }));
  const all = [...options, ...advanced];

  const grid = root.querySelector("#settingsGrid");
  all.forEach((item) => {
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
      input.value = settingsState[item.key] ?? item.options[0];
      input.addEventListener("change", () => {
        settingsState[item.key] = input.value;
        saveState("workspaceSettings", settingsState);
        applySettings();
      });
    } else if (item.type === "color") {
      input = document.createElement("input");
      input.type = "color";
      input.value = settingsState[item.key] || "#4ea1ff";
      input.addEventListener("input", () => {
        settingsState[item.key] = input.value;
        saveState("workspaceSettings", settingsState);
        applySettings();
      });
    } else if (item.type === "range") {
      input = document.createElement("input");
      input.type = "range";
      input.min = item.min;
      input.max = item.max;
      input.value = settingsState[item.key] ?? item.min;
      const val = document.createElement("small");
      val.textContent = input.value;
      input.addEventListener("input", () => {
        val.textContent = input.value;
        settingsState[item.key] = Number(input.value);
        saveState("workspaceSettings", settingsState);
        applySettings();
      });
      row.appendChild(val);
    } else {
      input = document.createElement("input");
      input.type = "checkbox";
      input.checked = !!settingsState[item.key];
      input.addEventListener("change", () => {
        settingsState[item.key] = input.checked;
        saveState("workspaceSettings", settingsState);
        applySettings();
      });
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
    if (!sessionFiles.length) {
      list.innerHTML = "<p>No uploaded files yet.</p>";
      return;
    }
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
    home.innerHTML = `
      <div class="docs-home-header">
        <h3>Documents Home</h3>
        <button id="createDoc">+ New Document</button>
      </div>
      <div class="docs-cards">
        ${docsState.docs
          .map((d) => `<article class="doc-card"><h4>${d.title}</h4><p>Updated ${new Date(d.updatedAt).toLocaleString()}</p><div><button data-open="${d.id}">Open</button><button data-delete="${d.id}">Delete</button></div></article>`)
          .join("")}
      </div>`;

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
      if (!docsState.docs.length) {
        docsState.docs.push({ id: crypto.randomUUID(), title: "New Document", content: "<p>Start typing...</p>", updatedAt: Date.now(), versions: [] });
      }
      docsState.currentId = docsState.docs[0].id;
      saveState("workspaceDocs", docsState);
      renderHome();
    }));
  };

  const updateMeta = () => {
    const text = surface.innerText || "";
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    meta.textContent = `Words: ${words} | Chars: ${text.length}`;
  };

  const exec = (id) => {
    surface.focus();
    const command = {
      undo: () => document.execCommand("undo"), redo: () => document.execCommand("redo"),
      find: () => { const q = prompt("Find text"); if (q) window.find(q); },
      replace: () => {
        const from = prompt("Find");
        const to = prompt("Replace with");
        if (from) surface.innerHTML = surface.innerHTML.split(from).join(to || "");
      },
      clearFormat: () => document.execCommand("removeFormat"),
      bold: () => document.execCommand("bold"), italic: () => document.execCommand("italic"),
      underline: () => document.execCommand("underline"), strikeThrough: () => document.execCommand("strikeThrough"),
      h1: () => document.execCommand("formatBlock", false, "h1"),
      h2: () => document.execCommand("formatBlock", false, "h2"),
      paragraph: () => document.execCommand("formatBlock", false, "p"),
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
      alignLeft: () => document.execCommand("justifyLeft"),
      alignCenter: () => document.execCommand("justifyCenter"),
      alignRight: () => document.execCommand("justifyRight"),
      justify: () => document.execCommand("justifyFull"),
      ul: () => document.execCommand("insertUnorderedList"),
      ol: () => document.execCommand("insertOrderedList"),
      indent: () => document.execCommand("indent"),
      outdent: () => document.execCommand("outdent"),
      newDoc: () => home.querySelector("#createDoc")?.click(),
      saveDoc: persistCurrent,
      deleteDoc: () => {
        const current = getCurrentDoc();
        docsState.docs = docsState.docs.filter((d) => d.id !== current.id);
        if (!docsState.docs.length) docsState.docs.push({ id: crypto.randomUUID(), title: "New Document", content: "<p>Start typing...</p>", updatedAt: Date.now(), versions: [] });
        docsState.currentId = docsState.docs[0].id;
        saveState("workspaceDocs", docsState);
        renderHome();
        home.classList.remove("hidden");
        editor.classList.add("hidden");
      },
      exportHtml: () => {
        const blob = new Blob([surface.innerHTML], { type: "text/html" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${titleInput.value || "document"}.html`;
        a.click();
      },
      printDoc: () => {
        const w = window.open("", "_blank");
        w.document.write(`<html><body>${surface.innerHTML}</body></html>`);
        w.document.close();
        w.print();
      },
      restoreVersion: () => {
        const current = getCurrentDoc();
        const versions = (current.versions || []).slice(-10).reverse();
        if (!versions.length) return alert("No version history yet.");
        const pick = prompt(`Choose version 1-${versions.length}`);
        const idx = Number(pick) - 1;
        if (versions[idx]) {
          current.content = versions[idx].content;
          current.title = versions[idx].title;
          titleInput.value = current.title;
          surface.innerHTML = current.content;
          saveState("workspaceDocs", docsState);
          updateMeta();
        }
      },
    };

    command[id]?.();
    updateMeta();
  };

  groups.innerHTML = docsToolbar
    .map((g) => `<div class="tool-group"><h4>${g.group}</h4><div>${g.tools.map((t) => `<button data-tool="${t.id}">${t.label}</button>`).join("")}</div></div>`)
    .join("");

  groups.querySelectorAll("[data-tool]").forEach((b) => b.addEventListener("click", () => exec(b.dataset.tool)));
  saveBtn.addEventListener("click", persistCurrent);
  titleInput.addEventListener("input", updateMeta);
  surface.addEventListener("input", updateMeta);
  backBtn.addEventListener("click", () => {
    persistCurrent();
    home.classList.remove("hidden");
    editor.classList.add("hidden");
  });

  renderHome();
  home.classList.remove("hidden");
  editor.classList.add("hidden");
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

applySettings();
updateClock();
["explorer", "docs", "browser"].forEach(openApp);
