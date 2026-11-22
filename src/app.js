import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { corsOptions } from "./config/cors.js";
import { getAuth } from "./config/auth.js";
import { handleStripeWebhook } from "./controllers/payment.controller.js";
import routes from "./routes/index.js";
import { notFound } from "./middlewares/notFound.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

app.use(cors(corsOptions));

let authHandler;
app.all("/api/auth/*splat", (req, res, next) => {
    authHandler ??= toNodeHandler(getAuth());
    return authHandler(req, res, next);
});

// Stripe signs the raw body, so this route must also come before express.json()
app.post(
    "/api/payments/webhook",
    express.raw({ type: "application/json" }),
    handleStripeWebhook
);

app.use(express.json());

app.get("/", (req, res) => {
    res.json({ success: true, message: "MentorLagbe server is running" });
});

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

export default app;