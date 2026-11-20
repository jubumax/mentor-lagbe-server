import { Router } from "express";
import { getDB } from "../config/db.js";

const router = Router();

router.get("/health", async (req, res) => {
    await getDB().command({ ping: 1 });
    res.json({ success: true, message: "Server and database are healthy" });
});

export default router;