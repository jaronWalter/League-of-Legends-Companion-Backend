import { RiotApiError } from "./riotApiError.js";

const riotApiKey = process.env.RIOT_API_KEY;

if (!riotApiKey) {
    throw new Error("RIOT_API_KEY is not configured.");
}

const riotToken: string = riotApiKey;


// -------------------------
// Riot API Types
// -------------------------

interface RiotAccount {
    puuid: string;
    gameName: string;
    tagLine: string;
}

interface RiotParticipant {
    puuid?: string;
    riotId?: string;
    riotIdGameName?: string;
    riotIdTagline?: string;
    championId: number;
    teamId: number;
    teamPosition?: string;
    summonerId?: string;
}

interface RiotCurrentGame {
    gameLength: number;
    gameQueueConfigId: number;
    participants: RiotParticipant[];
}

interface RiotLeagueEntry {
    leagueId: string;
    summonerId: string;
    puuid: string;
    queueType: string;
    tier: string;
    rank: string;
    leaguePoints: number;
    wins: number;
    losses: number;
}

interface RiotMatchParticipant {
    puuid: string;
    riotIdGameName?: string;
    riotIdTagline?: string;
    teamPosition?: string;
    championId: number;
    teamId: number;
    kills: number;
    deaths: number;
    assists: number;
    champLevel: number;
    win: boolean;
}

interface RiotMatch {
    metadata: {
        matchId: string;
        participants: string[];
    };

    info: {
        gameCreation: number;
        gameDuration: number;
        gameMode: string;
        gameType: string;
        queueId: number;
        participants: RiotMatchParticipant[];
    };
}


export async function getAccountByRiotId(
    gameName: string,
    tagLine: string
): Promise<RiotAccount> {

    const url =
        `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/` +
        `${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;

    const response = await fetch(url, {
        headers: {
            "X-Riot-Token": riotToken
        }
    });

    if (!response.ok) {
        throw new RiotApiError(
            response.status,
            `Riot API error: ${response.status}`
        );
    }

    return response.json() as Promise<RiotAccount>;
}


// -------------------------
// Current Game
// -------------------------

export async function getCurrentGameByPuuid(
    puuid: string
): Promise<RiotCurrentGame | null> {

    const url =
        `https://EUW1.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${encodeURIComponent(puuid)}`;

    const response = await fetch(url, {
        headers: {
            "X-Riot-Token": riotToken
        }
    });

    if (!response.ok) {
        if (response.status === 404) {
            return null;
        }

        throw new RiotApiError(
            response.status,
            `Riot API error: ${response.status}`
        );
    }

    return response.json() as Promise<RiotCurrentGame>;
}


// -------------------------
// Ranks
// -------------------------

export async function getRanksByPuuid(
    puuid: string
): Promise<RiotLeagueEntry[]> {

    const url =
        `https://euw1.api.riotgames.com/lol/league/v4/entries/by-puuid/${encodeURIComponent(puuid)}`;

    const response = await fetch(url, {
        headers: {
            "X-Riot-Token": riotToken
        }
    });

    if (!response.ok) {
        throw new RiotApiError(
            response.status,
            `Riot API error: ${response.status}`
        );
    }

    return response.json() as Promise<RiotLeagueEntry[]>;
}


// -------------------------
// Match IDs
// -------------------------

export async function getMatchIdsByPuuid(
    puuid: string,
    start: number,
    count: number
): Promise<string[]> {

    const url =
        `https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/` +
        `${encodeURIComponent(puuid)}/ids?start=${encodeURIComponent(start)}&count=${encodeURIComponent(count)}`;

    const response = await fetch(url, {
        headers: {
            "X-Riot-Token": riotToken
        }
    });

    if (!response.ok) {
        throw new RiotApiError(
            response.status,
            `Riot API error: ${response.status}`
        );
    }

    return response.json() as Promise<string[]>;
}


// -------------------------
// Last Match
// -------------------------

export async function getLastMatchByPuuid(
    puuid: string
): Promise<RiotMatch> {

    const game = await getMatchIdsByPuuid(puuid, 0, 1);

    const url =
        `https://europe.api.riotgames.com/lol/match/v5/matches/${encodeURIComponent(game[0])}`;

    const response = await fetch(url, {
        headers: {
            "X-Riot-Token": riotToken
        }
    });

    if (!response.ok) {
        throw new RiotApiError(
            response.status,
            `Riot API error: ${response.status}`
        );
    }

    return response.json() as Promise<RiotMatch>;
}


// -------------------------
// Multiple Matches
// -------------------------

export async function getMatchesByMatchIds(
    matchIds: string[]
): Promise<RiotMatch[]> {

    const matches: RiotMatch[] = [];

    for (const matchId of matchIds) {

        const url =
            `https://europe.api.riotgames.com/lol/match/v5/matches/${encodeURIComponent(matchId)}`;

        const response = await fetch(url, {
            headers: {
                "X-Riot-Token": riotToken
            }
        });

        if (!response.ok) {
            throw new RiotApiError(
                response.status,
                `Riot API error: ${response.status}`
            );
        }

        matches.push(
            await response.json() as RiotMatch
        );
    }

    return matches;
}