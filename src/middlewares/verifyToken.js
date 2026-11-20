import { collections } from "../config/db.js";
import { verifyJwt } from "../utils/jwt.js";

function unauthorized(res, message) {
    return res.status(401).json({ success: false, message });
}

export async function verifyToken(req, res, next) {
    const [scheme, token] = (req.headers.authorization ?? "").split(" ");

    if (scheme !== "Bearer" || !token) {
        return unauthorized(res, "Authorization token is missing.");
    }

    let payload;
    try {
        payload = verifyJwt(token);
    } catch {
        return unauthorized(res, "Your session has expired. Please sign in again.");
    }

    const user = await collections().users.findOne({ email: payload.email });
    if (!user) {
        return unauthorized(res, "Account not found. Please sign in again.");
    }

    req.user = {
        id: String(user._id),
        name: user.name,
        email: user.email,
        image: user.image ?? null,
        role: user.role ?? "student",
        plan: user.plan ?? "free",
    };

    next();
}