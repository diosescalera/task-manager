import * as db from "./db.js";

export async function createTask(title) {
  if (!title || typeof title !== "string" || title.trim() === "") {
    throw new Error("Task title is required.");
  }

  const database = await db.getDatabase();
  await db.addTask(database, title.trim());
}

export async function getTasks() {
  const database = await db.getDatabase();
  const records = await db.getTasks(database);
  return records.map(record => ({
    id: record.id,
    title: record.title
  }));
}

export async function clearTasks() {
  const database = await db.getDatabase();
  await db.clearTasks(database);
}
