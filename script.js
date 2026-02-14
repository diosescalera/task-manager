const DB_NAME = "task_manager";
const DB_VERSION = 1;
const STORE_NAME = "tasks";
const IMPORTANCE_GAP = 128;

let db = null;

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getDb() {
  if (!db) db = await openDatabase();
  return db;
}

function dbRequest(storeName, mode, action) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const request = action(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function rebalanceImportance() {
  await getDb();
  const tasks = await dbRequest(STORE_NAME, "readonly", (store) =>
    store.getAll(),
  );

  tasks.sort((a, b) => {
    const aValid =
      a.importance && typeof a.importance === "number" && !isNaN(a.importance);
    const bValid =
      b.importance && typeof b.importance === "number" && !isNaN(b.importance);

    if (aValid && bValid) return a.importance - b.importance;
    if (!aValid && !bValid) return a.id.localeCompare(b.id);
    return aValid ? -1 : 1;
  });

  const transaction = db.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);

  tasks.forEach((task, index) => {
    task.importance = (index + 1) * IMPORTANCE_GAP;
    store.put(task);
  });

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

async function getTaskImportance() {
  await getDb();
  const tasks = await dbRequest(STORE_NAME, "readonly", (store) =>
    store.getAll(),
  );

  if (tasks.length === 0) return IMPORTANCE_GAP;

  const validTasks = tasks.filter(
    (t) =>
      t.importance && typeof t.importance === "number" && !isNaN(t.importance),
  );

  const lowestImportance =
    validTasks.length > 0
      ? Math.min(...validTasks.map((t) => t.importance))
      : Infinity;

  const newImportance = lowestImportance / 2;
  const needsRebalance =
    validTasks.length < tasks.length ||
    newImportance < 1 ||
    !Number.isInteger(newImportance);

  if (needsRebalance) {
    await rebalanceImportance();
    return IMPORTANCE_GAP / 2;
  }

  return newImportance;
}

async function loadTasks() {
  const taskList = document.getElementById("task-list");
  await getDb();

  const tasks = await dbRequest(STORE_NAME, "readonly", (store) =>
    store.getAll(),
  );
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

    const hr = document.createElement("hr");

    taskContainer.appendChild(taskTitle);
    taskContainer.appendChild(deleteTaskBtn);
    if (task.description) taskContainer.appendChild(taskDescription);
    if (task.date) taskContainer.appendChild(taskDate);
    taskContainer.appendChild(hr);
    taskList.appendChild(taskContainer);
  });
}

async function addTask() {
  const taskTitleInput = document.getElementById("task-title-input");
  const title = taskTitleInput.value.trim();
  if (!title) return;

  const taskDescriptionInput = document.getElementById(
    "task-description-input",
  );
  const description = taskDescriptionInput.value.trim() || null;

  const taskDateInput = document.getElementById("task-date-input");
  const date = taskDateInput.value || null;

  const importance = await getTaskImportance();

  await dbRequest(STORE_NAME, "readwrite", (store) =>
    store.add({
      id: crypto.randomUUID(),
      title,
      description,
      importance,
      date,
    }),
  );

  taskTitleInput.value = "";
  taskDescriptionInput.value = "";
  taskDateInput.value = "";
  document.getElementById("add-task-dialog").close();
  await loadTasks();
}

async function deleteTask(id) {
  await getDb();
  await dbRequest(STORE_NAME, "readwrite", (store) => store.delete(id));
  await loadTasks();
}

window.addEventListener("load", () => loadTasks());

document.addEventListener("click", (event) => {
  if (event.target.id === "open-task-modal-btn") {
    document.getElementById("add-task-dialog").showModal();
  } else if (event.target.id === "add-task-btn") {
    const form = event.target.closest("form");
    if (form && !form.checkValidity()) {
      event.preventDefault();
      form.reportValidity();
      return;
    }
    event.preventDefault();
    addTask();
  } else if (event.target.id === "cancel-task-btn") {
    document.getElementById("add-task-dialog").close();
  } else if (event.target.dataset.action === "delete-task") {
    deleteTask(event.target.dataset.taskId);
  }
});
