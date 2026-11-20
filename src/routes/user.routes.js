import { Router } from "express";
import { getMe, updateProfile } from "../controllers/user.controller.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = Router();

router.get("/me", verifyToken, getMe);
router.patch("/profile", verifyToken, updateProfile);

export default router;