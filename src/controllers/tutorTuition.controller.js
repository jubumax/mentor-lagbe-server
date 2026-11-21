import { collections } from "../config/db.js";
import {
    APPROVAL_STATUS,
    FREE_TUITION_LIMIT,
    PLANS,
} from "../config/constants.js";
import { toObjectId } from "../utils/objectId.js";
import { validateTuitionInput } from "../utils/validators.js";


function notFound(res) {
    return res.status(404).json({ success: false, message: "Tuition not found." });
}

// Finds a tuition only if it belongs to the signed-in tutor.
async function findOwnTuition(req) {
    const id = toObjectId(req.params.id);
    if (!id) return { id: null, tuition: null };

    const tuition = await collections().tuitions.findOne({
        _id: id,
        tutorEmail: req.user.email,
    });
    return { id, tuition };
}

// GET /api/tuitions/mine (tutor only)
export async function getMyTuitions(req, res) {
    const { tuitions, applications } = collections();

    const [items, applicantCounts] = await Promise.all([
        tuitions
            .find({ tutorEmail: req.user.email }, { projection: { description: 0 } })
            .sort({ createdAt: -1, _id: -1 })
            .toArray(),
        applications
            .aggregate([
                { $match: { tutorEmail: req.user.email } },
                { $group: { _id: "$tuitionId", count: { $sum: 1 } } },
            ])
            .toArray(),
    ]);

    const countByTuition = new Map(
        applicantCounts.map(({ _id, count }) => [String(_id), count])
    );

    res.json({
        success: true,
        tuitions: items.map((tuition) => ({
            ...tuition,
            applicantCount: countByTuition.get(String(tuition._id)) ?? 0,
        })),
        usage: {
            posted: items.length,
            limit: req.user.plan === PLANS.PRO ? null : FREE_TUITION_LIMIT,
        },
    });
}

// GET /api/tuitions/mine/:id (tutor only)
export async function getMyTuitionById(req, res) {
    const { tuition } = await findOwnTuition(req);
    if (!tuition) return notFound(res);

    res.json({ success: true, tuition });
}


// PUT /api/tuitions/:id (tutor & owner only)
export async function updateTuition(req, res) {
    const { errors, values } = validateTuitionInput(req.body);

    if (Object.keys(errors).length > 0) {
        return res
            .status(400)
            .json({ success: false, message: "Please fix the highlighted fields.", errors });
    }

    const { id, tuition } = await findOwnTuition(req);
    if (!tuition) return notFound(res);

    const changes = { ...values, updatedAt: new Date() };

    // A rejected tuition goes back to the admin when the tutor fixes and resubmits it.
    if (tuition.approvalStatus === APPROVAL_STATUS.REJECTED) {
        changes.approvalStatus = APPROVAL_STATUS.PENDING;
    }

    const { tuitions } = collections();
    await tuitions.updateOne({ _id: id }, { $set: changes });
    const updated = await tuitions.findOne({ _id: id });

    res.json({
        success: true,
        message:
            changes.approvalStatus === APPROVAL_STATUS.PENDING
                ? "Tuition updated and sent for review again."
                : "Tuition updated.",
        tuition: updated,
    });
}


// PATCH /api/tuitions/:id/toggle (tutor & owner only)
export async function toggleTuition(req, res) {
    const { id, tuition } = await findOwnTuition(req);
    if (!tuition) return notFound(res);

    const isActive = !tuition.isActive;
    await collections().tuitions.updateOne(
        { _id: id },
        { $set: { isActive, updatedAt: new Date() } }
    );

    res.json({
        success: true,
        message: isActive ? "Tuition is open for applications." : "Tuition is closed.",
        isActive,
    });
}


// DELETE /api/tuitions/:id (tutor & owner only)
export async function deleteTuition(req, res) {
    const { id, tuition } = await findOwnTuition(req);
    if (!tuition) return notFound(res);

    const { tuitions, applications } = collections();
    await tuitions.deleteOne({ _id: id });

    await applications.deleteMany({ tuitionId: id });

    res.json({ success: true, message: "Tuition deleted." });
}