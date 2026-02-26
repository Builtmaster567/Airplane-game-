const windowLayer = document.getElementById("windowLayer");
const windowTemplate = document.getElementById("windowTemplate");
const taskbarApps = document.getElementById("taskbarApps");
const startMenu = document.getElementById("startMenu");
const startButton = document.getElementById("startButton");
const clock = document.getElementById("clock");

const windows = new Map();
let z = 20;

const appDefinitions = {
  explorer: {
    title: "File Explorer",
    content: `
      <section class="explorer">
        <h3>Quick Access</h3>
        <ul>
          <li>Desktop</li>
          <li>Documents</li>
          <li>Downloads</li>
          <li>Pictures</li>
          <li>Music</li>
        </ul>
      </section>`,
  },
  docs: {
    title: "Docs",
    content: `
      <section class="doc-editor">
        <p>Draft notes and save your ideas like a pro workspace.</p>
        <textarea aria-label="Document editor">Project Brief\n\n- Objectives\n- Requirements\n- Timeline</textarea>
      </section>`,
  },
  browser: {
    title: "Browser",
    content: `
      <section class="browser-panel">
        <div class="browser-controls">
          <input type="text" value="https://example.com" aria-label="URL" />
          <button>Go</button>
        </div>
        <iframe src="https://example.com" title="In-app browser"></iframe>
      </section>`,
    onMount: (root) => {
      const input = root.querySelector("input");
      const btn = root.querySelector("button");
      const iframe = root.querySelector("iframe");
      const navigate = () => {
        let url = input.value.trim();
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
          url = `https://${url}`;
        }
        iframe.src = url;
      };
      btn.addEventListener("click", navigate);
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") navigate();
      });
    },
  },
  settings: {
    title: "Settings",
    content: `
      <section class="settings">
        <h3>System Settings</h3>
        <p>Theme: Dark</p>
        <p>Security: Windows Security Enabled</p>
        <p>Performance Mode: Balanced</p>
        <button id="focusMode">Toggle Focus Tint</button>
      </section>`,
    onMount: (root) => {
      root.querySelector("#focusMode").addEventListener("click", () => {
        document.body.classList.toggle("focus-mode");
      });
    },
  },
  terminal: {
    title: "Terminal",
    content: `
      <section class="terminal">
        <h3>PowerShell (Simulated)</h3>
        <pre>PS C:\\Users\\Admin> systeminfo\nOS Name: Professional Workspace 11\nVersion: 23H2\nStatus: All systems online.</pre>
      </section>`,
  },
  calculator: {
    title: "Calculator",
    content: `
      <section class="calc">
        <input class="calc-display" readonly value="0" />
        <div class="calc-grid">
          <button>C</button><button>(</button><button>)</button><button>/</button>
          <button>7</button><button>8</button><button>9</button><button>*</button>
          <button>4</button><button>5</button><button>6</button><button>-</button>
          <button>1</button><button>2</button><button>3</button><button>+</button>
          <button>0</button><button>.</button><button>=</button><button>%</button>
        </div>
      </section>`,
    onMount: (root) => {
      const display = root.querySelector(".calc-display");
      root.querySelectorAll("button").forEach((btn) => {
        btn.addEventListener("click", () => {
          const val = btn.textContent;
          if (val === "C") {
            display.value = "0";
          } else if (val === "=") {
            try {
              display.value = String(Function(`return (${display.value})`)());
            } catch {
              display.value = "Error";
            }
          } else {
            display.value = display.value === "0" || display.value === "Error" ? val : display.value + val;
          }
        });
      });
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
