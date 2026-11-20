import { MongoClient } from "mongodb";
import { env } from "./env.js";

let client;
let database;

export async function connectDB() {
    if (database) return database;

    if (!env.mongodbUri) {
        throw new Error("MONGODB_URI is missing. Add it to your .env file.");
    }

    client = new MongoClient(env.mongodbUri);
    await client.connect();
    database = client.db(env.dbName);

    await ensureIndexes(database);
    return database;
}

export function getDB() {
    if (!database) {
        throw new Error("Database is not connected. Call connectDB() first.");
    }
    return database;
}

export function collections() {
    const db = getDB();
    return {
        users: db.collection("user"),
        tuitions: db.collection("tuitions"),
        applications: db.collection("applications"),
        payments: db.collection("payments"),
    };
}

async function ensureIndexes(db) {
    await db
        .collection("applications")
        .createIndex({ tuitionId: 1, studentId: 1 }, { unique: true });

    await db.collection("tuitions").createIndex({ status: 1, createdAt: -1 });
}
