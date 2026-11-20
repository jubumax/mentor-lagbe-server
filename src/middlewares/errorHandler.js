import { env } from "../config/env.js";

export function errorHandler(err, req, res, next) {
    const status = err.status ?? err.statusCode ?? 500;

    if (status >= 500) console.error(err);

    res.status(status).json({
        success: false,
        message:
            status >= 500 && env.nodeEnv === "production"
                ? "Internal server error"
                : err.message || "Internal server error",
    });
}