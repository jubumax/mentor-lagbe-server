import { collections } from "../config/db.js";
import { APPLICATION_STATUS, PLANS } from "../config/constants.js";
import { toObjectId } from "../utils/objectId.js";

const DECISIONS = [APPLICATION_STATUS.ACCEPTED, APPLICATION_STATUS.REJECTED];
const ALL_STATUSES = Object.values(APPLICATION_STATUS);


// GET /api/applications/tutor (tutor only)
// Applications for this tutor's tuitions. Pro students are listed first.

export async function getTutorApplications(req, res) {
    const match = { tutorEmail: req.user.email };

    if (req.query.status && ALL_STATUSES.includes(req.query.status)) {
        match.status = req.query.status;
    }

    if (req.query.tuitionId) {
        const tuitionId = toObjectId(String(req.query.tuitionId));
        if (!tuitionId) return res.json({ success: true, applications: [] });
        match.tuitionId = tuitionId;
    }

    const applications = await collections()
        .applications.aggregate([
            { $match: match },
            {
                $lookup: {
                    from: "user",
                    localField: "studentEmail",
                    foreignField: "email",
                    as: "student",
                },
            },
            {
                $addFields: {
                    studentPlan: {
                        $ifNull: [{ $arrayElemAt: ["$student.plan", 0] }, PLANS.FREE],
                    },
                    studentImage: { $arrayElemAt: ["$student.image", 0] },
                },
            },
            {
                $addFields: {
                    priority: { $cond: [{ $eq: ["$studentPlan", PLANS.PRO] }, 1, 0] },
                },
            },
            { $sort: { priority: -1, createdAt: -1, _id: -1 } },
            { $project: { student: 0, priority: 0 } },
        ])
        .toArray();

    res.json({ success: true, applications });
}


// PATCH /api/applications/:id/status (tutor only) -- accept or reject
export async function decideApplication(req, res) {
    const id = toObjectId(req.params.id);
    const status = String(req.body?.status ?? "");

    if (!DECISIONS.includes(status)) {
        return res.status(400).json({
            success: false,
            message: "Status must be either accepted or rejected.",
        });
    }

    const { applications } = collections();
    const application = id
        ? await applications.findOne({ _id: id, tutorEmail: req.user.email })
        : null;

    if (!application) {
        return res
            .status(404)
            .json({ success: false, message: "Application not found." });
    }

    await applications.updateOne(
        { _id: id },
        { $set: { status, updatedAt: new Date() } }
    );

    res.json({
        success: true,
        message:
            status === APPLICATION_STATUS.ACCEPTED
                ? "Application accepted."
                : "Application rejected.",
        status,
    });
}