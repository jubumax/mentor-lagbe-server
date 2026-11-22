// Vercel runs this file for every request. 
// The database connection and the auth setup are cached, so only the first request after a cold start pays for them.

import app from "../src/app.js";
import { connectDB } from "../src/config/db.js";
import { initAuth } from "../src/config/auth.js";


export default async function handler(req, res) {
    try {
        await connectDB();
        initAuth();

    } catch (error) {
        console.error("Startup failed:", error);

        return res
            .status(500)
            .json({ success: false, message: "The server could not start." });
    }

    return app(req, res);
}