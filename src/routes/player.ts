import { getAccountByRiotId } from "../services/riot/riotAPI.js";
import {getCurrentGameByPuuid} from "../services/riot/riotAPI.js";
import { Router } from "express";

const router = Router();

router.get("/", async (req, res) => {
    const gameName = req.query.gameName;
    const tagLine = req.query.tagLine;

    if (typeof gameName !== "string" || typeof tagLine !== "string") {
        res.status(400).json({
            error: "wrong input."
        });
        return;
    }
    const account = await getAccountByRiotId(gameName, tagLine);
    console.log("ACCOUNT:", account);
    const currentGame = await getCurrentGameByPuuid(account.puuid);
    if (!currentGame) {
        res.json({
            inGame: false
        });
        return;
    }
    res.json({
        inGame: true,
        gameLength: currentGame.gameLength,
        queueType: currentGame.gameQueueConfigId,
        participants: currentGame.participants
    });
});

export default router;