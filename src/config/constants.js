export const ROLES = {
    STUDENT: "student",
    TUTOR: "tutor",
    ADMIN: "admin",
};

export const SELF_SERVICE_ROLES = [ROLES.STUDENT, ROLES.TUTOR];

export const PLANS = {
    FREE: "free",
    PRO: "pro",
};

export const SUBJECTS = [
    "Mathematics",
    "Statistics",
    "Physics",
    "Chemistry",
    "Biology",
    "English",
    "Bangla",
    "ICT",
    "Programming",
    "Web Development",
    "Data Science",
    "IELTS",
    "Accounting",
    "Economics",
    "Creative Writing",
];

export const CLASS_LEVELS = [
    "Class 1-5",
    "Class 6-8",
    "SSC",
    "HSC",
    "O-Level",
    "A-Level",
    "University",
    "Professional",
];

export const TUITION_MODES = ["Online", "Offline"];
export const FREE_TUITION_LIMIT = 2;


export const APPROVAL_STATUS = {
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
};

export const APPLICATION_STATUS = {
    PENDING: "pending",
    ACCEPTED: "accepted",
    REJECTED: "rejected",
};

// One-time Pro plan prices in US dollars, decided by the buyer's role.
export const PRO_PLANS = {
    [ROLES.TUTOR]: { name: "Pro Tutor Plan", amount: 15 },
    [ROLES.STUDENT]: { name: "Pro Student Plan", amount: 10 },
};

