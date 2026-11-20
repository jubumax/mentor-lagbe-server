import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

function getSecret() {
    if (!env.jwtSecret) {
        throw new Error("JWT_SECRET is missing. Add it to your .env file.");
    }
    return env.jwtSecret;
}

export function signToken(payload) {
    return jwt.sign(payload, getSecret(), { expiresIn: env.jwtExpiresIn });
}

export function verifyJwt(token) {
    return jwt.verify(token, getSecret());
}