import * as db from "./db.js?v=3";

function validateISODate(dateStr) {
  if (!dateStr) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new Error("Invalid format for date");
  }

  const [year, month, day] = dateStr.split("-").map(Number);

  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error("Invalid date");
  }

  return dateStr;
}

export async function createTask(title, description, date) {
  if (!title || typeof title !== "string" || title.trim() === "") {
    throw new Error("Task title is required.");
  }

  const normalizedDescription = typeof description === "string" ? description : "";

  const cleanDate = validateISODate(date);

  const database = await db.getDatabase();
  await db.addTask(database, title.trim(), normalizedDescription.trim(), cleanDate);
}

export async function getTasks() {
  const database = await db.getDatabase();
  const records = await db.getTasks(database);
  return records.map(record => ({
    id: record.id,
    title: record.title,
    description: record.description,
    date: record.date
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
