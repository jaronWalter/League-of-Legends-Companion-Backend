import express from "express";

const app = express();
const port = 3000;

app.get("/api/test", (req, res) => {
    res.json({
        message: "Backend works!"
    });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});