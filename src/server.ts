import express from "express";
import "dotenv/config";
import testRouter from "./routes/test";
import playerRouter from "./routes/player.js";
import cors from "cors";
import { loadChampions } from "./services/championService.js";


const riotApiKey = process.env.RIOT_API_KEY;

if (!riotApiKey) {
    throw new Error("RIOT_API_KEY is not configured.");
}

const app = express();
app.use(cors());
const port = 3000;

app.use("/api/test", testRouter);
app.use("/api/player", playerRouter);

async function startServer() {
    const oneWeek = 7 * 24 * 60 * 60 * 1000;

    await loadChampions();

    setInterval(async () => {
        await loadChampions();
    }, oneWeek);

    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
}

startServer();