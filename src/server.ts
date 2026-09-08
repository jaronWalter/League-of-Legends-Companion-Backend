import express from "express";
import "dotenv/config";
import playerRouter from "./routes/player.js";
import ingameRouter from "./routes/ingameCheck.js";
import matchHistoryRouter from "./routes/matchHistory.js";
import cors from "cors";
import { loadChampions } from "./services/championService.js";


const riotApiKey = process.env.RIOT_API_KEY;

if (!riotApiKey) {
    throw new Error("RIOT_API_KEY is not configured.");
}

const app = express();
app.use(cors({
    origin: [
        "https://projectscout.framer.website",
        "https://chocolate-illuminate-848477.framer.app"
    ]
}));

const port = Number(process.env.PORT) || 3000;

app.use("/api/player", playerRouter);
app.use("/api/ingameCheck", ingameRouter);
app.use("/api/matchHistory", matchHistoryRouter);

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