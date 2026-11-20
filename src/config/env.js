import "dotenv/config";

const port = Number(process.env.PORT) || 5000;

export const env = {
    nodeEnv: process.env.NODE_ENV ?? "development",
    port,

    // One or more allowed client origins, separated by commas
    clientUrls: (process.env.CLIENT_URL ?? "http://localhost:3000")
        .split(",")
        .map((url) => url.trim())
        .filter(Boolean),

    mongodbUri: process.env.MONGODB_URI,
    dbName: process.env.DB_NAME ?? "mentorlagbe",

    betterAuthSecret: process.env.BETTER_AUTH_SECRET,
    betterAuthUrl: process.env.BETTER_AUTH_URL ?? `http://localhost:${port}`,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
};
