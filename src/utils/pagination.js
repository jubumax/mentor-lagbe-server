function toPositiveInt(value, fallback) {
    const number = Number.parseInt(value, 10);
    return Number.isFinite(number) && number > 0 ? number : fallback;
}

// Reads ?page and ?limit from the query string, with safe defaults and a maximum
export function parsePagination(query, { defaultLimit = 9, maxLimit = 24 } = {}) {
    const page = toPositiveInt(query.page, 1);
    const limit = Math.min(toPositiveInt(query.limit, defaultLimit), maxLimit);

    return { page, limit, skip: (page - 1) * limit };
}

export function buildPagination(total, page, limit) {
    const totalPages = Math.max(Math.ceil(total / limit), 1);

    return {
        page,
        limit,
        total,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages,
    };
}