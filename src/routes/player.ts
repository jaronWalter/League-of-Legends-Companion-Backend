import { Router } from "express";
import { getPlayerData } from "../services/playerService.js";

const router = Router();

router.get("/", async (req, res) => {
    const gameName = req.query.gameName;
    const tagLine = req.query.tagLine;

    if (typeof gameName !== "string" || typeof tagLine !== "string") {
        res.status(400).json({
            error: "gameName and tagLine are required."
        });
        return;
    }

    const playerData = await getPlayerData(gameName, tagLine);
    res.json(playerData);
});

export default router;