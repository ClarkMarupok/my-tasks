// ---- State ----
let tasks = [];
let currentFilter = "all";

// ---- Elements ----
const form = document.getElementById("task-form");
const input = document.getElementById("task-input");
const list = document.getElementById("task-list");
const counter = document.getElementById("counter");
const emptyMsg = document.getElementById("empty");
const clearBtn = document.getElementById("clear-done");
const filterBtns = document.querySelectorAll(".filter");

// ---- Storage (tasks survive page refresh) ----
function load() {
  try {
    tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  } catch {
    tasks = [];
  }
}

function save() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// ---- Rendering ----
function render() {
  list.innerHTML = "";

  const visible = tasks.filter((t) => {
    if (currentFilter === "active") return !t.done;
    if (currentFilter === "done") return t.done;
    return true;
  });

  visible.forEach((task) => {
    const li = document.createElement("li");
    if (task.done) li.classList.add("done");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.addEventListener("change", () => toggle(task.id));

    const text = document.createElement("span");
    text.textContent = task.text; // textContent keeps user input safe

    const del = document.createElement("button");
    del.className = "delete";
    del.setAttribute("aria-label", "Delete task");
    del.textContent = "\u00D7";
    del.addEventListener("click", () => remove(task.id));

    li.append(checkbox, text, del);
    list.appendChild(li);
  });

  const left = tasks.filter((t) => !t.done).length;
  counter.textContent = left + (left === 1 ? " task left" : " tasks left");
  emptyMsg.hidden = visible.length > 0;
}

// ---- Actions ----
function add(text) {
  tasks.push({ id: Date.now(), text, done: false });
  save();
  render();
}

function toggle(id) {
  const task = tasks.find((t) => t.id === id);
  if (task) task.done = !task.done;
  save();
  render();
}

function remove(id) {
  tasks = tasks.filter((t) => t.id !== id);
  save();
  render();
}

// ---- Events ----
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  add(text);
  input.value = "";
  input.focus();
});

filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    currentFilter = btn.dataset.filter;
    filterBtns.forEach((b) => b.classList.toggle("active", b === btn));
    render();
  });
});

clearBtn.addEventListener("click", () => {
  tasks = tasks.filter((t) => !t.done);
  save();
  render();
});

// ---- Start ----
load();
render();
