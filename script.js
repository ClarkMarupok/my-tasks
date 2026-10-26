// ================== DevTasks ==================

const STORE_KEY = "devtasks.v2";
const STATUS_ORDER = ["active", "progress", "done"];
const STATUS_LABEL = { active: "Active", progress: "In Progress", done: "Done" };
const PRIORITY_LABEL = { critical: "Critical", high: "High", medium: "Medium", low: "Low" };
const VIEW_TITLE = { dashboard: "Dashboard", projects: "Projects", settings: "Settings" };

const SAMPLE_TASKS = [
  { name: "Fix API Authentication bug", project: "Core API", priority: "critical", status: "progress" },
  { name: "Implement new task sorting feature", project: "Frontend Redesign", priority: "high", status: "active" },
  { name: "Code Review for PR #123", project: "Frontend Redesign", priority: "medium", status: "active" },
  { name: "Code Review for task #123", project: "Core API", priority: "low", status: "done" },
];

// ---- State ----
let tasks = [];
let currentFilter = "all";
let currentView = "dashboard";

// ---- Elements ----
const $ = (id) => document.getElementById(id);
const form = $("task-form");
const taskInput = $("task-input");
const projectInput = $("project-input");
const priorityInput = $("priority-input");
const body = $("task-body");
const emptyMsg = $("empty");
const counter = $("counter");
const subcount = $("subcount");
const projectList = $("project-list");
const bellDot = $("bell-dot");
const toastEl = $("toast");

// ---- Storage ----
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function seed() {
  return SAMPLE_TASKS.map((t) => ({ id: uid(), ...t }));
}

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    tasks = raw === null ? seed() : JSON.parse(raw) || [];
  } catch {
    tasks = seed();
  }
}

function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(tasks));
  } catch {
    /* storage blocked: app still works for this visit */
  }
}

// ---- Helpers ----
function toast(message) {
  toastEl.textContent = message;
  toastEl.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => (toastEl.hidden = true), 2400);
}

const FILE_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>';

// ---- Dashboard rendering ----
function renderDashboard() {
  const visible = tasks.filter((t) => currentFilter === "all" || t.status === currentFilter);

  body.innerHTML = "";
  visible.forEach((task) => {
    const tr = document.createElement("tr");
    tr.className = task.status;

    // Task name
    const tdName = document.createElement("td");
    const nameWrap = document.createElement("div");
    nameWrap.className = "task-name";
    nameWrap.insertAdjacentHTML("beforeend", FILE_ICON);
    const nameText = document.createElement("span");
    nameText.textContent = task.name; // textContent keeps user input safe
    nameWrap.appendChild(nameText);
    tdName.appendChild(nameWrap);

    // Project
    const tdProject = document.createElement("td");
    tdProject.textContent = task.project || "\u2014";

    // Priority
    const tdPriority = document.createElement("td");
    const pill = document.createElement("span");
    pill.className = "pill p-" + task.priority;
    pill.textContent = PRIORITY_LABEL[task.priority];
    tdPriority.appendChild(pill);

    // Status (click to cycle)
    const tdStatus = document.createElement("td");
    const statusBtn = document.createElement("button");
    statusBtn.className = "status s-" + task.status;
    statusBtn.textContent = STATUS_LABEL[task.status];
    statusBtn.title = "Click to change status";
    statusBtn.addEventListener("click", () => cycleStatus(task.id));
    tdStatus.appendChild(statusBtn);

    // Delete
    const tdDel = document.createElement("td");
    const del = document.createElement("button");
    del.className = "del";
    del.setAttribute("aria-label", "Delete task");
    del.textContent = "\u00D7";
    del.addEventListener("click", () => removeTask(task.id));
    tdDel.appendChild(del);

    tr.append(tdName, tdProject, tdPriority, tdStatus, tdDel);
    body.appendChild(tr);
  });

  const left = tasks.filter((t) => t.status !== "done").length;
  counter.textContent = left + (left === 1 ? " active task left" : " active tasks left");
  subcount.textContent = "(" + left + " active " + (left === 1 ? "task" : "tasks") + ")";
  emptyMsg.hidden = visible.length > 0;

  // Project suggestions for the input box
  projectList.innerHTML = "";
  [...new Set(tasks.map((t) => t.project).filter(Boolean))].forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p;
    projectList.appendChild(opt);
  });

  // Bell dot: any unfinished critical task
  bellDot.hidden = !tasks.some((t) => t.priority === "critical" && t.status !== "done");
}

// ---- Projects rendering ----
function renderProjects() {
  const grid = $("project-grid");
  grid.innerHTML = "";

  const groups = {};
  tasks.forEach((t) => {
    const key = t.project || "No project";
    (groups[key] = groups[key] || []).push(t);
  });

  const names = Object.keys(groups);
  $("projects-empty").hidden = names.length > 0;

  names.forEach((name) => {
    const list = groups[name];
    const done = list.filter((t) => t.status === "done").length;
    const pct = Math.round((done / list.length) * 100);

    const card = document.createElement("div");
    card.className = "project-card";

    const h = document.createElement("h3");
    h.textContent = name;
    const p = document.createElement("p");
    p.textContent = done + " of " + list.length + " tasks done (" + pct + "%)";
    const bar = document.createElement("div");
    bar.className = "bar";
    const fill = document.createElement("i");
    fill.style.width = pct + "%";
    bar.appendChild(fill);

    card.append(h, p, bar);
    grid.appendChild(card);
  });
}

function render() {
  renderDashboard();
  if (currentView === "projects") renderProjects();
}

// ---- Actions ----
function addTask(name, project, priority) {
  tasks.unshift({ id: uid(), name, project, priority, status: "active" });
  save();
  render();
}

function cycleStatus(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  task.status = STATUS_ORDER[(STATUS_ORDER.indexOf(task.status) + 1) % STATUS_ORDER.length];
  save();
  render();
}

function removeTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  save();
  render();
}

function setView(view) {
  currentView = view;
  document.querySelectorAll(".view").forEach((el) => (el.hidden = el.id !== "view-" + view));
  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.view === view));
  $("page-title").textContent = VIEW_TITLE[view];
  render();
}

// ---- Events ----
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = taskInput.value.trim();
  if (!name) return;
  addTask(name, projectInput.value.trim(), priorityInput.value);
  taskInput.value = "";
  taskInput.focus();
});

document.querySelectorAll(".filter").forEach((btn) => {
  btn.addEventListener("click", () => {
    currentFilter = btn.dataset.filter;
    document.querySelectorAll(".filter").forEach((b) => b.classList.toggle("active", b === btn));
    renderDashboard();
  });
});

document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => setView(btn.dataset.view));
});

$("clear-done").addEventListener("click", () => {
  const before = tasks.length;
  tasks = tasks.filter((t) => t.status !== "done");
  save();
  render();
  toast(before - tasks.length + " completed task(s) cleared");
});

$("bell").addEventListener("click", () => {
  const n = tasks.filter((t) => t.priority === "critical" && t.status !== "done").length;
  toast(n === 0 ? "No critical tasks. You're all caught up." : n + " critical task(s) need attention");
});

$("reset-demo").addEventListener("click", () => {
  tasks = seed();
  save();
  render();
  toast("Sample data restored");
});

$("clear-all").addEventListener("click", () => {
  if (confirm("Delete ALL tasks? This cannot be undone.")) {
    tasks = [];
    save();
    render();
    toast("All tasks deleted");
  }
});

// ---- Start ----
load();
setView("dashboard");
