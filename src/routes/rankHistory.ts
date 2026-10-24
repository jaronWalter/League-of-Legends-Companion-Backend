
import { Router } from "express";
import { getRankHistory } from "../services/rankHistoryService.js";

const router = Router();

router.get("/", async (req, res) => {
    const puuid = req.query.puuid;

    if (typeof puuid !== "string" || puuid.trim() === "") {
        res.status(400).json({
            error: "puuid is required"
        });
        return;
    }

    try {
        const history = await getRankHistory(puuid.trim());
        res.json(history);
    } catch (error) {
        console.error("Failed to load ranked history:", error);
        res.status(500).json({
            error: "Internal server error"
        });
    }
});

export default router;
