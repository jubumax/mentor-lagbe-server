import { Router } from "express";
import {
    createCheckoutSession,
    verifyPayment,
} from "../controllers/payment.controller.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = Router();

router.post("/checkout", verifyToken, createCheckoutSession);
router.post("/verify", verifyToken, verifyPayment);

export default router;