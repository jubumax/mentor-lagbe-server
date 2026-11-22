import { collections } from "../config/db.js";
import { PLANS } from "../config/constants.js";


export async function fulfillCheckoutSession(session) {
    if (session.payment_status !== "paid") return { fulfilled: false, payment: null };

    const email = session.metadata?.userEmail;
    if (!email) return { fulfilled: false, payment: null };

    const { payments, users } = collections();

    let payment = await payments.findOne({ stripeSessionId: session.id });

    if (!payment) {
        payment = {
            userEmail: email,
            userName: session.metadata.userName ?? "",
            userRole: session.metadata.userRole ?? "",
            planName: session.metadata.planName ?? "Pro Plan",
            amount: (session.amount_total ?? 0) / 100,
            currency: session.currency ?? "usd",
            transactionId:
                typeof session.payment_intent === "string"
                    ? session.payment_intent
                    : (session.payment_intent?.id ?? session.id),
            stripeSessionId: session.id,
            paymentStatus: "paid",
            paidAt: new Date(),
        };

        try {
            const { insertedId } = await payments.insertOne(payment);
            payment._id = insertedId;

        } catch (error) {
            if (error.code !== 11000) throw error;
            payment = await payments.findOne({ stripeSessionId: session.id });
        }
    }

    await users.updateOne(
        { email },
        { $set: { plan: PLANS.PRO, updatedAt: new Date() } }
    );

    return { fulfilled: true, payment };
}