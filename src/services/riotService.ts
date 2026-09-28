import {getMatchesByMatchIds, getMatchIdsByPuuid} from "./riot/riotAPI.js";
import {getMatch, saveMatch} from "./databaseService.js";
import type { RiotMatch } from "./riot/riotAPI.js";

export async function getMatches(matchIds: string[]): Promise<RiotMatch[]> {
    const matchesById = new Map<string, RiotMatch>();
    const missingIds: string[] = [];

    for (const matchId of matchIds) {
        const cachedMatch = await getMatch(matchId);

        if (cachedMatch?.matchData) {
            console.log("CACHE HIT:", matchId); //test
            matchesById.set(matchId, cachedMatch.matchData);
        } else {
            console.log("CACHE MISS:", matchId); //test
            missingIds.push(matchId);
        }
    }

    if (missingIds.length > 0) {
        console.log("FETCH RIOT:", missingIds); //test
        const riotMatches = await getMatchesByMatchIds(missingIds);

        for (const match of riotMatches) {
            matchesById.set(match.metadata.matchId, match);

            await saveMatch(
                match.metadata.matchId,
                match
            );
        }
    }

    return matchIds
        .map(matchId => matchesById.get(matchId))
        .filter((match): match is RiotMatch => Boolean(match));
}

export async function getLastMatchByPuuid(
    puuid: string
): Promise<RiotMatch> {

    const matchIds = await getMatchIdsByPuuid(puuid, 0, 1);

    const matches = await getMatches(matchIds);

    if (matches.length === 0) {
        throw new Error("No match found.");
    }

    return matches[0];
}