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
    const applications = db.collection("applications");

    await applications.dropIndex("tuitionId_1_studentId_1").catch(() => { });

    // A student can apply to the same tuition only once
    await applications.createIndex(
        { tuitionId: 1, studentEmail: 1 },
        { unique: true }
    );

    await db.collection("tuitions").dropIndex("status_1_createdAt_-1").catch(() => { });

    await db
        .collection("tuitions")
        .createIndex({ approvalStatus: 1, isActive: 1, createdAt: -1 });

    await db.collection("tuitions").createIndex({ tutorEmail: 1, createdAt: -1 });

    // Each Stripe session is recorded once, even if it is reported twice
    await db
        .collection("payments")
        .createIndex({ stripeSessionId: 1 }, { unique: true });
    await db.collection("payments").createIndex({ paidAt: -1 });
}
