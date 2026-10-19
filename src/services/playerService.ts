import {getCurrentGameByPuuid, getRanksByPuuid} from "./riot/riotAPI.js";
import {getLastMatchByPuuid, getAccountByRiotId} from "./riotService"
import {getChampion, ensureChampionsLoaded} from "./championService.js";
import { determinePositions } from "./positionService.js";
import {ensureRunesLoaded, getRune} from "./runeService.js";
import {ensureItemsLoaded, getItem} from "./itemService";
import {ensureProfileIconsLoaded, getProfileIcon} from "./profileIconService.js";
import {getTotalRankLp} from "./rankUtils";

export async function getPlayerData(gameName: string, tagLine: string, puuid: string) {
    await ensureChampionsLoaded();
    await ensureRunesLoaded()
    await ensureItemsLoaded()
    await ensureProfileIconsLoaded();
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

    const isArena =
        currentGame.gameQueueConfigId === 1750 ||
        currentGame.gameQueueConfigId === 1740;



    console.log(JSON.stringify(currentGame, null, 2));

    const team100 = currentGame.participants.filter(
        (participant: any) => participant.teamId === 100
    );

    const team200 = currentGame.participants.filter(
        (participant: any) => participant.teamId === 200
    );

    const team100Positions = determinePositions(team100);
    const team200Positions = determinePositions(team200);

    const players = await Promise.all(
        currentGame.participants.map(async (participant: any) => {
            const positionData = participant.teamId === 100
                ? team100Positions
                : team200Positions;

            const playerPosition = positionData.find(
                (entry: any) => entry.participant === participant
            );
            const champ = getChampion(participant.championId)
            const ranks = !isArena && participant.puuid
                ? await getRanksByPuuid(participant.puuid)
                : [];

            const solo = ranks.find(
                (rank: any) => rank.queueType === "RANKED_SOLO_5x5"
            );

            const flex = ranks.find(
                (rank: any) => rank.queueType === "RANKED_FLEX_SR"
            );
            const riotId = participant.riotId?.split("#");
            const perkIds = participant.perks?.perkIds ?? [];

            const primaryRunes = perkIds
                .slice(0, 4)
                .map((runeId: number) => getRune(runeId))
                .filter(Boolean);

            const secondaryRunes = perkIds
                .slice(4, 6)
                .map((runeId: number) => getRune(runeId))
                .filter(Boolean);

            return {
                name: participant.puuid
                    ? riotId?.[0] ?? "Unknown"
                    : champ?.name ?? "Unknown",
                tag: participant.puuid
                    ? riotId?.[1] ?? "Unknown"
                    : "Unknown",
                summonerIcon: getProfileIcon(participant.profileIconId),
                champion: champ,
                position: playerPosition?.position ?? "unknown",
                team: participant.teamId,
                runes: {
                    primary: primaryRunes,
                    secondary: secondaryRunes
                },
                summonerSpells: {
                    spell1: participant.spell1Id,
                    spell2: participant.spell2Id
                },
                ranks: {
                    solo: solo
                        ? `${solo.tier} ${solo.rank}`
                        : "not placed",

                    soloLp: solo
                        ? solo.leaguePoints
                        : 0,

                    soloTotalLp: solo
                        ? getTotalRankLp(solo.tier, solo.rank, solo.leaguePoints)
                        : null,

                    soloWins: solo
                        ? solo.wins
                        : 0,

                    soloLosses: solo
                        ? solo.losses
                        : 0,

                    soloWinrate: solo
                        ? Math.round((solo.wins / (solo.wins + solo.losses)) * 100)
                        : 0,

                    soloDetails: solo ? {
                        leagueId: solo.leagueId,
                        hotStreak: solo.hotStreak,
                        veteran: solo.veteran,
                        freshBlood: solo.freshBlood,
                        inactive: solo.inactive,
                        miniSeries: solo.miniSeries ?? null
                    } : null,

                    flex: flex
                        ? `${flex.tier} ${flex.rank}`
                        : "not placed",

                    flexLp: flex
                        ? flex.leaguePoints
                        : 0,

                    flexTotalLp: flex
                        ? getTotalRankLp(flex.tier, flex.rank, flex.leaguePoints)
                        : null,

                    flexWins: flex
                        ? flex.wins
                        : 0,

                    flexLosses: flex
                        ? flex.losses
                        : 0,

                    flexWinrate: flex
                        ? Math.round((flex.wins / (flex.wins + flex.losses)) * 100)
                        : 0,

                    flexDetails: flex ? {
                        leagueId: flex.leagueId,
                        hotStreak: flex.hotStreak,
                        veteran: flex.veteran,
                        freshBlood: flex.freshBlood,
                        inactive: flex.inactive,
                        miniSeries: flex.miniSeries ?? null
                    } : null
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
    const isArena = lastGame.info.queueId === 1750 || lastGame.info.queueId === 1740;
    const player = lastGame.info.participants.find(
        (participant: any) => participant.puuid === id
    );
    if (!player) {
        throw new Error("Player not found in last match");
    }

    const playerRanks = await getRanksByPuuid(id);
    const playerSolo = playerRanks.find(
        (rank: any) => rank.queueType === "RANKED_SOLO_5x5"
    );
    const playerFlex = playerRanks.find(
        (rank: any) => rank.queueType === "RANKED_FLEX_SR"
    );

    const teamKills = new Map<number, number>();

    for (const participant of lastGame.info.participants) {
        const teamId = isArena
            ? participant.playerSubteamId ?? participant.teamId
            : participant.teamId;

        teamKills.set(
            teamId,
            (teamKills.get(teamId) ?? 0) + participant.kills
        );
    }

    const playerTeamId = isArena
        ? player.playerSubteamId ?? player.teamId
        : player.teamId;

    const playerTotalTeamKills = teamKills.get(playerTeamId) ?? 0;

    const playerKillParticipation = playerTotalTeamKills > 0
        ? Math.round(
            ((player.kills + player.assists) / playerTotalTeamKills) * 100
        )
        : 0;

    const players = await Promise.all(
        lastGame.info.participants.map(async (participant: any) => {
            const ranks = !isArena
            ? await getRanksByPuuid(participant.puuid)
            : [];
            const solo = ranks.find(
                (rank: any) => rank.queueType === "RANKED_SOLO_5x5"
            );
            const flex = ranks.find((rank: any) => rank.queueType === "RANKED_FLEX_SR"
            );

            const kda = participant.deaths === 0
                ? participant.kills + participant.assists
                : (participant.kills + participant.assists) / participant.deaths;

            const teamId = isArena
                ? participant.playerSubteamId ?? participant.teamId
                : participant.teamId;

            const totalTeamKills = teamKills.get(teamId) ?? 0;

            const killParticipation = totalTeamKills > 0
                ? Math.round(
                    ((participant.kills + participant.assists) / totalTeamKills) * 100
                )
                : 0;
                return {
                        name: participant.riotIdGameName,
                        tagLine: participant.riotIdTagline,
                        summonerLevel: participant.summonerLevel,
                        summonerIcon: getProfileIcon(participant.profileIcon),
                        champion: getChampion(participant.championId),
                        role: normalizePosition(participant.teamPosition),
                        team: isArena
                            ? participant.playerSubteamId
                            : participant.teamId,
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
                                .map((selection: {
                                    perk: number;
                                    var1: number;
                                    var2: number;
                                    var3: number;
                                }) => getRune(selection.perk))
                                .filter(Boolean),

                            secondary: participant.perks.styles[1]?.selections
                                .map((selection: {
                                    perk: number;
                                    var1: number;
                                    var2: number;
                                    var3: number;
                                }) => getRune(selection.perk))
                                .filter(Boolean)
                        },
                        summonerSpells: {
                            spell1: participant.summoner1Id,
                            spell2: participant.summoner2Id
                        },
                        result: participant.win ? "win" : "loss",
                        kills: participant.kills,
                        deaths: participant.deaths,
                        assists: participant.assists,
                        level: participant.champLevel,
                        kda: Math.round(kda * 100) / 100,
                        killParticipationPercent: killParticipation,
                        totalGold: participant.goldEarned,
                        creepScore: participant.neutralMinionsKilled + participant.totalMinionsKilled,
                        visionScore: participant.visionScore,
                        totalChampionDamage: participant.totalDamageDealtToChampions,
                        ranks: isArena ? null :{
                            solo: solo
                                ? `${solo.tier} ${solo.rank}`
                                : "not placed",

                            soloLp: solo
                                ? solo.leaguePoints
                                : 0,

                            soloTotalLp: solo
                                ? getTotalRankLp(solo.tier, solo.rank, solo.leaguePoints)
                                : null,

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

                            soloDetails: solo ? {
                                leagueId: solo.leagueId,
                                hotStreak: solo.hotStreak,
                                veteran: solo.veteran,
                                freshBlood: solo.freshBlood,
                                inactive: solo.inactive,
                                miniSeries: solo.miniSeries ?? null
                            } : null,

                            flex: flex
                                ? `${flex.tier} ${flex.rank}`
                                : "not placed",

                            flexLp: flex
                                ? flex.leaguePoints
                                : 0,

                            flexTotalLp: flex
                                ? getTotalRankLp(flex.tier, flex.rank, flex.leaguePoints)
                                : null,

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
                                : 0,

                            flexDetails: flex ? {
                                leagueId: flex.leagueId,
                                hotStreak: flex.hotStreak,
                                veteran: flex.veteran,
                                freshBlood: flex.freshBlood,
                                inactive: flex.inactive,
                                miniSeries: flex.miniSeries ?? null
                            } : null
                        }
                };
            })
    );

    const gameDate = new Date(lastGame.info.gameCreation).toLocaleString("de-DE");
    return {
            matchID: lastGame.metadata.matchId,
            gameDate: gameDate,
            gameDuration: lastGame.info.gameDuration,
            queueId: lastGame.info.queueId,
            patch: lastGame.info.gameVersion.split(".").slice(0, 2).join("."),

            player: {
                name: player.riotIdGameName,
                tagLine: player.riotIdTagline,
                summonerLevel: player.summonerLevel,
                summonerIcon: getProfileIcon(player.profileIcon),
                champion: getChampion(player.championId),
                role: normalizePosition(player.teamPosition) ?? "unknown",
                team: isArena
                    ? player.playerSubteamId
                    : player.teamId,
                items: [
                    getItem(player.item0),
                    getItem(player.item1),
                    getItem(player.item2),
                    getItem(player.item3),
                    getItem(player.item4),
                    getItem(player.item5),
                    getItem(player.item6),
                ],
                runes: {
                    primary: player.perks.styles[0]?.selections
                        .map(selection => getRune(selection.perk))
                        .filter(Boolean),

                    secondary: player.perks.styles[1]?.selections
                        .map(selection => getRune(selection.perk))
                        .filter(Boolean)
                },
                summonerSpells: {
                    spell1: player.summoner1Id,
                    spell2: player.summoner2Id
                },
                result: player.win ? "win" : "loss",
                kills: player.kills,
                deaths: player.deaths,
                assists: player.assists,
                level: player.champLevel,
                kda: Math.round((player.deaths === 0 ? player.kills + player.assists : (player.kills + player.assists) / player.deaths) * 100) / 100,
                killParticipationPercent: playerKillParticipation,
                totalGold: player.goldEarned,
                creepScore: player.neutralMinionsKilled + player.totalMinionsKilled,
                visionScore: player.visionScore,
                totalChampionDamage: player.totalDamageDealtToChampions,

                ranks: {
                    solo: playerSolo
                        ? `${playerSolo.tier} ${playerSolo.rank}`
                        : "not placed",

                    soloLp: playerSolo
                        ? playerSolo.leaguePoints
                        : 0,

                    soloTotalLp: playerSolo
                        ? getTotalRankLp(playerSolo.tier, playerSolo.rank, playerSolo.leaguePoints)
                        : null,

                    soloWins: playerSolo
                        ? playerSolo.wins
                        : 0,

                    soloLosses: playerSolo
                        ? playerSolo.losses
                        : 0,

                    soloWinrate: playerSolo
                        ? Math.round((playerSolo.wins / (playerSolo.wins + playerSolo.losses)) * 100)
                        : 0,

                    soloDetails: playerSolo ? {
                        leagueId: playerSolo.leagueId,
                        hotStreak: playerSolo.hotStreak,
                        veteran: playerSolo.veteran,
                        freshBlood: playerSolo.freshBlood,
                        inactive: playerSolo.inactive,
                        miniSeries: playerSolo.miniSeries ?? null
                    } : null,

                    flex: playerFlex
                        ? `${playerFlex.tier} ${playerFlex.rank}`
                        : "not placed",

                    flexLp: playerFlex
                        ? playerFlex.leaguePoints
                        : 0,

                    flexTotalLp: playerFlex
                        ? getTotalRankLp(playerFlex.tier, playerFlex.rank, playerFlex.leaguePoints)
                        : null,

                    flexWins: playerFlex
                        ? playerFlex.wins
                        : 0,

                    flexLosses: playerFlex
                        ? playerFlex.losses
                        : 0,

                    flexWinrate: playerFlex
                        ? Math.round((playerFlex.wins / (playerFlex.wins + playerFlex.losses)) * 100)
                        : 0,

                    flexDetails: playerFlex ? {
                        leagueId: playerFlex.leagueId,
                        hotStreak: playerFlex.hotStreak,
                        veteran: playerFlex.veteran,
                        freshBlood: playerFlex.freshBlood,
                        inactive: playerFlex.inactive,
                        miniSeries: playerFlex.miniSeries ?? null
                    } : null
                }

            },
            players

    }
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



