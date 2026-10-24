//test

import { Router, type Request, type Response } from "express";
import {
    getPlayerProfileData,
    getLiveGameData,
    getPlayerLastGameData
} from "../services/playerService.js";
import { RiotApiError } from "../services/riot/riotApiError.js";

const router = Router();

type PlayerService = (
    gameName: string,
    tagLine: string,
    puuid: string
) => Promise<unknown>;

function createPlayerHandler(service: PlayerService) {
    return async (req: Request, res: Response) => {
        const gameName = req.query.gameName;
        const tagLine = req.query.tagLine;
        const puuid = req.query.puuid;

        if (
            typeof gameName !== "string" ||
            typeof tagLine !== "string" ||
            typeof puuid !== "string" ||
            gameName.trim() === "" ||
            tagLine.trim() === ""
        ) {
            res.status(400).json({
                error: "gameName, tagLine and puuid are required. puuid = none if unknown"
            });
            return;
        }

        try {
            const data = await service(gameName, tagLine, puuid);
            res.json(data);
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
    };
}

router.get("/profile", createPlayerHandler(getPlayerProfileData));
router.get("/liveGame", createPlayerHandler(getLiveGameData));
router.get("/lastGame", createPlayerHandler(getPlayerLastGameData));

export default router;