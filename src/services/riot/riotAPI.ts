import { RiotApiError } from "./riotApiError.js";

const riotApiKey = process.env.RIOT_API_KEY;

if (!riotApiKey) {
    throw new Error("RIOT_API_KEY is not configured.");
}

const riotToken: string = riotApiKey;

export async function getAccountByRiotId(
    gameName: string,
    tagLine: string
) {
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

    return response.json();
}

export async function getCurrentGameByPuuid(puuid: string) {
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
    return response.json();
}

export async function getRanksByPuuid(puuid: string) {
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

    return response.json();
}

async function getLastMatchIdByPuuid(puuid: string) {
    const url =  `https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?start=0&count=1`;

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
    const matchIds = await response.json() as string[];
    return matchIds[0];
}

export async function getLastMatchByPuuid(puuid: string) {
    const url =  `https://europe.api.riotgames.com/lol/match/v5/matches/${encodeURIComponent(await getLastMatchIdByPuuid(puuid))}`;

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

    return response.json();
}