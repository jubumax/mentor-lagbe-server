import { Router } from "express";
import { getDB } from "../config/db.js";
import jwtRoutes from "./jwt.routes.js";
import userRoutes from "./user.routes.js";
import tuitionRoutes from "./tuition.routes.js";

const router = Router();

router.get("/health", async (req, res) => {
    await getDB().command({ ping: 1 });
    res.json({ success: true, message: "Server and database are healthy" });
});

router.use("/jwt", jwtRoutes);
router.use("/users", userRoutes);
router.use("/tuitions", tuitionRoutes);

export default router;