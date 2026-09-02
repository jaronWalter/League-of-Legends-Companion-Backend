import {
    getAccountByRiotId,
    getCurrentGameByPuuid,
    getRanksByPuuid
} from "./riot/riotAPI.js";

import {getChampion} from "./championService.js";

export async function getPlayerData(gameName: string, tagLine: string, puuid: string) {
    let id: string;
    if (puuid !== "none") {
        id = puuid;
    }
    else {
        const account = await getAccountByRiotId(gameName, tagLine);
        id = account.puuid;
    }

    const currentGame = await getCurrentGameByPuuid(id);

    if (!currentGame) {
        return {
            inGame: false,
            puuid: id,
            lastGame: null
        };
    }

    const players = await Promise.all(
        currentGame.participants.map(async (participant: any) => {
            const ranks = participant.puuid
                ? await getRanksByPuuid(participant.puuid)
                : [];

            const solo = ranks.find(
                (rank: any) => rank.queueType === "RANKED_SOLO_5x5"
            );

            const flex = ranks.find(
                (rank: any) => rank.queueType === "RANKED_FLEX_SR"
            );
            const riotId = participant.riotId?.split("#");

            return {
                name: riotId[0] ?? "StreamerMode",
                tag: riotId[1] ?? "Unknown",
                champion: getChampion(participant.championId),
                team: participant.teamId,
                ranks: {
                    solo: solo
                        ? `${solo.tier} ${solo.rank}`
                        : "not placed",

                    soloLp: solo
                        ? solo.leaguePoints
                        : 0,

                    soloWins: solo
                        ? solo.wins
                        : 0,

                    soloLosses: solo
                        ? solo.losses
                        : 0,

                    soloWinrate: solo
                        ? Math.round((solo.wins / (solo.wins + solo.losses)) * 100)
                        : 0,

                    flex: flex
                        ? `${flex.tier} ${flex.rank}`
                        : "not placed",

                    flexLp: flex
                        ? flex.leaguePoints
                        : 0,

                    flexWins: flex
                        ? flex.wins
                        : 0,

                    flexLosses: flex
                        ? flex.losses
                        : 0,

                    flexWinrate: flex
                        ? Math.round((flex.wins / (flex.wins + flex.losses)) * 100)
                        : 0
                }
            };
        })
    );


    return {
        inGame: true,
        puuid: id,
        game: {
            duration: currentGame.gameLength,
            queueType: currentGame.gameQueueConfigId
        },
        players
    };
}