import { Router } from "express";
import {
    applyForTuition,
    cancelApplication,
    checkApplication,
    getMyApplications,
} from "../controllers/application.controller.js";
import {
    decideApplication,
    getTutorApplications,
} from "../controllers/tutorApplication.controller.js";
import { verifyStudent, verifyTutor } from "../middlewares/verifyRole.js";

const router = Router();

// Student
router.post("/", verifyStudent, applyForTuition);
router.get("/mine", verifyStudent, getMyApplications);
router.get("/check/:tuitionId", verifyStudent, checkApplication);
router.delete("/:id", verifyStudent, cancelApplication);

// Tutor
router.get("/tutor", verifyTutor, getTutorApplications);
router.patch("/:id/status", verifyTutor, decideApplication);

export default router;