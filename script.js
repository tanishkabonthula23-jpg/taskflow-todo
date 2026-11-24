document.addEventListener("DOMContentLoaded", () => {
  const todoForm = document.getElementById("todo-form");
  const taskInput = document.getElementById("task-input");
  const prioritySelect = document.getElementById("priority-select");
  const taskList = document.getElementById("task-list");
  const emptyState = document.getElementById("empty-state");
  const filterButtons = document.querySelectorAll(".filter-btn");
  const clearCompletedBtn = document.getElementById("clear-completed");
  const progressText = document.getElementById("progress-text");
  const progressFill = document.getElementById("progress-fill");
  const currentDateEl = document.getElementById("current-date");

  const STORAGE_KEY = "taskflow_tasks_v1";
  let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  let currentFilter = "all";

  // Display today's formatted date
  if (currentDateEl) {
    currentDateEl.textContent = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  function updateProgress() {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    progressText.textContent = `${completed} / ${total} Done`;
    progressFill.style.width = `${percent}%`;
  }

  function renderTasks() {
    taskList.innerHTML = "";

    const filteredTasks = tasks.filter((task) => {
      if (currentFilter === "active") return !task.completed;
      if (currentFilter === "completed") return task.completed;
      return true;
    });

    if (filteredTasks.length === 0) {
      emptyState.classList.remove("hidden");
    } else {
      emptyState.classList.add("hidden");
    }

    filteredTasks.forEach((task) => {
      const li = document.createElement("li");
      li.className = `task-item ${task.completed ? "completed" : ""}`;

      const leftDiv = document.createElement("div");
      leftDiv.className = "task-left";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "task-checkbox";
      checkbox.checked = task.completed;
      checkbox.addEventListener("change", () => toggleTask(task.id));

      const textSpan = document.createElement("span");
      textSpan.className = "task-text";
      textSpan.textContent = task.text;
      textSpan.addEventListener("click", () => toggleTask(task.id));

      leftDiv.appendChild(checkbox);
      leftDiv.appendChild(textSpan);

      const actionsDiv = document.createElement("div");
      actionsDiv.className = "task-actions";

      const priorityBadge = document.createElement("span");
      priorityBadge.className = `priority-pill priority-${task.priority}`;
      priorityBadge.textContent = task.priority;

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "btn-delete";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", () => deleteTask(task.id));

      actionsDiv.appendChild(priorityBadge);
      actionsDiv.appendChild(deleteBtn);

      li.appendChild(leftDiv);
      li.appendChild(actionsDiv);
      taskList.appendChild(li);
    });

    updateProgress();
  }

  function addTask(text, priority) {
    const newTask = {
      id: Date.now().toString(),
      text,
      priority,
      completed: false,
    };
    tasks.unshift(newTask);
    saveTasks();
    renderTasks();
  }

  function toggleTask(id) {
    tasks = tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    saveTasks();
    renderTasks();
  }

  function deleteTask(id) {
    tasks = tasks.filter((task) => task.id !== id);
    saveTasks();
    renderTasks();
  }

  todoForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = taskInput.value.trim();
    if (!text) return;

    addTask(text, prioritySelect.value);
    taskInput.value = "";
    taskInput.focus();
  });

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.getAttribute("data-filter");
      renderTasks();
    });
  });

  clearCompletedBtn.addEventListener("click", () => {
    tasks = tasks.filter((task) => !task.completed);
    saveTasks();
    renderTasks();
  });

  renderTasks();
});
