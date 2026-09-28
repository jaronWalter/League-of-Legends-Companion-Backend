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