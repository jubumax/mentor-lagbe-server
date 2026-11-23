import { collections } from "../config/db.js";
import { buildTuitionQuery } from "../utils/buildTuitionQuery.js";
import { toObjectId } from "../utils/objectId.js";


async function readSavedIds(email) {
    const user = await collections().users.findOne(
        { email },
        { projection: { savedTuitions: 1 } }
    );
    return user?.savedTuitions ?? [];
}

// GET /api/bookmarks/ids (student only) -- just the ids, for the save buttons
export async function getBookmarkIds(req, res) {
    const savedIds = await readSavedIds(req.user.email);
    res.json({ success: true, ids: savedIds.map(String) });
}

// GET /api/bookmarks (student only) -- the saved tuitions that are still public
export async function getBookmarks(req, res) {
    const savedIds = await readSavedIds(req.user.email);
    if (savedIds.length === 0) return res.json({ success: true, tuitions: [] });

    const { filter } = buildTuitionQuery();
    const items = await collections()
        .tuitions.find(
            { ...filter, _id: { $in: savedIds } },
            { projection: { description: 0 } }
        )
        .toArray();

    // Most recently saved first
    const position = new Map(savedIds.map((id, index) => [String(id), index]));
    items.sort((a, b) => position.get(String(b._id)) - position.get(String(a._id)));

    res.json({ success: true, tuitions: items });
}


// POST /api/bookmarks/:tuitionId (student only)
export async function addBookmark(req, res) {
    const tuitionId = toObjectId(req.params.tuitionId);
    const { filter } = buildTuitionQuery();
    const { users, tuitions } = collections();

    const tuition = tuitionId
        ? await tuitions.findOne({ ...filter, _id: tuitionId }, { projection: { _id: 1 } })
        : null;

    if (!tuition) {
        return res
            .status(404)
            .json({ success: false, message: "This tuition is not available." });
    }


    await users.updateOne(
        { email: req.user.email },
        { $addToSet: { savedTuitions: tuitionId } }
    );

    res.status(201).json({ success: true, message: "Tuition saved." });
}


// DELETE /api/bookmarks/:tuitionId (student only)
export async function removeBookmark(req, res) {
    const tuitionId = toObjectId(req.params.tuitionId);
    if (!tuitionId) {
        return res
            .status(404)
            .json({ success: false, message: "Tuition not found." });
    }

    await collections().users.updateOne(
        { email: req.user.email },
        { $pull: { savedTuitions: tuitionId } }
    );

    res.json({ success: true, message: "Removed from saved tuitions." });
}