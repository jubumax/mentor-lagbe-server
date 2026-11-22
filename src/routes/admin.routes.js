import { Router } from "express";
import {
    getAdminStats,
    getAdminTuition,
    listAdminTuitions,
    listTransactions,
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
router.get("/tuitions/:id", getAdminTuition);
router.patch("/tuitions/:id/status", updateTuitionStatus);
router.get("/transactions", listTransactions);

export default router;