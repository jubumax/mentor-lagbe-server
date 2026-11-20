import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { getDB } from "./db.js";
import { env } from "./env.js";
import { PLANS, ROLES, SELF_SERVICE_ROLES } from "./constants.js";

let auth;

export function initAuth() {
    if (auth) return auth;

    if (!env.betterAuthSecret) {
        throw new Error("BETTER_AUTH_SECRET is missing. Add it to your .env file.");
    }

    const hasGoogle = env.googleClientId && env.googleClientSecret;

    auth = betterAuth({
        appName: "MentorLagbe",
        baseURL: env.betterAuthUrl,
        secret: env.betterAuthSecret,
        trustedOrigins: env.clientUrls,
        database: mongodbAdapter(getDB()),

        emailAndPassword: {
            enabled: true,
            minPasswordLength: 6,
        },

        socialProviders: hasGoogle
            ? {
                google: {
                    clientId: env.googleClientId,
                    clientSecret: env.googleClientSecret,
                },
            }
            : undefined,

        user: {
            additionalFields: {
                role: {
                    type: "string",
                    required: false,
                    defaultValue: ROLES.STUDENT,
                    input: true,
                },
                plan: {
                    type: "string",
                    required: false,
                    defaultValue: PLANS.FREE,
                    input: false,
                },
                phone: { type: "string", required: false, input: true },
                bio: { type: "string", required: false, input: true },
            },
        },

        databaseHooks: {
            user: {
                create: {
                    // Only student or tutor can be chosen at sign up.
                    before: async (user) => ({
                        data: {
                            ...user,
                            role: SELF_SERVICE_ROLES.includes(user.role)
                                ? user.role
                                : ROLES.STUDENT,
                            plan: PLANS.FREE,
                        },
                    }),
                },
                update: {
                    // Users can never change their own role or plan through the auth API.
                    before: async (data) => {
                        const { role, plan, ...safeData } = data;
                        return { data: safeData };
                    },
                },
            },
        },

        advanced:
            env.nodeEnv === "production"
                ? { defaultCookieAttributes: { sameSite: "none", secure: true } }
                : undefined,
    });

    return auth;
}


export function getAuth() {
    if (!auth) {
        throw new Error("Auth is not initialised. Call initAuth() first.");
    }
    return auth;
}