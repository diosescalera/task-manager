import * as api from "./api.js";

async function loadTasks() {
  const taskList = document.getElementById("task-list");

  try {
    const tasks = await api.getTasks();
    taskList.innerHTML = "";

    tasks.forEach((task) => {
      const li = document.createElement("li");
      li.textContent = task.title;
      taskList.appendChild(li);
    });
  } catch (error) {
    console.error("Failed to load tasks:", error);
  }
}

async function addTask() {
  const taskTitleInput = document.getElementById("task-title-input");
  const title = taskTitleInput.value.trim();

  if (!title) {
    return;
  }

  try {
    await api.createTask(title);
    taskTitleInput.value = "";
    await loadTasks();
  } catch (error) {
    console.error("Failed to add task:", error);
  }
}

async function clearTasks() {
  try {
    await api.clearTasks();
    await loadTasks();
  } catch (error) {
    console.error("Failed to clear tasks:", error);
  }
}

window.addEventListener("load", () => {
  loadTasks();
});

document.addEventListener("click", (event) => {
  if (event.target.id === "add-task-btn") {
    addTask();
  } else if (event.target.id === "clear-tasks-btn") {
    clearTasks();
  }
});
