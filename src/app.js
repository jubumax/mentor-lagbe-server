import express from "express";
import cors from "cors";
import { corsOptions } from "./config/cors.js";
import { notFound } from "./middlewares/notFound.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

app.use(cors(corsOptions));

app.use(express.json());

app.get("/", (req, res) => {
    res.json({ success: true, message: "MentorLagbe server is running" });
});

app.use(notFound);
app.use(errorHandler);

export default app;