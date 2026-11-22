import { env } from "../config/env.js";
import { getStripe } from "../config/stripe.js";
import { PLANS, PRO_PLANS } from "../config/constants.js";

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