CREATE TABLE rank_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    puuid TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    solo_total_lp INTEGER,
    flex_total_lp INTEGER
);

CREATE INDEX idx_rank_history_puuid_timestamp
    ON rank_history (puuid, timestamp);