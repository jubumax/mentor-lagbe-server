import { Router } from "express";
import { createTuition } from "../controllers/tuition.controller.js";
import { verifyTutor } from "../middlewares/verifyRole.js";

const router = Router();

router.post("/", verifyTutor, createTuition);

export default router;