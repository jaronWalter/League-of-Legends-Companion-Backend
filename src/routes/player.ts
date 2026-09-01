import { Router } from "express";
import { getPlayerData } from "../services/playerService.js";
import { RiotApiError } from "../services/riot/riotApiError.js";

const router = Router();

router.get("/", async (req, res) => {
    const gameName = req.query.gameName;
    const tagLine = req.query.tagLine;

    if (typeof gameName !== "string" || typeof tagLine !== "string" || gameName.trim() === "" || tagLine.trim() === "") {
        res.status(400).json({
            error: "gameName and tagLine are required."
        });
        return;
    }

    try {
        const playerData = await getPlayerData(gameName, tagLine);
        res.json(playerData);
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