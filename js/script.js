import * as api from "./api.js?v=3";

async function loadTasks() {
  const taskList = document.getElementById("task-list");

  try {
    const tasks = await api.getTasks();
    taskList.innerHTML = "";

    tasks.forEach((task) => {
      const taskContainer = document.createElement("div");
      
      const taskTitle = document.createElement("span");
      taskTitle.textContent = task.title;

      const taskDescription = document.createElement("p");
      taskDescription.textContent = task.description;

      const taskDate = document.createElement("p");
      taskDate.textContent = task.date;
      
      const deleteTaskBtn = document.createElement("button");
      deleteTaskBtn.dataset.action = "delete-task";
      deleteTaskBtn.dataset.taskId = task.id;
      deleteTaskBtn.textContent = "Delete";
      
      taskContainer.appendChild(taskTitle);
      taskContainer.appendChild(deleteTaskBtn);
      taskContainer.appendChild(taskDescription);
      taskContainer.appendChild(taskDate);
      taskList.appendChild(taskContainer);
    });
  } catch (error) {
    console.error("Failed to load tasks:", error);
  }
}

async function addTask() {
  const taskTitleInput = document.getElementById("task-title-input");
  const title = taskTitleInput.value.trim();

  const taskDescriptionInput = document.getElementById("task-description-input");
  const description = taskDescriptionInput.value.trim();

  const taskDateInput = document.getElementById("task-date-input");
  const date = taskDateInput.value;

  if (!title) {
    return;
  }

  try {
    await api.createTask(title, description, date);
    taskTitleInput.value = "";
    taskDescriptionInput.value = "";
    taskDateInput.value = "";
    await loadTasks();
  } catch (error) {
    console.error("Failed to add task:", error);
  }
}

async function deleteTask(id) {
  try {
    await api.deleteTask(id);
    await loadTasks();
  } catch (error) {
    console.error("Failed to delete task:", error);
  }
}

window.addEventListener("load", () => {
  loadTasks();
});

document.addEventListener("click", (event) => {
  if (event.target.id === "add-task-btn") {
    addTask();
  } else if (event.target.dataset.action === "delete-task") {
    deleteTask(event.target.dataset.taskId);
  }
});
