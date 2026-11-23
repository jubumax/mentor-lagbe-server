import { connectDB, collections } from "../config/db.js";
import { initAuth } from "../config/auth.js";
import { env } from "../config/env.js";
import { ACCOUNTS, APPLICATIONS, TUITIONS } from "./data.js";

const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);


async function seedAccounts(auth) {
    const { users } = collections();

    for (const account of ACCOUNTS) {
        const existing = await users.findOne({ email: account.email });

        if (!existing) {
            // Goes through BetterAuth, so the password is hashed the normal way.
            // The sign up rules turn "admin" into "student", so the role is set below.
            await auth.api.signUpEmail({
                body: {
                    name: account.name,
                    email: account.email,
                    password: account.password,
                    role: account.role === "admin" ? "student" : account.role,
                },
            });
            console.log(`  created ${account.role}: ${account.email}`);

        } else {
            console.log(`  exists  ${account.role}: ${account.email}`);
        }

        await users.updateOne(
            { email: account.email },
            {
                $set: {
                    role: account.role,
                    phone: account.phone,
                    bio: account.bio,
                    updatedAt: new Date(),
                },
            }
        );
    }
}


async function seedTuitions() {
    const { users, tuitions } = collections();
    const tutors = new Map();

    for (const tuition of TUITIONS) {
        if (!tutors.has(tuition.tutor)) {
            tutors.set(tuition.tutor, await users.findOne({ email: tuition.tutor }));
        }
        const tutor = tutors.get(tuition.tutor);
        const createdAt = daysAgo(tuition.daysAgo);


        await tuitions.updateOne(
            { title: tuition.title, tutorEmail: tuition.tutor },
            {
                $setOnInsert: {
                    tuitionId: tuition._id,
                    tuitionTitle: tuition.title,
                    subject: tuition.subject,
                    monthlyFee: tuition.monthlyFee,
                    tutorEmail: tuition.tutorEmail,
                    tutorName: tuition.tutorName,
                    studentName: student.name,
                    studentEmail: item.student,
                    studentPhone: student.phone,
                    preferredSchedule: item.schedule,
                    studentNote: item.note,
                    status: item.status,
                    appliedAt: createdAt,
                    updatedAt: createdAt,
                },
            },
            { upsert: true }
        );
    }
    console.log(`  ${TUITIONS.length} tuitions ready`);
}


async function seedApplications() {
    const { users, tuitions, applications } = collections();

    for (const [index, item] of APPLICATIONS.entries()) {
        const student = await users.findOne({ email: item.student });
        const tuition = await tuitions.findOne({ title: item.tuition });
        if (!student || !tuition) continue;

        const createdAt = daysAgo(index);
        await applications.updateOne(
            { tuitionId: tuition._id, studentEmail: item.student },
            {
                $setOnInsert: {
                    tuitionId: tuition._id,
                    tuitionTitle: tuition.title,
                    subject: tuition.subject,
                    monthlyFee: tuition.monthlyFee,
                    tutorEmail: tuition.tutorEmail,
                    tutorName: tuition.tutorName,
                    studentName: student.name,
                    studentEmail: item.student,
                    studentPhone: student.phone,
                    preferredSchedule: item.schedule,
                    studentNote: item.note,
                    status: item.status,
                    appliedAt: createdAt,
                    updatedAt: createdAt,
                },
            },
            { upsert: true }
        );
    }
    console.log(`  ${APPLICATIONS.length} applications ready`);
}


async function main() {
    console.log(`Seeding database "${env.dbName}"...`);
    await connectDB();
    const auth = initAuth();

    console.log("Accounts");
    await seedAccounts(auth);

    console.log("Tuitions");
    await seedTuitions();

    console.log("Applications");
    await seedApplications();

    console.log("\nDone. You can sign in with:");
    ACCOUNTS.forEach(({ role, email, password }) =>
        console.log(`  ${role.padEnd(8)} ${email}  /  ${password}`)
    );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Seeding failed:", error);
        process.exit(1);
    });