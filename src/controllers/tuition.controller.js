import { ObjectId } from "mongodb";
import { collections } from "../config/db.js";
import {
    APPROVAL_STATUS,
    FREE_TUITION_LIMIT,
    PLANS,
} from "../config/constants.js";
import { validateTuitionInput } from "../utils/validators.js";
import { buildPagination, parsePagination } from "../utils/pagination.js";
import { buildTuitionQuery } from "../utils/buildTuitionQuery.js";

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;
const FEATURED_COUNT = 6;


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

// GET /api/tuitions/featured (public) -- the latest approved and active tuitions
export async function getFeaturedTuitions(req, res) {
    const { filter } = buildTuitionQuery();
    const { tuitions } = collections();

    const items = await tuitions
        .find(filter, { projection: { description: 0 } })
        .sort({ createdAt: -1, _id: -1 })
        .limit(FEATURED_COUNT)
        .toArray();

    res.json({ success: true, tuitions: items });
}


// GET /api/tuitions/:id (public) -- one approved tuition with a short tutor profile
export async function getTuitionById(req, res) {
    const { id } = req.params;

    if (!OBJECT_ID_PATTERN.test(id)) {
        return res
            .status(404)
            .json({ success: false, message: "Tuition not found." });
    }

    const { filter } = buildTuitionQuery();
    const { tuitions, users } = collections();

    const tuition = await tuitions.findOne({ ...filter, _id: new ObjectId(id) });
    if (!tuition) {
        return res
            .status(404)
            .json({ success: false, message: "Tuition not found." });
    }

    const tutor = await users.findOne(
        { email: tuition.tutorEmail },
        { projection: { name: 1, email: 1, image: 1, bio: 1, plan: 1 } }
    );

    res.json({
        success: true,
        tuition,
        // Phone numbers are never exposed here
        tutor: tutor
            ? {
                name: tutor.name,
                email: tutor.email,
                image: tutor.image ?? null,
                bio: tutor.bio ?? "",
                plan: tutor.plan ?? PLANS.FREE,
            }
            : null,
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