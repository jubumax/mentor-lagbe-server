import { Router } from "express";
import { currentUser, issueToken } from "../controllers/jwt.controller.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = Router();

router.post("/", issueToken);
router.get("/verify", verifyToken, currentUser);

export default router;