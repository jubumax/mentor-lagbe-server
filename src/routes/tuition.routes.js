import { Router } from "express";
import {
    createTuition,
    getFeaturedTuitions,
    getTuitionById,
    listTuitions,
} from "../controllers/tuition.controller.js";
import {
    deleteTuition,
    getMyTuitionById,
    getMyTuitions,
    toggleTuition,
    updateTuition,
} from "../controllers/tutorTuition.controller.js";
import { verifyTutor } from "../middlewares/verifyRole.js";

const router = Router();


// Public
router.get("/", listTuitions);
router.get("/featured", getFeaturedTuitions);

// Tutor only -- These fixed paths must come before "/:id".
router.post("/", verifyTutor, createTuition);
router.get("/mine", verifyTutor, getMyTuitions);
router.get("/mine/:id", verifyTutor, getMyTuitionById);

// Public details - then the tutor actions on a single tuition
router.get("/:id", getTuitionById);
router.put("/:id", verifyTutor, updateTuition);
router.patch("/:id/toggle", verifyTutor, toggleTuition);
router.delete("/:id", verifyTutor, deleteTuition);

export default router;