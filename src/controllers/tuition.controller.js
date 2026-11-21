import { collections } from "../config/db.js";
import {
    APPROVAL_STATUS,
    FREE_TUITION_LIMIT,
    PLANS,
} from "../config/constants.js";
import { validateTuitionInput } from "../utils/validators.js";
import { buildPagination, parsePagination } from "../utils/pagination.js";
import { buildTuitionQuery } from "../utils/buildTuitionQuery.js";

// GET /api/tuitions (public) -- search, filter and paginate approved tuitions
export async function listTuitions(req, res) {
    const { filter, sort } = buildTuitionQuery(req.query);
    const { page, limit, skip } = parsePagination(req.query);
    const { tuitions } = collections();

    const [items, total] = await Promise.all([
        tuitions
            .find(filter, { projection: { description: 0 } })
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .toArray(),
        tuitions.countDocuments(filter),
    ]);

    res.json({
        success: true,
        tuitions: items,
        pagination: buildPagination(total, page, limit),
    });
}

// POST /api/tuitions (tutor only)
export async function createTuition(req, res) {
    const { errors, values } = validateTuitionInput(req.body);

    if (Object.keys(errors).length > 0) {
        return res
            .status(400)
            .json({ success: false, message: "Please fix the highlighted fields.", errors });
    }

    const { tuitions } = collections();

    if (req.user.plan !== PLANS.PRO) {
        const posted = await tuitions.countDocuments({ tutorEmail: req.user.email });
        if (posted >= FREE_TUITION_LIMIT) {
            return res.status(403).json({
                success: false,
                message: `Free plan allows up to ${FREE_TUITION_LIMIT} tuition posts. Upgrade to Pro for unlimited posts.`,
            });
        }
    }

    const now = new Date();
    const tuition = {
        ...values,
        tutorName: req.user.name,
        tutorEmail: req.user.email,
        approvalStatus: APPROVAL_STATUS.PENDING,
        isActive: true,
        createdAt: now,
        updatedAt: now,
    };

    const { insertedId } = await tuitions.insertOne(tuition);

    res.status(201).json({
        success: true,
        message: "Tuition submitted. It will appear publicly once an admin approves it.",
        tuition: { _id: insertedId, ...tuition },
    });
}