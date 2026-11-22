import { collections } from "../config/db.js";
import { APPROVAL_STATUS, ROLES } from "../config/constants.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import { toObjectId } from "../utils/objectId.js";
import { buildPagination, parsePagination } from "../utils/pagination.js";

const ALL_ROLES = Object.values(ROLES);
const TUITION_DECISIONS = [APPROVAL_STATUS.APPROVED, APPROVAL_STATUS.REJECTED];


function firstValue(value) {
    return Array.isArray(value) ? value[0] : value;
}


function userIdFilter(id) {
    const objectId = toObjectId(id);
    const options = [{ _id: id }];
    if (objectId) options.push({ _id: objectId });
    return { $or: options };
}


// GET /api/admin/stats
export async function getAdminStats(req, res) {
    const { users, tuitions, payments } = collections();

    const [
        totalUsers,
        totalTutors,
        totalStudents,
        pending,
        approved,
        rejected,
        revenue,
    ] = await Promise.all([
        users.countDocuments({}),
        users.countDocuments({ role: ROLES.TUTOR }),
        users.countDocuments({ role: ROLES.STUDENT }),
        tuitions.countDocuments({ approvalStatus: APPROVAL_STATUS.PENDING }),
        tuitions.countDocuments({ approvalStatus: APPROVAL_STATUS.APPROVED }),
        tuitions.countDocuments({ approvalStatus: APPROVAL_STATUS.REJECTED }),
        payments
            .aggregate([
                { $match: { paymentStatus: "paid" } },
                { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
            ])
            .toArray(),
    ]);

    res.json({
        success: true,
        stats: {
            totalUsers,
            totalTutors,
            totalStudents,
            tuitions: {
                pending,
                approved,
                rejected,
                total: pending + approved + rejected,
            },
            revenue: revenue[0]?.total ?? 0,
            payments: revenue[0]?.count ?? 0,
        },
    });
}

// GET /api/admin/users?search&role&page&limit
export async function listUsers(req, res) {
    const filter = {};

    const role = String(firstValue(req.query.role) ?? "");
    if (ALL_ROLES.includes(role)) filter.role = role;

    const search = String(firstValue(req.query.search) ?? "").trim().slice(0, 100);
    if (search) {
        const pattern = new RegExp(escapeRegex(search), "i");
        filter.$or = [{ name: pattern }, { email: pattern }];
    }

    const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 10, maxLimit: 50 });
    const { users } = collections();

    const [items, total] = await Promise.all([
        users
            .find(filter, {
                projection: { name: 1, email: 1, image: 1, role: 1, plan: 1, createdAt: 1 },
            })
            .sort({ createdAt: -1, _id: -1 })
            .skip(skip)
            .limit(limit)
            .toArray(),
        users.countDocuments(filter),
    ]);

    res.json({
        success: true,
        users: items,
        pagination: buildPagination(total, page, limit),
    });
}


// PATCH /api/admin/users/:id/role
export async function updateUserRole(req, res) {
    const { id } = req.params;
    const role = String(req.body?.role ?? "");

    if (!ALL_ROLES.includes(role)) {
        return res.status(400).json({
            success: false,
            message: "Role must be student, tutor or admin.",
        });
    }

    // Stops an admin from locking themselves out by mistake
    if (id === req.user.id) {
        return res.status(400).json({
            success: false,
            message: "You can't change your own role.",
        });
    }

    const { users } = collections();
    const result = await users.updateOne(userIdFilter(id), {
        $set: { role, updatedAt: new Date() },
    });

    if (result.matchedCount === 0) {
        return res.status(404).json({ success: false, message: "User not found." });
    }

    res.json({ success: true, message: `Role changed to ${role}.`, role });
}


// GET /api/admin/tuitions?status&search&page&limit
export async function listAdminTuitions(req, res) {
    const { tuitions } = collections();
    const filter = {};

    const status = String(firstValue(req.query.status) ?? "");
    if (Object.values(APPROVAL_STATUS).includes(status)) {
        filter.approvalStatus = status;
    }

    const search = String(firstValue(req.query.search) ?? "").trim().slice(0, 100);
    if (search) {
        const pattern = new RegExp(escapeRegex(search), "i");
        filter.$or = [{ title: pattern }, { tutorName: pattern }, { tutorEmail: pattern }];
    }

    const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 10, maxLimit: 50 });

    const [items, total, grouped] = await Promise.all([
        tuitions
            .find(filter, { projection: { description: 0 } })
            .sort({ createdAt: -1, _id: -1 })
            .skip(skip)
            .limit(limit)
            .toArray(),
        tuitions.countDocuments(filter),

        tuitions
            .aggregate([{ $group: { _id: "$approvalStatus", count: { $sum: 1 } } }])
            .toArray(),
    ]);

    const counts = { pending: 0, approved: 0, rejected: 0 };
    grouped.forEach(({ _id, count }) => {
        if (_id in counts) counts[_id] = count;
    });
    counts.all = counts.pending + counts.approved + counts.rejected;

    res.json({
        success: true,
        tuitions: items,
        counts,
        pagination: buildPagination(total, page, limit),
    });
}


// PATCH /api/admin/tuitions/:id/status (approve, reject, revoke or reinstate)
export async function updateTuitionStatus(req, res) {
    const id = toObjectId(req.params.id);
    const status = String(req.body?.status ?? "");

    if (!TUITION_DECISIONS.includes(status)) {
        return res.status(400).json({
            success: false,
            message: "Status must be either approved or rejected.",
        });
    }

    const result = id
        ? await collections().tuitions.updateOne(
            { _id: id },
            { $set: { approvalStatus: status, updatedAt: new Date() } }
        )
        : { matchedCount: 0 };

    if (result.matchedCount === 0) {
        return res.status(404).json({ success: false, message: "Tuition not found." });
    }

    res.json({
        success: true,
        message: status === APPROVAL_STATUS.APPROVED ? "Tuition approved." : "Tuition rejected.",
        approvalStatus: status,
    });
}


// GET /api/admin/tuitions/:id -- one full tuition of any status, for review
export async function getAdminTuition(req, res) {
    const id = toObjectId(req.params.id);
    const tuition = id ? await collections().tuitions.findOne({ _id: id }) : null;

    if (!tuition) {
        return res.status(404).json({ success: false, message: "Tuition not found." });
    }

    res.json({ success: true, tuition });
}

// GET /api/admin/transactions?search&page&limit -- Stripe payment records
export async function listTransactions(req, res) {
    const { payments } = collections();
    const filter = {};

    const search = String(firstValue(req.query.search) ?? "").trim().slice(0, 100);
    if (search) {
        const pattern = new RegExp(escapeRegex(search), "i");
        filter.$or = [{ userName: pattern }, { userEmail: pattern }, { transactionId: pattern }];
    }

    const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 10, maxLimit: 50 });

    const [items, total, revenue] = await Promise.all([
        payments.find(filter).sort({ paidAt: -1, _id: -1 }).skip(skip).limit(limit).toArray(),
        payments.countDocuments(filter),
        payments
            .aggregate([
                { $match: { paymentStatus: "paid" } },
                { $group: { _id: null, total: { $sum: "$amount" } } },
            ])
            .toArray(),
    ]);

    res.json({
        success: true,
        transactions: items,
        totalRevenue: revenue[0]?.total ?? 0,
        pagination: buildPagination(total, page, limit),
    });
}