import { env } from "cloudflare:workers";

export async function getMatch(matchId: string) {
    const result = await env.DB
        .prepare(`
            SELECT match_id, match_data, timeline_data
            FROM matches
            WHERE match_id = ?
        `)
        .bind(matchId)
        .first();

    if (!result) {
        return null;
    }

    return {
        matchId: result.match_id as string,
        matchData: result.match_data
            ? JSON.parse(result.match_data as string)
            : null,
        timelineData: result.timeline_data
            ? JSON.parse(result.timeline_data as string)
            : null
    };
}

export async function saveMatch(matchId: string, matchData: unknown) {
    await env.DB
        .prepare(`
            INSERT INTO matches (
                match_id,
                match_data,
                created_at
            )
            VALUES (?, ?, ?)
        `)
        .bind(
            matchId,
            JSON.stringify(matchData),
            Date.now()
        )
        .run();
}

export async function getTimelineData(matchId: string) {
    const result = await env.DB
        .prepare(`
            SELECT timeline_data
            FROM matches
            WHERE match_id = ?
        `)
        .bind(matchId)
        .first();

    if (!result || !result.timeline_data) {
        return null;
    }

    return JSON.parse(result.timeline_data as string);
}

export async function saveTimeline(
    matchId: string,
    timelineData: unknown
) {
    await env.DB
        .prepare(`
            UPDATE matches
            SET timeline_data = ?
            WHERE match_id = ?
        `)
        .bind(
            JSON.stringify(timelineData),
            matchId
        )
        .run();
}

export async function getPlayerByRiotId(gameName: string, tagLine: string) {
    const result = await env.DB
        .prepare(`
            SELECT puuid, game_name, tag_line
            FROM players
            WHERE game_name = ?
              AND tag_line = ?
        `)
        .bind(gameName, tagLine)
        .first();

    if (!result) {
        return null;
    }

    return {
        puuid: result.puuid as string,
        gameName: result.game_name as string,
        tagLine: result.tag_line as string
    };
}

export async function savePlayer(puuid: string, gameName: string, tagLine: string) {
    await env.DB
        .prepare(`
            INSERT INTO players (
                puuid,
                game_name,
                tag_line,
                updated_at
            )
            VALUES (?, ?, ?, ?)
            ON CONFLICT(puuid)
            DO UPDATE SET
                game_name = excluded.game_name,
                tag_line = excluded.tag_line,
                updated_at = excluded.updated_at
        `)
        .bind(
            puuid,
            gameName,
            tagLine,
            Date.now()
        )
        .run();
}