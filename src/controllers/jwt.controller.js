import { fromNodeHeaders } from "better-auth/node";
import { getAuth } from "../config/auth.js";
import { signToken } from "../utils/jwt.js";


export async function issueToken(req, res) {
    const session = await getAuth().api.getSession({
        headers: fromNodeHeaders(req.headers),
    });

    if (!session?.user) {
        return res
            .status(401)
            .json({ success: false, message: "Please sign in first." });
    }

    const token = signToken({ id: session.user.id, email: session.user.email });
    res.json({ success: true, token });
}

export function currentUser(req, res) {
    res.json({ success: true, user: req.user });
}