import { Router } from "express";
import { RiotApiError } from "../services/riot/riotApiError.js";
import { getMatchHistory, getMatchIds } from "../services/matchHistoryService.js";

const router = Router();

//    /api/matchHistory/ids -> returns matchIds from 100 most recent games
router.get("/ids", async (req, res) => {
    const gameName = req.query.gameName;
    const tagLine = req.query.tagLine;
    const puuid = req.query.puuid;

    if (typeof gameName !== "string" || typeof tagLine !== "string" || typeof puuid !== "string" || gameName.trim() === "" || tagLine.trim() === "") {
        res.status(400).json({
            error: "gameName, tagLine and puuid are required. puuid = none if unknown"
        });
        return;
    }

    try {
        const matchIds = await getMatchIds(gameName, tagLine, puuid);
        res.json(matchIds);

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




//    /api/matchHistory -> returns data to given matchIds
router.get("/", async (req, res) => {
    const ids = req.query.matchIds;


    if (
        typeof ids !== "string" ||
        ids.trim() === ""
    ) {
        res.status(400).json({
            error: "ids are required"
        });
        return;
    }

    const matchIds = ids
        .split(",")
        .map(id => id.trim())
        .filter(id => id !== "");

    if (matchIds.length === 0) {
        res.status(400).json({
            error: "No valid match IDs provided"
        });
        return;
    }

    try {
        const matchHistory = await getMatchHistory(matchIds);

        res.json(matchHistory);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Internal server error"
        });
    }
});


export default router;