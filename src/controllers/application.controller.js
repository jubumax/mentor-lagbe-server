import { collections } from "../config/db.js";
import { APPLICATION_STATUS } from "../config/constants.js";
import { buildTuitionQuery } from "../utils/buildTuitionQuery.js";
import { toObjectId } from "../utils/objectId.js";

const PHONE_PATTERN = /^\+?[0-9\s-]{7,15}$/;


function validateApplicationInput(body = {}) {
    const errors = {};

    const phone = String(body.phone ?? "").trim();
    if (!PHONE_PATTERN.test(phone)) errors.phone = "Enter a valid phone number.";

    const preferredSchedule = String(body.preferredSchedule ?? "").trim();
    if (preferredSchedule.length < 3) {
        errors.preferredSchedule = "Please choose or describe your preferred schedule.";
    } else if (preferredSchedule.length > 100) {
        errors.preferredSchedule = "Preferred schedule can be at most 100 characters.";
    }

    const learningNote = String(body.learningNote ?? "").trim();
    if (learningNote.length > 500) {
        errors.learningNote = "Note can be at most 500 characters.";
    }

    return { errors, values: { phone, preferredSchedule, learningNote } };
}


// POST /api/applications (student only)
export async function applyForTuition(req, res) {
    const tuitionId = toObjectId(req.body?.tuitionId);
    const { errors, values } = validateApplicationInput(req.body);
    if (!tuitionId) errors.tuitionId = "Choose a valid tuition.";

    if (Object.keys(errors).length > 0) {
        return res
            .status(400)
            .json({ success: false, message: "Please fix the highlighted fields.", errors });
    }

    const { tuitions, applications } = collections();


    const { filter } = buildTuitionQuery();
    const tuition = await tuitions.findOne({ ...filter, _id: tuitionId });
    if (!tuition) {
        return res.status(404).json({
            success: false,
            message: "This tuition is no longer available.",
        });
    }

    const alreadyApplied = await applications.findOne(
        { tuitionId, studentEmail: req.user.email },
        { projection: { _id: 1 } }
    );
    if (alreadyApplied) {
        return res.status(409).json({
            success: false,
            message: "You have already applied for this tuition.",
        });
    }


    const now = new Date();
    const application = {
        tuitionId,
        tuitionTitle: tuition.title,
        subject: tuition.subject,
        monthlyFee: tuition.monthlyFee,
        tutorEmail: tuition.tutorEmail,
        tutorName: tuition.tutorName,
        studentName: req.user.name,
        studentEmail: req.user.email,
        studentPhone: values.phone,
        preferredSchedule: values.preferredSchedule,
        studentNote: values.learningNote,
        status: APPLICATION_STATUS.PENDING,
        appliedAt: now,
        updatedAt: now,
    };

    try {
        const { insertedId } = await applications.insertOne(application);

        res.status(201).json({
            success: true,
            message: "Application sent. The tutor will review it soon.",
            application: { _id: insertedId, ...application },
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "You have already applied for this tuition.",
            });
        }
        throw error;
    }
}


// GET /api/applications/mine (student only)
export async function getMyApplications(req, res) {
    const { applications } = collections();

    const items = await applications
        .find({ studentEmail: req.user.email })
        .sort({ appliedAt: -1, _id: -1 })
        .toArray();

    res.json({ success: true, applications: items });
}


// GET /api/applications/check/:tuitionId (student only)
export async function checkApplication(req, res) {
    const tuitionId = toObjectId(req.params.tuitionId);

    if (!tuitionId) {
        return res.json({ success: true, applied: false, application: null });
    }

    const application = await collections().applications.findOne(
        { tuitionId, studentEmail: req.user.email },
        { projection: { status: 1, createdAt: 1 } }
    );

    res.json({ success: true, applied: Boolean(application), application });
}


// DELETE /api/applications/:id (student & pending applications only)
export async function cancelApplication(req, res) {
    const id = toObjectId(req.params.id);
    const { applications } = collections();

    const application = id
        ? await applications.findOne({ _id: id, studentEmail: req.user.email })
        : null;

    if (!application) {
        return res
            .status(404)
            .json({ success: false, message: "Application not found." });
    }

    if (application.status !== APPLICATION_STATUS.PENDING) {
        return res.status(409).json({
            success: false,
            message: "Only pending applications can be cancelled.",
        });
    }

    await applications.deleteOne({ _id: id });
    res.json({ success: true, message: "Application cancelled." });
}