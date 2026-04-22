/* ============================================================
   FOCUSFORGE — script.js
   JS logic is preserved exactly from original.
   Only additions: mascot reactions + HUD pop animation helpers.
   ============================================================ */

/* ── Priority select visual helper (new) ─────────────── */
function updatePriorityStyle() {
  // No visual dot needed in new design — emoji in options handles it
}

/* ── Mascot reaction helpers (new) ──────────────────── */
function mascotCelebrate() {
  const mascot   = document.getElementById("mascot");
  const sparkles = document.getElementById("sparkles");

  mascot.classList.add("happy");
  sparkles.classList.add("visible");

  setTimeout(() => { mascot.classList.remove("happy"); }, 600);
  setTimeout(() => { sparkles.classList.remove("visible"); }, 900);
}


let mascotState = "idle";

function setMascotState(state) {
  const mascot = document.getElementById("mascot");

  // remove all states
  mascot.classList.remove(
    "idle", "happy", "excited", "sad", "thinking", "celebrating"
  );

  // set new state
  mascot.classList.add(state);
  mascotState = state;
}



/* Animate a HUD value changing (new) */
function popHudValue(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove("pop");
  void el.offsetWidth; // reflow to restart animation
  el.classList.add("pop");
  setTimeout(() => el.classList.remove("pop"), 400);
}

/* ── Core State ──────────────────────────────────────── */
const input          = document.getElementById("taskInput");
const list           = document.getElementById("taskList");
const prioritySelect = document.getElementById("priority");

let selectedIndex     = 0;
let tasks             = [];
let lastCompletedDate = null;
let currentFilter     = "all";
let xp                = 0;
let streak            = 0;

/* ── Add task button helper (new — supports the + button) */
function addTaskFromButton() {
  if (input.value.trim() === "") { input.focus(); return; }
  tasks.push({ name: input.value, completed: false, priority: prioritySelect.value });
  input.value = "";
  renderTasks();
  saveData();
}

/* ── Add task on Enter ───────────────────────────────── */
input.addEventListener("keypress", function(e) {
  if (e.key === "Enter") {
    if (input.value.trim() === "") return;
    tasks.push({
      name: input.value,
      completed: false,
      priority: prioritySelect.value
    });
    input.value = "";
    renderTasks();
    saveData();
  }
});

/* ── Render ──────────────────────────────────────────── */
function renderTasks() {
  list.innerHTML = "";

  const visible = tasks.filter(t => {
    if (currentFilter === "active"    && t.completed)  return false;
    if (currentFilter === "completed" && !t.completed) return false;
    return true;
  });


  if (tasks.length === 0) {
  setMascotState("sad");
} else {
  setMascotState("idle");
}


  if (visible.length === 0) {
    const messages = {
      all:       ["🌸", "No tasks yet!<br>Add something to get started~"],
      active:    ["🎉", "All done!<br>You're crushing it today!"],
      completed: ["🌱", "Nothing completed yet.<br>You've got this!"]
    };
    const [icon, text] = messages[currentFilter] || messages.all;
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${icon}</div>
        <p>${text}</p>
      </div>`;
    updateTaskStats();
    return;
  }



  function mascotSpeak(message) {
  console.log("Mascot says:", message);
}

mascotSpeak("Let's get started! 🌸");
mascotSpeak("Nice work! ✨");
mascotSpeak("You're on fire 🔥");



  tasks.forEach((task, index) => {
    if (currentFilter === "active"    && task.completed)  return;
    if (currentFilter === "completed" && !task.completed) return;

    const li = document.createElement("li");
    li.classList.add(task.priority);
    if (task.completed)          li.classList.add("completed");
    if (index === selectedIndex) li.classList.add("selected");

    li.innerHTML = `
      <div class="task-left">
        <div class="task-check"></div>
        <span class="task-name">${escapeHTML(task.name)}</span>
      </div>
      <div class="task-right">
        <span class="task-hint">D · X</span>
        <span class="priority-badge">${task.priority}</span>
      </div>`;

    li.addEventListener("click", () => {
      selectedIndex = index;
      toggleTask(index);
    });

    list.appendChild(li);
  });

  updateTaskStats();
}

function escapeHTML(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* ── Toggle task ─────────────────────────────────────── */
function toggleTask(index) {
  const task = tasks[index];

  if (!task.completed) {
    task.completed = true;
    xp += 10;

    setMascotState("happy");

    updateStreak();

    // if streak increased → celebrate
    if (streak > 1) {
      setMascotState("celebrating");
    }

  } else {
    task.completed = false;
    xp -= 10;
  }

  updateLevel();
  updateStats();
  saveData();
  renderTasks();

  // return to idle after animation
  setTimeout(() => setMascotState("idle"), 1000);
}

/* ── Streak ──────────────────────────────────────────── */
function updateStreak() {
  const today = new Date().toDateString();
  if (!lastCompletedDate) {
    streak = 1;
  } else {
    const diffDays = (new Date(today) - new Date(lastCompletedDate)) / (1000 * 60 * 60 * 24);
    if (diffDays === 1)    streak += 1;
    else if (diffDays > 1) streak = 1;
  }
  lastCompletedDate = today;
}

/* ── Stats UI ────────────────────────────────────────── */
function updateStats() {
  const xpEl     = document.getElementById("xpVal");
  const streakEl = document.getElementById("streakVal");

  if (xpEl)     { xpEl.textContent     = xp;     popHudValue("xpVal"); }
  if (streakEl) { streakEl.textContent = streak;  popHudValue("streakVal"); }
}

let lastLevel = 1;

function updateLevel() {
  const level = Math.floor(xp / 50) + 1;

  if (level > lastLevel) {
    setMascotState("excited");
    setTimeout(() => setMascotState("idle"), 1200);
  }

  lastLevel = level;

  document.getElementById("levelVal").textContent = level;
}

function updateTaskStats() {
  const total = tasks.length;
  const done  = tasks.filter(t => t.completed).length;
  const left  = total - done;
  const el    = document.getElementById("taskState");
  if (el) el.innerHTML =
    `🌟 Total: ${total} &nbsp;·&nbsp; ✅ Done: ${done} &nbsp;·&nbsp; 📝 Left: ${left}`;
}

/* ── Filter ──────────────────────────────────────────── */
function setFilter(filter, event) {
  currentFilter = filter;
  document.querySelectorAll("#filters button").forEach(b => b.classList.remove("active"));
  if (event && event.target) event.target.classList.add("active");
  renderTasks();
}

/* ── Keyboard navigation ─────────────────────────────── */
document.addEventListener("keydown", function(e) {
  if (document.activeElement === input) return;

  if (e.key === "ArrowDown") {
    selectedIndex = (selectedIndex + 1) % Math.max(tasks.length, 1);
    renderTasks();
  }
  if (e.key === "ArrowUp") {
    selectedIndex = (selectedIndex - 1 + Math.max(tasks.length, 1)) % Math.max(tasks.length, 1);
    renderTasks();
  }
  if (e.key.toLowerCase() === "d") toggleTask(selectedIndex);
  if (e.key.toLowerCase() === "x") deleteTask(selectedIndex);
  if (e.key === "/") { e.preventDefault(); input.focus(); }
});

/* ── Delete ──────────────────────────────────────────── */
function deleteTask(index) {
  tasks.splice(index, 1);
  if (selectedIndex >= tasks.length) selectedIndex = tasks.length - 1;
  renderTasks();
  saveData();
}

/* ── LocalStorage ────────────────────────────────────── */
function saveData() {
  localStorage.setItem("tasks",    JSON.stringify(tasks));
  localStorage.setItem("xp",       xp);
  localStorage.setItem("streak",   streak);
  localStorage.setItem("lastDate", lastCompletedDate);
}

function loadData() {
  const t = localStorage.getItem("tasks");
  const x = localStorage.getItem("xp");
  const s = localStorage.getItem("streak");
  const d = localStorage.getItem("lastDate");
  if (t) tasks             = JSON.parse(t);
  if (x) xp                = parseInt(x);
  if (s) streak            = parseInt(s);
  if (d) lastCompletedDate = d;
}

input.addEventListener("input", () => {
  if (input.value.length > 0) {
    setMascotState("thinking");
  } else {
    setMascotState("idle");
  }
});

/* ── Init ────────────────────────────────────────────── */
loadData();
updateStats();
updateLevel();
renderTasks();