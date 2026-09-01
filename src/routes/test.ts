import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
    const gameName = req.query.gameName;
    const tagLine = req.query.tagLine;
    res.json({
        name: gameName,
        tag: tagLine,
        soloqRank: "Challenger"
    });
});

export default router;