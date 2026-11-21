import { Router } from "express";
import {
    applyForTuition,
    cancelApplication,
    checkApplication,
    getMyApplications,
} from "../controllers/application.controller.js";
import { verifyStudent } from "../middlewares/verifyRole.js";

const router = Router();

router.post("/", verifyStudent, applyForTuition);
router.get("/mine", verifyStudent, getMyApplications);
router.get("/check/:tuitionId", verifyStudent, checkApplication);
router.delete("/:id", verifyStudent, cancelApplication);

export default router;