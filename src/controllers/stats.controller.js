import { collections } from "../config/db.js";
import { APPROVAL_STATUS, ROLES } from "../config/constants.js";

// GET /api/stats/public: simple counters for the home page
export async function getPublicStats(req, res) {
    const { users, tuitions, applications } = collections();

    const [tutors, students, liveTuitions, sentApplications] = await Promise.all([
        users.countDocuments({ role: ROLES.TUTOR }),
        users.countDocuments({ role: ROLES.STUDENT }),
        tuitions.countDocuments({
            approvalStatus: APPROVAL_STATUS.APPROVED,
            isActive: true,
        }),
        applications.countDocuments({}),
    ]);

    res.json({
        success: true,
        stats: {
            tutors,
            students,
            tuitions: liveTuitions,
            applications: sentApplications,
        },
    });
}