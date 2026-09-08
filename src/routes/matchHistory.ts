import { Router } from "express";
import { RiotApiError } from "../services/riot/riotApiError.js";
import { getMatchHistory } from "../services/matchHistoryService.js";

const router = Router();

router.get("/", async (req, res) => {

    const puuid = req.query.puuid;
    const gameNr = req.query.gameNr;
    const amount = req.query.amount;

    if (typeof puuid !== "string" ||   puuid.trim() === "")  {
        res.status(400).json({
            error: "puuid required"
        });
        return;
    }

    const startNr = gameNr === undefined ? 0 : Number(gameNr);
    const count = amount === undefined ? 3 : Number(amount);

    try {
        const matchHistory = await getMatchHistory(puuid, startNr, count)
        res.json(matchHistory);

    } catch (error) {
        console.error(error);
        if (error instanceof RiotApiError) {
            if (error.status === 404) {
                res.status(404).json({
                    error: "PLAYER_NOT_FOUND",
                    message: "Player not found."
                });
                return;
            }

            if (error.status === 429) {
                res.status(429).json({
                    error: "RATE_LIMITED",
                    message: "Too many requests."
                });
                return;
            }

            res.status(502).json({
                error: "RIOT_API_ERROR",
                message: "Riot API is currently unavailable."
            });
            return;
        }
        res.status(500).json({
            error: "Internal server error"
        });
    }
});

export default router;