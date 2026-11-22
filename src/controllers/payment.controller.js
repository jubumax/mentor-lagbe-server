import { env } from "../config/env.js";
import { getStripe } from "../config/stripe.js";
import { PLANS, PRO_PLANS } from "../config/constants.js";
import { fulfillCheckoutSession } from "../services/payments.js";

// Sends people back to the site they came from, when that site is allowed.
function pickClientUrl(req) {
    const origin = req.headers.origin;
    return env.clientUrls.includes(origin) ? origin : env.clientUrls[0];
}


// POST /api/payments/checkout (student or tutor)
export async function createCheckoutSession(req, res) {
    const plan = PRO_PLANS[req.user.role];

    if (!plan) {
        return res.status(403).json({
            success: false,
            message: "Only students and tutors can buy the Pro plan.",
        });
    }

    if (req.user.plan === PLANS.PRO) {
        return res.status(409).json({
            success: false,
            message: "You already have the Pro plan.",
        });
    }

    const clientUrl = pickClientUrl(req);

    const session = await getStripe().checkout.sessions.create({
        mode: "payment",
        customer_email: req.user.email,
        line_items: [
            {
                quantity: 1,
                price_data: {
                    currency: "usd",
                    unit_amount: plan.amount * 100,
                    product_data: {
                        name: plan.name,
                        description: "One-time payment for the MentorLagbe Pro plan",
                    },
                },
            },
        ],
        metadata: {
            userEmail: req.user.email,
            userName: req.user.name,
            userRole: req.user.role,
            planName: plan.name,
            amount: String(plan.amount),
        },
        success_url: `${clientUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${clientUrl}/payment/cancel`,
    });

    res.json({ success: true, url: session.url, sessionId: session.id });
}

// POST /api/payments/verify -- [the payment success page calls this]
export async function verifyPayment(req, res) {
    const sessionId = String(req.body?.sessionId ?? "");

    if (!sessionId.startsWith("cs_")) {
        return res
            .status(400)
            .json({ success: false, message: "A valid payment session is required." });
    }

    let session;
    try {
        session = await getStripe().checkout.sessions.retrieve(sessionId);
    } catch {
        return res
            .status(404)
            .json({ success: false, message: "We couldn't find that payment." });
    }


    if (session.metadata?.userEmail !== req.user.email) {
        return res
            .status(403)
            .json({ success: false, message: "This payment belongs to another account." });
    }

    const { fulfilled, payment } = await fulfillCheckoutSession(session);

    if (!fulfilled) {
        return res.status(402).json({
            success: false,
            message: "This payment has not been completed.",
        });
    }

    res.json({
        success: true,
        message: "Payment confirmed. Your account is now Pro.",
        payment: {
            planName: payment.planName,
            amount: payment.amount,
            currency: payment.currency,
            transactionId: payment.transactionId,
            paidAt: payment.paidAt,
        },
    });
}

// POST /api/payments/webhook -- [called by Stripe, not by the browser]
export async function handleStripeWebhook(req, res) {
    if (!env.stripeWebhookSecret) {
        return res.status(400).send("Webhook is not configured.");
    }

    let event;
    try {
        event = getStripe().webhooks.constructEvent(
            req.body,
            req.headers["stripe-signature"],
            env.stripeWebhookSecret
        );
    } catch {
        return res.status(400).send("Invalid signature.");
    }

    if (
        event.type === "checkout.session.completed" ||
        event.type === "checkout.session.async_payment_succeeded"
    ) {
        await fulfillCheckoutSession(event.data.object);
    }

    res.json({ received: true });
}