document.addEventListener("DOMContentLoaded", () => {
  const taskForm = document.getElementById("task-form");
  const taskInput = document.getElementById("task-input");
  const categorySelect = document.getElementById("category-select");
  const searchInput = document.getElementById("search-input");
  const filterBtns = document.querySelectorAll(".pill-btn");
  const taskList = document.getElementById("task-list");
  const emptyMsg = document.getElementById("empty-msg");

  const statTotal = document.getElementById("stat-total");
  const statActive = document.getElementById("stat-active");
  const statDone = document.getElementById("stat-done");
  const todayLabel = document.getElementById("today-label");

  // Timer elements
  const timerDisplay = document.getElementById("timer-display");
  const focusLabel = document.getElementById("active-focus-label");
  const startBtn = document.getElementById("timer-start");
  const pauseBtn = document.getElementById("timer-pause");
  const resetBtn = document.getElementById("timer-reset");

  const STORAGE_KEY = "auraboard_tasks_v1";
  let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  let activeCategory = "all";
  let searchQuery = "";

  // Set formatted date
  todayLabel.textContent = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  // 25-minute Pomodoro timer state
  let secondsLeft = 25 * 60;
  let timerInterval = null;

  function renderTimer() {
    const mins = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
    const secs = String(secondsLeft % 60).padStart(2, "0");
    timerDisplay.textContent = `${mins}:${secs}`;
  }

  function startTimer() {
    if (timerInterval) return;
    timerInterval = setInterval(() => {
      if (secondsLeft > 0) {
        secondsLeft--;
        renderTimer();
      } else {
        clearInterval(timerInterval);
        timerInterval = null;
        launchConfetti();
        focusLabel.textContent = "🎉 Sprint Complete!";
      }
    }, 1000);
  }

  function pauseTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  function resetTimer() {
    pauseTimer();
    secondsLeft = 25 * 60;
    renderTimer();
  }

  startBtn.addEventListener("click", startTimer);
  pauseBtn.addEventListener("click", pauseTimer);
  resetBtn.addEventListener("click", resetTimer);

  // Confetti burst when finishing tasks or sprints
  function launchConfetti() {
    const canvas = document.getElementById("confetti-canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["#ff6b6b", "#fbbf24", "#34d399", "#a78bfa", "#38bdf8"];
    const pieces = Array.from({ length: 75 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 120,
      size: 6 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedY: 3 + Math.random() * 4,
      speedX: -2 + Math.random() * 4,
    }));

    let frame = 0;
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      });
      frame++;
      if (frame < 90) {
        requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    animate();
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  function updateStats() {
    const done = tasks.filter((t) => t.done).length;
    statTotal.textContent = String(tasks.length);
    statDone.textContent = String(done);
    statActive.textContent = String(tasks.length - done);
  }

  function render() {
    taskList.innerHTML = "";
    const filtered = tasks.filter((t) => {
      const matchesCat = activeCategory === "all" || t.category === activeCategory;
      const matchesSearch = t.text.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });

    emptyMsg.classList.toggle("hidden", filtered.length > 0);

    filtered.forEach((task) => {
      const li = document.createElement("li");
      li.className = `task-card ${task.done ? "done" : ""}`;

      const main = document.createElement("div");
      main.className = "task-main";

      const check = document.createElement("button");
      check.type = "button";
      check.className = "check-circle";
      check.textContent = task.done ? "✓" : "";
      check.addEventListener("click", () => toggleTask(task.id));

      const title = document.createElement("span");
      title.className = "task-title";
      title.textContent = task.text;
      title.addEventListener("click", () => toggleTask(task.id));

      main.appendChild(check);
      main.appendChild(title);

      const meta = document.createElement("div");
      meta.className = "task-meta";

      const badge = document.createElement("span");
      badge.className = `cat-badge cat-${task.category}`;
      badge.textContent = task.category;

      const focusBtn = document.createElement("button");
      focusBtn.type = "button";
      focusBtn.className = "mini-btn";
      focusBtn.textContent = "Focus";
      focusBtn.addEventListener("click", () => {
        focusLabel.textContent = `Focusing: ${task.text}`;
        resetTimer();
        startTimer();
      });

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "mini-btn del";
      delBtn.textContent = "✕";
      delBtn.addEventListener("click", () => deleteTask(task.id));

      meta.appendChild(badge);
      meta.appendChild(focusBtn);
      meta.appendChild(delBtn);

      li.appendChild(main);
      li.appendChild(meta);
      taskList.appendChild(li);
    });

    updateStats();
  }

  function toggleTask(id) {
    let justCompleted = false;
    tasks = tasks.map((t) => {
      if (t.id === id) {
        justCompleted = !t.done;
        return { ...t, done: !t.done };
      }
      return t;
    });
    save();
    render();
    if (justCompleted && tasks.length > 0 && tasks.every((t) => t.done)) {
      launchConfetti();
    }
  }

  function deleteTask(id) {
    tasks = tasks.filter((t) => t.id !== id);
    save();
    render();
  }

  taskForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = taskInput.value.trim();
    if (!text) return;
    tasks.unshift({
      id: Date.now().toString(),
      text,
      category: categorySelect.value,
      done: false,
    });
    save();
    render();
    taskInput.value = "";
  });

  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value;
    render();
  });

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeCategory = btn.getAttribute("data-filter");
      render();
    });
  });

  render();
});
