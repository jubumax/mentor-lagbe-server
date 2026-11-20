import { ROLES } from "../config/constants.js";
import { verifyToken } from "./verifyToken.js";


export function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res
                .status(401)
                .json({ success: false, message: "Authorization token is missing." });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. This action is only for ${allowedRoles.join(" or ")} accounts.`,
            });
        }

        next();
    };
}

export const verifyStudent = [verifyToken, requireRole(ROLES.STUDENT)];
export const verifyTutor = [verifyToken, requireRole(ROLES.TUTOR)];
export const verifyAdmin = [verifyToken, requireRole(ROLES.ADMIN)];