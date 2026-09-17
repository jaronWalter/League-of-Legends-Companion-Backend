import {getAccountByRiotId, getMatchesByMatchIds, getMatchIdsByPuuid, /*getRanksByPuuid*/} from "./riot/riotAPI.js";

import {getChampion, ensureChampionsLoaded} from "./championService.js";
import {ensureItemsLoaded, getItem} from "./itemService";


export async function getMatchIds(gameName: string, tagLine: string, puuid: string) {
    let id: string;

    if (puuid !== "none") {
        id = puuid;
    } else {
        const account = await getAccountByRiotId(
            gameName,
            tagLine
        );

        id = account.puuid;
    }

    return await getMatchIdsByPuuid(id, 0, 100);
}

export async function getMatchHistory(matchIds: string[]) {
    await ensureChampionsLoaded();
    await ensureItemsLoaded();

    const matches = await getMatchesByMatchIds(matchIds);

    const matchHistory: any[] = [];

    for (const match of matches) {

        const players: any[] = [];

        for (const participant of match.info.participants) {

            /*
            const ranks = await getRanksByPuuid(
                participant.puuid
            );

            const solo = ranks.find(
                rank => rank.queueType === "RANKED_SOLO_5x5"
            );

            const flex = ranks.find(
                rank => rank.queueType === "RANKED_FLEX_SR"
            );
            */

            const kda =
                participant.deaths === 0
                    ? participant.kills + participant.assists
                    : (participant.kills + participant.assists) /
                    participant.deaths;

            players.push({
                name: participant.riotIdGameName,
                tagLine: participant.riotIdTagline,
                champion: getChampion(participant.championId),
                role: normalizePosition(participant.teamPosition),
                team: participant.teamId,
                result: participant.win ? "win" : "loss",
                kills: participant.kills,
                deaths: participant.deaths,
                assists: participant.assists,
                level: participant.champLevel,
                totalGold: participant.goldEarned,
                creepScore: participant.neutralMinionsKilled + participant.totalMinionsKilled,
                visionScore: participant.visionScore,
                totalChampionDamage: participant.totalDamageDealtToChampions,
                kda: Math.round(kda * 100) / 100,
                items: [
                    getItem(participant.item0),
                    getItem(participant.item1),
                    getItem(participant.item2),
                    getItem(participant.item3),
                    getItem(participant.item4),
                    getItem(participant.item5),
                    getItem(participant.item6),
                ],

                /*
                ranks: {
                    solo: solo
                        ? `${solo.tier} ${solo.rank}`
                        : "not placed",

                    soloLp: solo ? solo.leaguePoints : 0,
                    soloWins: solo ? solo.wins : 0,
                    soloLosses: solo ? solo.losses : 0,

                    soloWinrate: solo
                        ? Math.round(
                            (solo.wins /
                                (solo.wins + solo.losses)) *
                            100
                        )
                        : 0,

                    flex: flex
                        ? `${flex.tier} ${flex.rank}`
                        : "not placed",

                    flexLp: flex ? flex.leaguePoints : 0,
                    flexWins: flex ? flex.wins : 0,
                    flexLosses: flex ? flex.losses : 0,

                    flexWinrate: flex
                        ? Math.round(
                            (flex.wins /
                                (flex.wins + flex.losses)) *
                            100
                        )
                        : 0
                }
                */
            });
        }

        matchHistory.push({
            matchId: match.metadata.matchId,
            gameDuration: match.info.gameDuration,
            queueId: match.info.queueId,

            players
        });
    }

    return matchHistory;
}


function normalizePosition(position: string | undefined) {
    if (position === "MIDDLE") {
        return "MID";
    }

    if (position === "BOTTOM") {
        return "BOT";
    }

    if (position === "UTILITY") {
        return "SUPPORT";
    }

    return position ?? "unknown";
}