import { APPROVAL_STATUS } from "../config/constants.js";

const SORT_OPTIONS = {
    newest: { createdAt: -1, _id: -1 },
    fee_asc: { monthlyFee: 1, _id: -1 },
    fee_desc: { monthlyFee: -1, _id: -1 },
};

function firstValue(value) {
    return Array.isArray(value) ? value[0] : value;
}

function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}


export function buildTuitionQuery(query = {}) {
    const filter = {
        approvalStatus: APPROVAL_STATUS.APPROVED,
        isActive: true,
    };

    const subject = String(firstValue(query.subject) ?? "").trim();
    const classLevel = String(firstValue(query.classLevel) ?? "").trim();
    const mode = String(firstValue(query.mode) ?? "").trim();

    if (subject) filter.subject = subject;
    if (classLevel) filter.classLevel = classLevel;
    if (mode) filter.mode = mode;

    const search = String(firstValue(query.search) ?? "").trim().slice(0, 100);
    if (search) {
        const pattern = new RegExp(escapeRegex(search), "i");
        filter.$or = [{ title: pattern }, { subject: pattern }];
    }

    const sort = SORT_OPTIONS[firstValue(query.sort)] ?? SORT_OPTIONS.newest;

    return { filter, sort };
}