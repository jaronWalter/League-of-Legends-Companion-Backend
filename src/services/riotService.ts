import {getMatchesByMatchIds, getMatchIdsByPuuid, getMatchTimeline,  getAccountByRiotId as getAccountByRiotIdFromRiot} from "./riot/riotAPI.js";
import {getMatch, saveMatch, getTimelineData, saveTimeline, getPlayerByRiotId, savePlayer} from "./databaseService.js";
import type { RiotMatch, RiotMatchTimeline } from "./riot/riotAPI.js";

export async function getMatches(matchIds: string[]): Promise<RiotMatch[]> {
    const matchesById = new Map<string, RiotMatch>();
    const missingIds: string[] = [];

    for (const matchId of matchIds) {
        const cachedMatch = await getMatch(matchId);

        if (cachedMatch?.matchData) {
            matchesById.set(matchId, cachedMatch.matchData);
        } else {
            missingIds.push(matchId);
        }
    }

    if (missingIds.length > 0) {
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

export async function getTimeline(matchId: string) {
    const cachedTimeline = await getTimelineData(matchId);

    if (cachedTimeline) {
        return cachedTimeline;
    }
    const timeline = await getMatchTimeline(matchId);

    const goldTimeline = [];
    const kills = [];

    for (const frame of timeline.info.frames) {

        for (const event of frame.events) {
            if (event.type !== "CHAMPION_KILL") {
                continue;
            }

            const killer = timeline.info.participants.find(
                participant => participant.participantId === event.killerId
            );

            const victim = timeline.info.participants.find(
                participant => participant.participantId === event.victimId
            );

            if (!killer || !victim || !event.position) {
                continue;
            }

            const time = event.timestamp / 1000;

            kills.push({
                time,
                killerPuuid: killer.puuid,
                victimPuuid: victim.puuid,
                position: {
                    x: event.position.x,
                    y: event.position.y
                }
            });
        }

        const framePlayers = [];

        for (const participantFrame of Object.values(
            frame.participantFrames
        )) {

            const participant = timeline.info.participants.find(
                participant =>
                    participant.participantId === participantFrame.participantId
            );

            if (!participant) {
                continue;
            }

            framePlayers.push({
                puuid: participant.puuid,
                totalGold: participantFrame.totalGold
            });
        }

        goldTimeline.push({
            time: frame.timestamp / 1000,
            players: framePlayers
        });
    }

    const processedTimeline = {
        kills,
        goldTimeline
    };

    await saveTimeline(
        matchId,
        processedTimeline
    );

    return processedTimeline;
}

export async function getAccountByRiotId(gameName: string, tagLine: string) {
    const cachedPlayer = await getPlayerByRiotId(gameName, tagLine);

    if (cachedPlayer) {
        return cachedPlayer;
    }
    const account = await getAccountByRiotIdFromRiot(gameName, tagLine);

    await savePlayer(account.puuid, account.gameName, account.tagLine);

    return account;
}