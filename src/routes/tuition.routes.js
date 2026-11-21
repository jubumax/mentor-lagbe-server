import { Router } from "express";
import { createTuition, listTuitions } from "../controllers/tuition.controller.js";
import { verifyTutor } from "../middlewares/verifyRole.js";

const router = Router();

router.get("/", listTuitions);
router.post("/", verifyTutor, createTuition);

export default router;