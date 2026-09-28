-- Migration number: 0001 	 2026-09-28T07:32:27.147Z

CREATE TABLE players (
    puuid TEXT PRIMARY KEY,
    game_name TEXT NOT NULL,
    tag_line TEXT NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE TABLE matches (
    match_id TEXT PRIMARY KEY,
    match_data TEXT,
    timeline_data TEXT,
    created_at INTEGER NOT NULL
);