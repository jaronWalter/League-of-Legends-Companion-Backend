import express from "express";
import "dotenv/config";
import testRouter from "./routes/test";
import playerRouter from "./routes/player.js";
import cors from "cors";

const riotApiKey = process.env.RIOT_API_KEY;

if (!riotApiKey) {
    throw new Error("RIOT_API_KEY is not configured.");
}

const app = express();
app.use(cors());
const port = 3000;

app.use("/api/test", testRouter);
app.use("/api/player", playerRouter);

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});