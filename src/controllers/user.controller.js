import { collections } from "../config/db.js";

const PHONE_PATTERN = /^\+?[0-9\s-]{7,15}$/;
const BIO_MAX_LENGTH = 500;

function isHttpsUrl(value) {
    try {
        return new URL(value).protocol === "https:";
    } catch {
        return false;
    }
}

export function getMe(req, res) {
    res.json({ success: true, user: req.user });
}

export async function updateProfile(req, res) {
    const { name, phone, bio, image } = req.body ?? {};
    const updates = {};
    const errors = {};

    if (name !== undefined) {
        const value = String(name).trim();
        if (value.length < 2) errors.name = "Name must be at least 2 characters";
        else updates.name = value;
    }

    if (phone !== undefined) {
        const value = String(phone).trim();
        if (value && !PHONE_PATTERN.test(value)) {
            errors.phone = "Enter a valid phone number";
        } else {
            updates.phone = value;
        }
    }

    if (bio !== undefined) {
        const value = String(bio).trim();
        if (value.length > BIO_MAX_LENGTH) {
            errors.bio = `Bio can be at most ${BIO_MAX_LENGTH} characters`;
        } else {
            updates.bio = value;
        }
    }

    if (image !== undefined) {
        const value = String(image).trim();
        if (value && !isHttpsUrl(value)) {
            errors.image = "Image must be a valid https link";
        } else {
            updates.image = value || null;
        }
    }

    if (Object.keys(errors).length > 0) {
        return res
            .status(400)
            .json({ success: false, message: "Please fix the highlighted fields.", errors });
    }

    if (Object.keys(updates).length === 0) {
        return res
            .status(400)
            .json({ success: false, message: "There is nothing to update." });
    }


    await collections().users.updateOne(
        { email: req.user.email },
        { $set: { ...updates, updatedAt: new Date() } }
    );

    res.json({
        success: true,
        message: "Profile updated.",
        user: { ...req.user, ...updates },
    });
}