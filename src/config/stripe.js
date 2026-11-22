import Stripe from "stripe";
import { env } from "./env.js";

let stripe;

export function getStripe() {
    if (!stripe) {
        if (!env.stripeSecretKey) {
            throw new Error("STRIPE_SECRET_KEY is missing. Add it to your .env file.");
        }
        stripe = new Stripe(env.stripeSecretKey);
    }
    return stripe;
}