const windowLayer = document.getElementById("windowLayer");
const windowTemplate = document.getElementById("windowTemplate");
const taskbarApps = document.getElementById("taskbarApps");
const startMenu = document.getElementById("startMenu");
const startButton = document.getElementById("startButton");
const clock = document.getElementById("clock");

const windows = new Map();
let z = 20;

const docsToolNames = [
  "New", "Open", "Save", "Save As", "Print", "Export PDF", "Share", "Undo", "Redo", "Cut",
  "Copy", "Paste", "Select All", "Find", "Replace", "Word Count", "Spell Check", "Grammar", "Translate", "Read Aloud",
  "Bold", "Italic", "Underline", "Strikethrough", "Subscript", "Superscript", "Highlight", "Text Color", "Clear Format", "Font",
  "Font Size", "Increase Size", "Decrease Size", "Line Spacing", "Paragraph", "Styles", "Heading 1", "Heading 2", "Heading 3", "Quote",
  "Code", "Equation", "Bullet List", "Number List", "Checklist", "Indent", "Outdent", "Align Left", "Align Center", "Align Right",
  "Justify", "Insert Link", "Insert Image", "Insert Table", "Insert Row", "Insert Column", "Merge Cells", "Split Cell", "Page Break", "Section Break",
  "Header", "Footer", "Page Number", "Date", "Time", "Bookmark", "Comment", "Track Changes", "Accept Change", "Reject Change",
  "Version History", "Compare", "Protect", "Encrypt", "Macros", "Templates", "Theme", "Dark Mode", "Light Mode", "Focus Mode",
  "Distraction Free", "Outline", "Navigator", "Table of Contents", "Footnote", "Endnote", "Citation", "Bibliography", "Caption", "Cross Reference",
  "Columns", "Margins", "Orientation", "Paper Size", "Zoom In", "Zoom Out", "Fullscreen", "Ruler", "Gridlines", "Snap To Grid",
  "Auto Correct", "Auto Save", "Cloud Sync", "Offline Mode", "AI Summarize", "AI Rewrite", "AI Expand", "AI Shorten", "AI Tone", "AI Translate",
  "Insert Shape", "Insert Icon", "Insert Chart", "SmartArt", "Watermark", "Background", "Mail Merge", "Label Wizard", "Form Fields", "Sign Document",
  "Review Panel", "Accessibility", "Contrast Check", "Voice Typing", "Handwriting", "Quick Notes", "Snippets", "Pin Tool", "Lock Tool", "Reset Layout"
];

const appDefinitions = {
  explorer: {
    title: "File Explorer Pro",
    content: `
      <section class="explorer">
        <div class="explorer-layout">
          <aside>
            <h4>Quick Access</h4>
            <ul>
              <li>Desktop</li><li>Documents</li><li>Downloads</li><li>Pictures</li><li>Music</li><li>Videos</li><li>Archives</li>
            </ul>
          </aside>
          <main>
            <h3>Recent Workspace Files</h3>
            <table class="explorer-table">
              <tr><th>Name</th><th>Type</th><th>Size</th><th>Modified</th></tr>
              <tr><td>Roadmap-Q2.docx</td><td>Document</td><td>1.4 MB</td><td>Today</td></tr>
              <tr><td>Design-System.fig</td><td>Design</td><td>35 MB</td><td>Yesterday</td></tr>
              <tr><td>Budget-2026.xlsx</td><td>Spreadsheet</td><td>860 KB</td><td>2 days ago</td></tr>
              <tr><td>Release-Notes.md</td><td>Markdown</td><td>120 KB</td><td>1 week ago</td></tr>
            </table>
          </main>
        </div>
      </section>`,
  },
  docs: {
    title: "Docs Studio",
    content: `
      <section class="doc-editor">
        <div class="docs-top">
          <input class="doc-title" value="Professional Workspace Document" aria-label="Document title" />
          <span class="doc-stat" id="docStats">Words: 0 | Chars: 0</span>
        </div>
        <div class="docs-toolbar-wrap">
          <input id="toolSearch" placeholder="Search 130+ tools..." aria-label="Search tools" />
          <div id="docsTools" class="docs-tools"></div>
        </div>
        <textarea id="docArea" aria-label="Document editor">Project Master Plan\n\nExecutive Summary:\nCreate a world-class workspace that mirrors desktop productivity while staying web-native.</textarea>
      </section>`,
    onMount: (root) => {
      const toolsHost = root.querySelector("#docsTools");
      const search = root.querySelector("#toolSearch");
      const area = root.querySelector("#docArea");
      const stats = root.querySelector("#docStats");

      const renderTools = (query = "") => {
        const q = query.trim().toLowerCase();
        const filtered = docsToolNames.filter((t) => t.toLowerCase().includes(q));
        toolsHost.innerHTML = "";
        filtered.forEach((tool) => {
          const btn = document.createElement("button");
          btn.className = "tool-chip";
          btn.textContent = tool;
          btn.addEventListener("click", () => {
            if (["Bold", "Italic", "Underline"].includes(tool)) {
              area.value += `\n[${tool}]`;
            } else if (tool === "Date") {
              area.value += `\n${new Date().toLocaleDateString()}`;
            } else if (tool === "Time") {
              area.value += `\n${new Date().toLocaleTimeString()}`;
            } else {
              area.value += `\n• ${tool} tool activated`;
            }
            updateStats();
          });
          toolsHost.appendChild(btn);
        });
      };

      const updateStats = () => {
        const text = area.value.trim();
        const words = text ? text.split(/\s+/).length : 0;
        stats.textContent = `Words: ${words} | Chars: ${area.value.length}`;
      };

      search.addEventListener("input", () => renderTools(search.value));
      area.addEventListener("input", updateStats);
      renderTools();
      updateStats();
    },
  },
  browser: {
    title: "Browser Pro",
    content: `
      <section class="browser-panel">
        <div class="browser-controls">
          <input type="text" value="https://example.com" aria-label="URL" />
          <button class="go">Go</button>
          <button class="new-tab">+ Tab</button>
        </div>
        <div class="tab-bar" id="tabBar"></div>
        <iframe src="https://example.com" title="In-app browser"></iframe>
      </section>`,
    onMount: (root) => {
      const input = root.querySelector("input");
      const goBtn = root.querySelector(".go");
      const newTabBtn = root.querySelector(".new-tab");
      const tabBar = root.querySelector("#tabBar");
      const iframe = root.querySelector("iframe");
      const tabs = [];
      let active = -1;

      const navigate = () => {
        let url = input.value.trim();
        if (!url) return;
        if (!url.startsWith("http://") && !url.startsWith("https://")) url = `https://${url}`;
        iframe.src = url;
        if (tabs[active]) tabs[active].url = url;
        renderTabs();
      };

      const renderTabs = () => {
        tabBar.innerHTML = "";
        tabs.forEach((tab, i) => {
          const t = document.createElement("button");
          t.className = `tab-btn ${i === active ? "active" : ""}`;
          t.textContent = tab.url.replace(/^https?:\/\//, "").slice(0, 28);
          t.addEventListener("click", () => {
            active = i;
            input.value = tab.url;
            iframe.src = tab.url;
            renderTabs();
          });
          tabBar.appendChild(t);
        });
      };

      const addTab = (url = "https://example.com") => {
        tabs.push({ url });
        active = tabs.length - 1;
        input.value = url;
        iframe.src = url;
        renderTabs();
      };

      goBtn.addEventListener("click", navigate);
      input.addEventListener("keydown", (e) => e.key === "Enter" && navigate());
      newTabBtn.addEventListener("click", () => addTab(input.value || "https://example.com"));
      addTab("https://example.com");
    },
  },
  settings: {
    title: "Settings Center",
    content: `
      <section class="settings">
        <h3>System Settings</h3>
        <p>Theme: Dark Pro</p>
        <p>Security: Defender + Firewall Enabled</p>
        <p>Performance Mode: Adaptive Turbo</p>
        <p>Virtual Desktop: 4 active workspaces</p>
        <button id="focusMode">Toggle Focus Tint</button>
      </section>`,
    onMount: (root) => {
      root.querySelector("#focusMode").addEventListener("click", () => {
        document.body.classList.toggle("focus-mode");
      });
    },
  },
  terminal: {
    title: "Terminal Ultra",
    content: `
      <section class="terminal">
        <h3>PowerShell (Simulated)</h3>
        <pre>PS C:\\Users\\Admin> systeminfo\nOS Name: Professional Workspace 11 Ultimate\nVersion: 24H2\nGPU Mode: Hardware Accelerated\nStatus: All systems optimal.</pre>
      </section>`,
  },
  calculator: {
    title: "Calculator X (Advanced)",
    content: `
      <section class="calc advanced-calc">
        <input class="calc-display" readonly value="0" />
        <div class="calc-row">
          <button data-action="clear">C</button>
          <button data-action="back">⌫</button>
          <button data-action="memsave">MS</button>
          <button data-action="memrecall">MR</button>
          <button data-action="ans">Ans</button>
        </div>
        <div class="calc-row">
          <button data-insert="sin(">sin</button><button data-insert="cos(">cos</button><button data-insert="tan(">tan</button><button data-insert="sqrt(">√</button><button data-insert="log10(">log</button>
        </div>
        <div class="calc-row">
          <button data-insert="ln(">ln</button><button data-insert="pow(">pow</button><button data-insert="PI">π</button><button data-insert="E">e</button><button data-insert="%">%</button>
        </div>
        <div class="calc-grid five">
          <button data-insert="7">7</button><button data-insert="8">8</button><button data-insert="9">9</button><button data-insert="/">÷</button><button data-action="hex">HEX</button>
          <button data-insert="4">4</button><button data-insert="5">5</button><button data-insert="6">6</button><button data-insert="*">×</button><button data-action="bin">BIN</button>
          <button data-insert="1">1</button><button data-insert="2">2</button><button data-insert="3">3</button><button data-insert="-">−</button><button data-action="deg">DEG</button>
          <button data-insert="0">0</button><button data-insert=".">.</button><button data-insert="(">(</button><button data-insert=")">)</button><button data-action="rad">RAD</button>
          <button data-action="history">HIST</button><button data-action="clearhist">CLR-H</button><button data-action="copy">COPY</button><button data-insert="+">+</button><button data-action="equals">=</button>
        </div>
        <div class="calc-history" id="calcHistory"></div>
      </section>`,
    onMount: (root) => {
      const display = root.querySelector(".calc-display");
      const historyHost = root.querySelector("#calcHistory");
      let memory = 0;
      let ans = 0;
      let degreeMode = true;
      const history = [];

      const context = {
        PI: Math.PI,
        E: Math.E,
        sin: (x) => Math.sin(degreeMode ? (x * Math.PI) / 180 : x),
        cos: (x) => Math.cos(degreeMode ? (x * Math.PI) / 180 : x),
        tan: (x) => Math.tan(degreeMode ? (x * Math.PI) / 180 : x),
        sqrt: Math.sqrt,
        log10: Math.log10,
        ln: Math.log,
        pow: Math.pow,
      };

      const renderHistory = () => {
        historyHost.innerHTML = history.length
          ? history.slice(-8).map((h) => `<div>${h}</div>`).join("")
          : "<div>No history yet</div>";
      };

      const evaluate = () => {
        try {
          const expr = display.value.replace(/÷/g, "/").replace(/×/g, "*").replace(/−/g, "-");
          const fn = Function(...Object.keys(context), `return (${expr})`);
          const result = fn(...Object.values(context));
          if (!Number.isFinite(result)) throw new Error("Invalid");
          ans = result;
          history.push(`${expr} = ${result}`);
          display.value = String(result);
          renderHistory();
        } catch {
          display.value = "Error";
        }
      };

      root.querySelectorAll("button").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const action = btn.dataset.action;
          const insert = btn.dataset.insert;

          if (insert) {
            display.value = display.value === "0" || display.value === "Error" ? insert : display.value + insert;
            return;
          }

          if (action === "clear") display.value = "0";
          else if (action === "back") display.value = display.value.length > 1 ? display.value.slice(0, -1) : "0";
          else if (action === "memsave") memory = Number(display.value) || memory;
          else if (action === "memrecall") display.value = String(memory);
          else if (action === "ans") display.value += String(ans);
          else if (action === "deg") degreeMode = true;
          else if (action === "rad") degreeMode = false;
          else if (action === "equals") evaluate();
          else if (action === "history") renderHistory();
          else if (action === "clearhist") {
            history.length = 0;
            renderHistory();
          } else if (action === "copy") {
            try {
              await navigator.clipboard.writeText(display.value);
              history.push(`Copied: ${display.value}`);
              renderHistory();
            } catch {
              history.push("Clipboard copy unavailable");
              renderHistory();
            }
          } else if (action === "hex") {
            const n = Number(display.value);
            display.value = Number.isFinite(n) ? Math.trunc(n).toString(16).toUpperCase() : "Error";
          } else if (action === "bin") {
            const n = Number(display.value);
            display.value = Number.isFinite(n) ? Math.trunc(n).toString(2) : "Error";
          }
        });
      });

      renderHistory();
    },
  },
};

function updateClock() {
  const now = new Date();
  clock.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
setInterval(updateClock, 1000);
updateClock();

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
        win.style.width = restoreState.width;
        win.style.height = restoreState.height;
      }
    } else {
      restoreState = {
        top: win.style.top,
        left: win.style.left,
        width: win.style.width,
        height: win.style.height,
      };
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

startButton.addEventListener("click", () => {
  startMenu.classList.toggle("hidden");
});

document.querySelectorAll("[data-app]").forEach((el) => {
  el.addEventListener("dblclick", () => openApp(el.dataset.app));
  el.addEventListener("click", (e) => {
    if (el.closest(".pinned-grid")) openApp(el.dataset.app);
    e.stopPropagation();
  });
});

document.addEventListener("click", (e) => {
  if (!startMenu.contains(e.target) && e.target !== startButton) {
    startMenu.classList.add("hidden");
  }
});

["explorer", "docs", "browser"].forEach(openApp);
