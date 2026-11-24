document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("quest-form");
  const input = document.getElementById("quest-input");
  const tagSelect = document.getElementById("quest-tag");
  const searchBox = document.getElementById("search-box");
  const filterChips = document.querySelectorAll(".chip-filter");
  const soundToggle = document.getElementById("sound-toggle");

  const lists = {
    todo: document.getElementById("list-todo"),
    doing: document.getElementById("list-doing"),
    done: document.getElementById("list-done"),
  };

  const counts = {
    todo: document.getElementById("count-todo"),
    doing: document.getElementById("count-doing"),
    done: document.getElementById("count-done"),
  };

  const xpCounter = document.getElementById("xp-counter");
  const xpBarFill = document.getElementById("xp-bar-fill");
  const rankTitle = document.getElementById("rank-title");
  const completedSummary = document.getElementById("completed-summary");

  const XP_MAP = { dev: 30, study: 25, design: 20, life: 15 };
  const RANKS = [
    "CODE ROOKIE",
    "BUG HUNTER",
    "STACK BUILDER",
    "SPRINT ARCHITECT",
    "FULL-STACK LEGEND",
  ];

  const STORAGE_KEY = "questboard_data_v1";
  let quests = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [
    {
      id: "1",
      title: "Build interactive Kanban board on GitHub",
      tag: "dev",
      status: "doing",
    },
    {
      id: "2",
      title: "Practice Data Structures & Algorithms problems",
      tag: "study",
      status: "todo",
    },
  ];

  let activeTag = "all";
  let keyword = "";
  let soundEnabled = true;
  let draggedId = null;

  function playTone(freq = 520, duration = 0.12) {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio blocked before interaction
    }
  }

  soundToggle.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    soundToggle.textContent = soundEnabled ? "🔊 Sound On" : "🔇 Muted";
  });

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quests));
  }

  function updateXP() {
    const doneQuests = quests.filter((q) => q.status === "done");
    const totalXP = doneQuests.reduce((sum, q) => sum + (XP_MAP[q.tag] || 20), 0);
    const level = Math.floor(totalXP / 100) + 1;
    const progressInLevel = totalXP % 100;
    const rankName = RANKS[Math.min(level - 1, RANKS.length - 1)];

    xpCounter.textContent = `${totalXP} XP`;
    xpBarFill.style.width = `${progressInLevel}%`;
    rankTitle.textContent = `LVL ${level} • ${rankName}`;
    completedSummary.textContent = `${doneQuests.length} quest${doneQuests.length === 1 ? "" : "s"} completed`;
  }

  function moveQuest(id, nextStatus) {
    quests = quests.map((q) => {
      if (q.id === id) {
        if (q.status !== "done" && nextStatus === "done") {
          playTone(680, 0.18);
        } else {
          playTone(440, 0.09);
        }
        return { ...q, status: nextStatus };
      }
      return q;
    });
    save();
    render();
  }

  function deleteQuest(id) {
    quests = quests.filter((q) => q.id !== id);
    playTone(260, 0.1);
    save();
    render();
  }

  function render() {
    Object.values(lists).forEach((el) => (el.innerHTML = ""));

    const filtered = quests.filter((q) => {
      const tagMatch = activeTag === "all" || q.tag === activeTag;
      const textMatch = q.title.toLowerCase().includes(keyword.toLowerCase());
      return tagMatch && textMatch;
    });

    ["todo", "doing", "done"].forEach((status) => {
      const items = filtered.filter((q) => q.status === status);
      counts[status].textContent = String(items.length);

      if (items.length === 0) {
        const hint = document.createElement("p");
        hint.className = "empty-hint";
        hint.textContent = "Drop a quest card here";
        lists[status].appendChild(hint);
        return;
      }

      items.forEach((quest) => {
        const card = document.createElement("div");
        card.className = "quest-card";
        card.draggable = true;

        card.addEventListener("dragstart", () => {
          draggedId = quest.id;
          card.classList.add("dragging");
        });
        card.addEventListener("dragend", () => {
          draggedId = null;
          card.classList.remove("dragging");
        });

        const top = document.createElement("div");
        top.className = "quest-top";

        const badge = document.createElement("span");
        badge.className = `quest-badge tag-${quest.tag}`;
        badge.textContent = quest.tag;

        const xp = document.createElement("span");
        xp.className = "xp-tag";
        xp.textContent = `+${XP_MAP[quest.tag] || 20} XP`;

        top.appendChild(badge);
        top.appendChild(xp);

        const title = document.createElement("div");
        title.className = "quest-title";
        title.textContent = quest.title;

        const footer = document.createElement("div");
        footer.className = "quest-footer";

        const moveBtns = document.createElement("div");
        moveBtns.className = "move-btns";

        if (status !== "todo") {
          const backBtn = document.createElement("button");
          backBtn.type = "button";
          backBtn.className = "action-btn";
          backBtn.textContent = status === "done" ? "← Reopen" : "← Backlog";
          backBtn.addEventListener("click", () =>
            moveQuest(quest.id, status === "done" ? "doing" : "todo")
          );
          moveBtns.appendChild(backBtn);
        }

        if (status !== "done") {
          const nextBtn = document.createElement("button");
          nextBtn.type = "button";
          nextBtn.className = "action-btn";
          nextBtn.textContent = status === "todo" ? "Start →" : "Complete ✓";
          nextBtn.addEventListener("click", () =>
            moveQuest(quest.id, status === "todo" ? "doing" : "done")
          );
          moveBtns.appendChild(nextBtn);
        }

        const delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.className = "action-btn del";
        delBtn.textContent = "Delete";
        delBtn.addEventListener("click", () => deleteQuest(quest.id));

        footer.appendChild(moveBtns);
        footer.appendChild(delBtn);

        card.appendChild(top);
        card.appendChild(title);
        card.appendChild(footer);
        lists[status].appendChild(card);
      });
    });

    updateXP();
  }

  // Enable drag-and-drop on columns
  document.querySelectorAll(".kanban-col").forEach((col) => {
    const status = col.getAttribute("data-status");
    const zone = col.querySelector(".drop-zone");

    col.addEventListener("dragover", (e) => {
      e.preventDefault();
      zone.classList.add("drag-over");
    });

    col.addEventListener("dragleave", () => {
      zone.classList.remove("drag-over");
    });

    col.addEventListener("drop", (e) => {
      e.preventDefault();
      zone.classList.remove("drag-over");
      if (draggedId && status) {
        moveQuest(draggedId, status);
      }
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = input.value.trim();
    if (!title) return;

    quests.unshift({
      id: Date.now().toString(),
      title,
      tag: tagSelect.value,
      status: "todo",
    });

    playTone(540, 0.1);
    save();
    render();
    input.value = "";
  });

  searchBox.addEventListener("input", (e) => {
    keyword = e.target.value;
    render();
  });

  filterChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      filterChips.forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      activeTag = chip.getAttribute("data-tag");
      render();
    });
  });

  render();
});
