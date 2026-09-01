import express from "express";
import "dotenv/config";
import playerRouter from "./routes/player.js";
import cors from "cors";
import { loadChampions } from "./services/championService.js";


const riotApiKey = process.env.RIOT_API_KEY;

if (!riotApiKey) {
    throw new Error("RIOT_API_KEY is not configured.");
}

const app = express();
app.use(cors({
    origin: [
        "https://projectscout.framer.website"
    ]
}));

const port = Number(process.env.PORT) || 3000;

app.use("/api/player", playerRouter);

async function startServer() {
    const oneWeek = 7 * 24 * 60 * 60 * 1000;

    await loadChampions();

    setInterval(async () => {
        await loadChampions();
    }, oneWeek);

    app.listen(port, "0.0.0.0", () => {
        console.log(`Server running on port ${port}`);
    });
}

startServer();