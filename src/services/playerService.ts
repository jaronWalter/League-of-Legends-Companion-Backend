import {
    getAccountByRiotId,
    getCurrentGameByPuuid, getLastMatchByPuuid,
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
            lastGame: await getLastGameData(id)
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

async function getLastGameData(id: string) {
    const lastGame = await getLastMatchByPuuid(id);
    const player = lastGame.info.participants.find(
        (participant: any) => participant.puuid === id
    );
    const playerRanks = await getRanksByPuuid(id);
    const playerSolo = playerRanks.find(
        (rank: any) => rank.queueType === "RANKED_SOLO_5x5"
    );
    const playerFlex = playerRanks.find(
        (rank: any) => rank.queueType === "RANKED_FLEX_SR"
    );
    const players = await Promise.all(
        lastGame.info.participants.map(async (participant: any) => {
                const ranks = await getRanksByPuuid(participant.puuid);

                const solo = ranks.find(
                    (rank: any) => rank.queueType === "RANKED_SOLO_5x5"
                );

                const flex = ranks.find(
                    (rank: any) => rank.queueType === "RANKED_FLEX_SR"
                );

                const kda = participant.deaths === 0
                    ? participant.kills + participant.assists
                    : (participant.kills + participant.assists) / participant.deaths;

                return {

                        name: participant.riotIdGameName,
                        tagLine: participant.riotIdTagline,
                        champion: getChampion(participant.championId),
                        role: participant.teamPosition ?? "unknown",
                        team: participant.teamId,
                        result: participant.win ? "win" : "loss",
                        kills: participant.kills,
                        deaths: participant.deaths,
                        assists: participant.assists,
                        level: participant.champLevel,
                        kda: Math.round(kda * 100) / 100,

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
                                ? Math.round(
                                    (solo.wins / (solo.wins + solo.losses)) * 100
                                )
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
                                ? Math.round(
                                    (flex.wins / (flex.wins + flex.losses)) * 100
                                )
                                : 0
                        }
                };
            })
    );

    return {
            gameDuration: lastGame.info.gameDuration,
            queueId: lastGame.info.queueId,

            player: {
                name: player.riotIdGameName,
                tagLine: player.riotIdTagline,
                champion: getChampion(player.championId),
                role: player.teamPosition ?? "unknown",
                team: player.teamId,
                result: player.win ? "win" : "loss",
                kills: player.kills,
                deaths: player.deaths,
                assists: player.assists,
                level: player.champLevel,
                kda: Math.round((player.deaths === 0 ? player.kills + player.assists : (player.kills + player.assists) / player.deaths) * 100) / 100,
                ranks: {
                    solo: playerSolo
                        ? `${playerSolo.tier} ${playerSolo.rank}`
                        : "not placed",

                    soloLp: playerSolo
                        ? playerSolo.leaguePoints
                        : 0,

                    soloWins: playerSolo
                        ? playerSolo.wins
                        : 0,

                    soloLosses: playerSolo
                        ? playerSolo.losses
                        : 0,

                    soloWinrate: playerSolo
                        ? Math.round((playerSolo.wins / (playerSolo.wins + playerSolo.losses)) * 100)
                        : 0,

                    flex: playerSolo
                        ? `${playerSolo.tier} ${playerSolo.rank}`
                        : "not placed",

                    flexLp: playerSolo
                        ? playerSolo.leaguePoints
                        : 0,

                    flexWins: playerFlex
                        ? playerFlex.wins
                        : 0,

                    flexLosses: playerFlex
                        ? playerFlex.losses
                        : 0,

                    flexWinrate: playerFlex
                        ? Math.round((playerFlex.wins / (playerFlex.wins + playerFlex.losses)) * 100)
                        : 0
                }

            },
            players

    }
}