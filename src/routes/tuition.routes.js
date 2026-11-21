import { Router } from "express";
import {
    createTuition,
    getFeaturedTuitions,
    getTuitionById,
    listTuitions,
} from "../controllers/tuition.controller.js";
import { verifyTutor } from "../middlewares/verifyRole.js";

const router = Router();

router.get("/", listTuitions);
router.post("/", verifyTutor, createTuition);

router.get("/featured", getFeaturedTuitions);
router.get("/:id", getTuitionById);

export default router;