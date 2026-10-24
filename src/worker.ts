import express from "express";
import cors from "cors";
import { httpServerHandler } from "cloudflare:node";

import playerRouter from "./routes/player.js";
import ingameRouter from "./routes/ingameCheck.js";
import matchHistoryRouter from "./routes/matchHistory.js";
import rankHistoryRouter from "./routes/rankHistory.js";

const app = express();

app.use(cors({
    origin: [
        "https://projectscout.lol",
        "https://www.projectscout.lol"
    ]
}));

app.use("/api/player", playerRouter);
app.use("/api/ingameCheck", ingameRouter);
app.use("/api/matchHistory", matchHistoryRouter);
app.use("/api/rankHistory", rankHistoryRouter);

app.listen(3000);

export default httpServerHandler({ port: 3000 });