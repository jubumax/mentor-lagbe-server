import app from "./app.js";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { initAuth } from "./config/auth.js";

async function start() {

  try {
    await connectDB();
    console.log(`MongoDB connected: ${env.dbName}`);

    initAuth();

    app.listen(env.port, () => {
      console.log(`MentorLagbe server listening on http://localhost:${env.port}`);
    });
    
  } catch (error) {
    console.error("Failed to start the server:", error.message);
    process.exit(1);
  }
}

start();