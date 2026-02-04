const DB_NAME = "task_manager";
const DB_VERSION = 1;
const STORE_NAME = "tasks";

let databaseInstance = null;
let openingPromise = null;

export function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getDatabase() {
  if (databaseInstance) {
    return databaseInstance;
  }

  if (!openingPromise) {
    openingPromise = openDatabase()
      .then((db) => {
        databaseInstance = db;
        return db;
      })
      .catch((error) => {
        openingPromise = null;
        throw error;
      });
  }

  return openingPromise;
}

export function getTasks(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export function addTask(db, title) {
  const record = {
    id: crypto.randomUUID(),
    title: title,
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(record);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export function clearTasks(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
