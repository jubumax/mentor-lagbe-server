import "dotenv/config";

export const env = {
    nodeEnv: process.env.NODE_ENV ?? "development",
    port: Number(process.env.PORT) || 5000,

    // One or more allowed client origins, separated by commas
    clientUrls: (process.env.CLIENT_URL ?? "http://localhost:3000")
        .split(",")
        .map((url) => url.trim())
        .filter(Boolean),
};