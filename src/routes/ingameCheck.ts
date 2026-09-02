import { Router } from "express";
import { getCurrentGameByPuuid } from "../services/riot/riotAPI.js";
import { RiotApiError } from "../services/riot/riotApiError.js";

const router = Router();

router.get("/", async (req, res) => {
    const puuid = req.query.puuid;

    if (typeof puuid !== "string" || puuid.trim() === "") {
        res.status(400).json({
            error: "puuid required"
        });
        return;
    }

    try {
        const game = await getCurrentGameByPuuid(puuid);

        if (!game) {
            res.json({
                inGame: false
            });
            return;
        }

        res.json({
            inGame: true
        });
    } catch (error) {
        console.error(error);

        if (error instanceof RiotApiError) {
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