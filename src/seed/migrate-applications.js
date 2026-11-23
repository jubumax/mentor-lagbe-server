import { connectDB, collections } from "../config/db.js";

async function main() {
    await connectDB();
    const { applications, tuitions } = collections();

    // Rename the old field names
    const renamed = await applications.updateMany(
        {},
        {
            $rename: {
                phone: "studentPhone",
                learningNote: "studentNote",
                createdAt: "appliedAt",
            },
        }
    );
    console.log(`Checked ${renamed.matchedCount} applications for old field names`);

    // Copy the monthly fee from each application's tuition
    const missing = await applications.find({ monthlyFee: { $exists: false } }).toArray();
    let filled = 0;

    for (const application of missing) {
        const tuition = await tuitions.findOne(
            { _id: application.tuitionId },
            { projection: { monthlyFee: 1 } }
        );

        if (tuition) {
            await applications.updateOne(
                { _id: application._id },
                { $set: { monthlyFee: tuition.monthlyFee } }
            );

            filled++;
        }
    }
    console.log(`Added monthlyFee to ${filled} applications`);
}


main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Migration failed:", error);
        process.exit(1);
    });