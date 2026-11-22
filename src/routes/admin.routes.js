import { Router } from "express";
import {
    getAdminStats,
    listAdminTuitions,
    listUsers,
    updateTuitionStatus,
    updateUserRole,
} from "../controllers/admin.controller.js";
import { verifyAdmin } from "../middlewares/verifyRole.js";

const router = Router();

router.use(verifyAdmin);

router.get("/stats", getAdminStats);
router.get("/users", listUsers);
router.patch("/users/:id/role", updateUserRole);
router.get("/tuitions", listAdminTuitions);
router.patch("/tuitions/:id/status", updateTuitionStatus);

export default router;