import {
    getCurrentGameByPuuid,
    getSummonerByPuuid
} from "./riot/riotAPI.js";

import {
    getLastMatchByPuuid,
    getAccountByRiotId,
    getRanksByPuuid
} from "./riotService.js";

import {
    getChampion,
    ensureChampionsLoaded
} from "./championService.js";

import { determinePositions } from "./positionService.js";

import {
    ensureRunesLoaded,
    getRune
} from "./runeService.js";

import {
    ensureItemsLoaded,
    getItem
} from "./itemService.js";

import {
    ensureProfileIconsLoaded,
    getProfileIcon
} from "./profileIconService.js";

import { getTotalRankLp } from "./rankUtils.js";

// -------------------------
// Rank types
// -------------------------

interface RankEntry {
    leagueId: string;
    queueType: string;
    tier: string;
    rank: string;
    leaguePoints: number;
    wins: number;
    losses: number;
    hotStreak: boolean;
    veteran: boolean;
    freshBlood: boolean;
    inactive: boolean;
    miniSeries?: {
        losses: number;
        progress: string;
        target: number;
        wins: number;
    } | null;
}

// -------------------------
// Shared helpers
// -------------------------

async function resolvePlayerPuuid(
    gameName: string,
    tagLine: string,
    puuid: string
): Promise<string> {
    if (puuid !== "none") {
        return puuid;
    }

    const account = await getAccountByRiotId(gameName, tagLine);

    return account.puuid;
}

async function ensurePlayerDataLoaded() {
    await ensureChampionsLoaded();
    await ensureRunesLoaded();
    await ensureItemsLoaded();
    await ensureProfileIconsLoaded();
}

function getRankData(ranks: RankEntry[]) {
    const solo = ranks.find(
        rank => rank.queueType === "RANKED_SOLO_5x5"
    );

    const flex = ranks.find(
        rank => rank.queueType === "RANKED_FLEX_SR"
    );

    return {
        solo: solo
            ? `${solo.tier} ${solo.rank}`
            : "not placed",

        soloLp: solo
            ? solo.leaguePoints
            : 0,

        soloTotalLp: solo
            ? getTotalRankLp(
                solo.tier,
                solo.rank,
                solo.leaguePoints
            )
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

        soloDetails: solo
            ? {
                leagueId: solo.leagueId,
                hotStreak: solo.hotStreak,
                veteran: solo.veteran,
                freshBlood: solo.freshBlood,
                inactive: solo.inactive,
                miniSeries: solo.miniSeries ?? null
            }
            : null,

        flex: flex
            ? `${flex.tier} ${flex.rank}`
            : "not placed",

        flexLp: flex
            ? flex.leaguePoints
            : 0,

        flexTotalLp: flex
            ? getTotalRankLp(
                flex.tier,
                flex.rank,
                flex.leaguePoints
            )
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

        flexDetails: flex
            ? {
                leagueId: flex.leagueId,
                hotStreak: flex.hotStreak,
                veteran: flex.veteran,
                freshBlood: flex.freshBlood,
                inactive: flex.inactive,
                miniSeries: flex.miniSeries ?? null
            }
            : null
    };
}

function getMatchRunes(participant: any) {
    return {
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
    };
}

function getLiveRunes(participant: any) {
    const perkIds = participant.perks?.perkIds ?? [];

    return {
        primary: perkIds
            .slice(0, 4)
            .map((runeId: number) => getRune(runeId))
            .filter(Boolean),

        secondary: perkIds
            .slice(4, 6)
            .map((runeId: number) => getRune(runeId))
            .filter(Boolean)
    };
}

function normalizePosition(position: string | undefined) {
    switch (position) {
        case "MIDDLE":
            return "MID";
        case "BOTTOM":
            return "BOT";
        case "UTILITY":
            return "SUPPORT";
        default:
            return position ?? "unknown";
    }
}

function getArenaTeamId(participant: any, isArena: boolean) {
    return isArena
        ? participant.playerSubteamId ?? participant.teamId
        : participant.teamId;
}

function calculateKda(participant: any) {
    const kda = participant.deaths === 0
        ? participant.kills + participant.assists
        : (participant.kills + participant.assists) / participant.deaths;

    return Math.round(kda * 100) / 100;
}

// -------------------------
// Profile API
// -------------------------

export async function getPlayerProfileData(
    gameName: string,
    tagLine: string,
    puuid: string
) {
    let account: {
        puuid: string;
        gameName: string;
        tagLine: string;
    };

    if (puuid === "none") {
        account = await getAccountByRiotId(gameName, tagLine);
    } else {
        account = {
            puuid,
            gameName,
            tagLine
        };
    }

    await ensureProfileIconsLoaded();

    const [summoner, ranks] = await Promise.all([
        getSummonerByPuuid(account.puuid),
        getRanksByPuuid(account.puuid)
    ]);

    return {
        puuid: account.puuid,
        gameName: account.gameName,
        tagLine: account.tagLine,

        summonerLevel: summoner.summonerLevel,

        summonerIcon: getProfileIcon(
            summoner.profileIconId
        ),

        ranks: getRankData(ranks)
    };
}

// -------------------------
// Live Game API
// -------------------------

export async function getLiveGameData(
    gameName: string,
    tagLine: string,
    puuid: string
) {
    await ensurePlayerDataLoaded();

    const id = await resolvePlayerPuuid(
        gameName,
        tagLine,
        puuid
    );

    const currentGame = await getCurrentGameByPuuid(id);

    if (!currentGame) {
        return {
            inGame: false,
            puuid: id
        };
    }

    const isArena =
        currentGame.gameQueueConfigId === 1750 ||
        currentGame.gameQueueConfigId === 1740;

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

            const champ = getChampion(participant.championId);

            // Arena has no Solo/Flex ranks in this response.
            const ranks = !isArena && participant.puuid
                ? await getRanksByPuuid(participant.puuid)
                : [];

            const riotId = participant.riotId?.split("#");

            return {
                name: participant.puuid
                    ? riotId?.[0] ?? "Unknown"
                    : champ?.name ?? "Unknown",

                tag: participant.puuid
                    ? riotId?.[1] ?? "Unknown"
                    : "Unknown",

                summonerIcon: getProfileIcon(
                    participant.profileIconId
                ),

                champion: champ,

                position: playerPosition?.position ?? "unknown",

                team: getArenaTeamId(participant, isArena),

                runes: getLiveRunes(participant),

                summonerSpells: {
                    spell1: participant.spell1Id,
                    spell2: participant.spell2Id
                },

                ranks: isArena
                    ? null
                    : getRankData(ranks)
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

// -------------------------
// Last Game API
// -------------------------

export async function getPlayerLastGameData(
    gameName: string,
    tagLine: string,
    puuid: string
) {
    await ensurePlayerDataLoaded();

    const id = await resolvePlayerPuuid(
        gameName,
        tagLine,
        puuid
    );

    return {
        puuid: id,
        lastGame: await getLastGameData(id)
    };
}

async function getLastGameData(id: string) {
    const lastGame = await getLastMatchByPuuid(id);

    const isArena =
        lastGame.info.queueId === 1750 ||
        lastGame.info.queueId === 1740;

    const player = lastGame.info.participants.find(
        (participant: any) => participant.puuid === id
    );

    if (!player) {
        throw new Error("Player not found in last match");
    }

    // Do not request ranks for Arena games.
    const playerRanks = !isArena
        ? await getRanksByPuuid(id)
        : [];

    const playerRankData = isArena
        ? null
        : getRankData(playerRanks);

    const teamKills = new Map<number, number>();

    for (const participant of lastGame.info.participants) {
        const teamId = getArenaTeamId(participant, isArena);

        teamKills.set(
            teamId,
            (teamKills.get(teamId) ?? 0) + participant.kills
        );
    }

    const playerTeamId = getArenaTeamId(player, isArena);
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

            const rankData = isArena
                ? null
                : getRankData(ranks);

            const teamId = getArenaTeamId(participant, isArena);
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

                summonerIcon: getProfileIcon(
                    participant.profileIcon
                ),

                champion: getChampion(participant.championId),

                role: normalizePosition(participant.teamPosition),

                team: teamId,

                items: [
                    getItem(participant.item0),
                    getItem(participant.item1),
                    getItem(participant.item2),
                    getItem(participant.item3),
                    getItem(participant.item4),
                    getItem(participant.item5),
                    getItem(participant.item6)
                ],

                runes: getMatchRunes(participant),

                summonerSpells: {
                    spell1: participant.summoner1Id,
                    spell2: participant.summoner2Id
                },

                result: participant.win ? "win" : "loss",

                kills: participant.kills,
                deaths: participant.deaths,
                assists: participant.assists,

                level: participant.champLevel,
                kda: calculateKda(participant),
                killParticipationPercent: killParticipation,

                totalGold: participant.goldEarned,

                creepScore:
                    participant.neutralMinionsKilled +
                    participant.totalMinionsKilled,

                visionScore: participant.visionScore,

                totalChampionDamage:
                participant.totalDamageDealtToChampions,

                ranks: rankData
            };
        })
    );

    const gameDate = new Date(
        lastGame.info.gameCreation
    ).toLocaleString("de-DE");

    return {
        matchID: lastGame.metadata.matchId,
        gameDate,
        gameDuration: lastGame.info.gameDuration,
        queueId: lastGame.info.queueId,

        patch: lastGame.info.gameVersion
            .split(".")
            .slice(0, 2)
            .join("."),

        player: {
            name: player.riotIdGameName,
            tagLine: player.riotIdTagline,

            summonerLevel: player.summonerLevel,

            summonerIcon: getProfileIcon(
                player.profileIcon
            ),

            champion: getChampion(player.championId),

            role: normalizePosition(player.teamPosition),

            team: getArenaTeamId(player, isArena),

            items: [
                getItem(player.item0),
                getItem(player.item1),
                getItem(player.item2),
                getItem(player.item3),
                getItem(player.item4),
                getItem(player.item5),
                getItem(player.item6)
            ],

            runes: getMatchRunes(player),

            summonerSpells: {
                spell1: player.summoner1Id,
                spell2: player.summoner2Id
            },

            result: player.win ? "win" : "loss",

            kills: player.kills,
            deaths: player.deaths,
            assists: player.assists,

            level: player.champLevel,
            kda: calculateKda(player),

            killParticipationPercent: playerKillParticipation,

            totalGold: player.goldEarned,

            creepScore:
                player.neutralMinionsKilled +
                player.totalMinionsKilled,

            visionScore: player.visionScore,

            totalChampionDamage:
            player.totalDamageDealtToChampions,

            ranks: playerRankData
        },

        players
    };
}