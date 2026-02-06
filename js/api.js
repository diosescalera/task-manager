import * as db from "./db.js?v=2";

export async function createTask(title, description) {
  if (!title || typeof title !== "string" || title.trim() === "") {
    throw new Error("Task title is required.");
  }

  const normalizedDescription = typeof description === "string" ? description : "";

  const database = await db.getDatabase();
  await db.addTask(database, title.trim(), normalizedDescription.trim());
}

export async function getTasks() {
  const database = await db.getDatabase();
  const records = await db.getTasks(database);
  return records.map(record => ({
    id: record.id,
    title: record.title,
    description: record.description
  }));
}

export async function deleteTask(id) {
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!id || typeof id !== "string" || !uuidV4Regex.test(id)) {
    throw new Error("Invalid task ID.");
  }

  const database = await db.getDatabase();
  await db.deleteTask(database, id.toLowerCase());
}
