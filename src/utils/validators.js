import {
    CLASS_LEVELS,
    SUBJECTS,
    TUITION_MODES,
} from "../config/constants.js";


export function isHttpsUrl(value) {
    try {
        return new URL(value).protocol === "https:";
    } catch {
        return false;
    }
}


export function validateTuitionInput(body = {}) {
    const errors = {};

    const title = String(body.title ?? "").trim();
    if (title.length < 5) errors.title = "Title must be at least 5 characters.";
    else if (title.length > 120) errors.title = "Title can be at most 120 characters.";

    const subject = String(body.subject ?? "").trim();
    if (!SUBJECTS.includes(subject)) errors.subject = "Please choose a subject.";

    const classLevel = String(body.classLevel ?? "").trim();
    if (!CLASS_LEVELS.includes(classLevel)) {
        errors.classLevel = "Please choose a class level.";
    }

    const mode = String(body.mode ?? "").trim();
    if (!TUITION_MODES.includes(mode)) errors.mode = "Choose Online or Offline.";

    let location = String(body.location ?? "").trim();
    if (mode === "Online") {
        location = "Online";
    } else if (mode === "Offline" && location.length < 3) {
        errors.location = "Please enter the location for offline classes.";
    }

    const monthlyFee = Number(body.monthlyFee);
    if (!Number.isFinite(monthlyFee) || monthlyFee <= 0) {
        errors.monthlyFee = "Enter a monthly fee greater than 0.";
    } else if (monthlyFee > 1000000) {
        errors.monthlyFee = "Monthly fee is too large.";
    }

    const daysPerWeek = Number(body.daysPerWeek);
    if (!Number.isInteger(daysPerWeek) || daysPerWeek < 1 || daysPerWeek > 7) {
        errors.daysPerWeek = "Days per week must be between 1 and 7.";
    }

    const description = String(body.description ?? "").trim();
    if (description.length < 50) {
        errors.description = "Description must be at least 50 characters.";
    } else if (description.length > 2000) {
        errors.description = "Description can be at most 2000 characters.";
    }

    const bannerImage = String(body.bannerImage ?? "").trim();
    if (bannerImage && !isHttpsUrl(bannerImage)) {
        errors.bannerImage = "Banner image must be a valid https link.";
    }

    return {
        errors,
        values: {
            title,
            subject,
            classLevel,
            mode,
            location,
            monthlyFee,
            daysPerWeek,
            description,
            bannerImage: bannerImage || null,
        },
    };
}