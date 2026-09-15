import express from "express";
import cors from "cors";
import { httpServerHandler } from "cloudflare:node";

import playerRouter from "./routes/player.js";
import ingameRouter from "./routes/ingameCheck.js";
import matchHistoryRouter from "./routes/matchHistory.js";

const app = express();

app.use(cors({
    origin: [
        "https://projectscout.framer.website",
        "https://chocolate-illuminate-848477.framer.app"
    ]
}));

app.use("/api/player", playerRouter);
app.use("/api/ingameCheck", ingameRouter);
app.use("/api/matchHistory", matchHistoryRouter);

app.listen(3000);

export default httpServerHandler({ port: 3000 });