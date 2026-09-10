import {getMatchesByMatchIds, getMatchIdsByPuuid, /*getRanksByPuuid*/} from "./riot/riotAPI.js";

import {getChampion} from "./championService.js";


function wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getMatchHistory(id: string, start: number, count: number) {
    const matchIds = await getMatchIdsByPuuid(id, start, count);

    const matches = await getMatchesByMatchIds(matchIds);

    const matchHistory: any[] = [];

    for (const match of matches) {

        const player = match.info.participants.find(
            (participant: any) => participant.puuid === id
        );
        /*
        const playerRanks = await getRanksByPuuid(id);

        const playerSolo = playerRanks.find(
            (rank: any) => rank.queueType === "RANKED_SOLO_5x5"
        );

        const playerFlex = playerRanks.find(
            (rank: any) => rank.queueType === "RANKED_FLEX_SR"
        );
        */
        const players: any[] = [];

        for (const participant of match.info.participants) {
            /*
            const ranks = await getRanksByPuuid(
                participant.puuid
            );

            const solo = ranks.find(
                (rank: any) =>
                    rank.queueType === "RANKED_SOLO_5x5"
            );

            const flex = ranks.find(
                (rank: any) =>
                    rank.queueType === "RANKED_FLEX_SR"
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
                kda: Math.round(kda * 100) / 100,
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

            await wait(60);
        }

        matchHistory.push({
            gameDuration: match.info.gameDuration,
            queueId: match.info.queueId,

            player: {
                name: player.riotIdGameName,
                tagLine: player.riotIdTagline,
                champion: getChampion(player.championId),
                role: normalizePosition(player.teamPosition) ?? "unknown",
                team: player.teamId,
                result: player.win ? "win" : "loss",
                kills: player.kills,
                deaths: player.deaths,
                assists: player.assists,
                level: player.champLevel,
                kda: Math.round(
                    (
                        player.deaths === 0
                            ? player.kills + player.assists
                            : (player.kills + player.assists) /
                            player.deaths
                    ) * 100
                ) / 100,
                /*
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
                        ? Math.round(
                            (playerSolo.wins /
                                (playerSolo.wins + playerSolo.losses)) *
                            100
                        )
                        : 0,

                    flex: playerFlex
                        ? `${playerFlex.tier} ${playerFlex.rank}`
                        : "not placed",

                    flexLp: playerFlex
                        ? playerFlex.leaguePoints
                        : 0,

                    flexWins: playerFlex
                        ? playerFlex.wins
                        : 0,

                    flexLosses: playerFlex
                        ? playerFlex.losses
                        : 0,

                    flexWinrate: playerFlex
                        ? Math.round(
                            (playerFlex.wins /
                                (playerFlex.wins + playerFlex.losses)) *
                            100
                        )
                        : 0
                }

                 */
            },

            players
        });

        await wait(60);
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