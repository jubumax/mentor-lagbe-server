import { Router } from "express";
import { createCheckoutSession } from "../controllers/payment.controller.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = Router();

router.post("/checkout", verifyToken, createCheckoutSession);

export default router;