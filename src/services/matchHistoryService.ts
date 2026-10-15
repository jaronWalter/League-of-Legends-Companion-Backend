import {getMatchIdsByPuuid, getRanksByPuuid} from "./riot/riotAPI.js";
import {getMatches, getTimeline, getAccountByRiotId} from "./riotService.js";
import {getChampion, ensureChampionsLoaded} from "./championService.js";
import {ensureItemsLoaded, getItem} from "./itemService";
import {ensureRunesLoaded, getRune} from "./runeService";
import {ensureProfileIconsLoaded, getProfileIcon} from "./profileIconService.js";



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
    await ensureRunesLoaded();
    await ensureProfileIconsLoaded()

    const matches = await getMatches(matchIds);

    const matchHistory: any[] = [];

    for (const match of matches) {

        const players: any[] = [];

        const gameDate = new Date(match.info.gameCreation).toLocaleString("de-DE");

        const isArena = match.info.queueId === 1750 || match.info.queueId === 1740;

        const teamKills = new Map<number, number>();

        for (const participant of match.info.participants) {
            const teamId = isArena
                ? participant.playerSubteamId ?? participant.teamId
                : participant.teamId;

            teamKills.set(
                teamId,
                (teamKills.get(teamId) ?? 0) + participant.kills
            );
        }

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

            const teamId = isArena
                ? participant.playerSubteamId ?? participant.teamId
                : participant.teamId;

            const totalTeamKills = teamKills.get(teamId) ?? 0;

            const killParticipation = totalTeamKills > 0
                ? Math.round(
                    ((participant.kills + participant.assists) / totalTeamKills) * 100
                )
                : 0;

            players.push({
                name: participant.riotIdGameName,
                tagLine: participant.riotIdTagline,
                summonerLevel: participant.summonerLevel,
                summonerIcon: getProfileIcon(participant.profileIcon),
                champion: getChampion(participant.championId),
                role: normalizePosition(participant.teamPosition),
                team: isArena
                    ? participant.playerSubteamId ?? participant.teamId
                    : participant.teamId,
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
                killParticipationPercent: killParticipation,
                items: [
                    getItem(participant.item0),
                    getItem(participant.item1),
                    getItem(participant.item2),
                    getItem(participant.item3),
                    getItem(participant.item4),
                    getItem(participant.item5),
                    getItem(participant.item6),
                ],
                runes: {
                    primary: participant.perks.styles[0]?.selections
                        .map(selection => getRune(selection.perk))
                        .filter(Boolean),

                    secondary: participant.perks.styles[1]?.selections
                        .map(selection => getRune(selection.perk))
                        .filter(Boolean)
                },
                summonerSpells: {
                    spell1: participant.summoner1Id,
                    spell2: participant.summoner2Id
                },

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
            gameDate: gameDate,
            gameDuration: match.info.gameDuration,
            queueId: match.info.queueId,
            patch: match.info.gameVersion.split(".").slice(0, 2).join("."),
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

export async function getMatchDetails(matchIds: string[]) {
    const matches = await getMatches(matchIds);
    const matchDetails = [];

    for (const match of matches) {
        const timeline = await getTimeline(match.metadata.matchId);
        const players = [];

        for (const participant of match.info.participants) {
            const ranks = await getRanksByPuuid(participant.puuid);

            const solo = ranks.find(
                rank => rank.queueType === "RANKED_SOLO_5x5"
            );

            const flex = ranks.find(
                rank => rank.queueType === "RANKED_FLEX_SR"
            );

            players.push({
                name: participant.riotIdGameName,
                tagLine: participant.riotIdTagline,
                puuid: participant.puuid,

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
            });
        }

        matchDetails.push({
            matchId: match.metadata.matchId,
            players,
            kills: timeline.kills,
            goldTimeline: timeline.goldTimeline,
            structureKills: timeline.structureKills,
            neutralObjectives: timeline.neutralObjectives
        });
    }

    return matchDetails;
}