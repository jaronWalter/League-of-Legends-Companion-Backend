import {
    getRankHistoryByPuuid
} from "./databaseService.js";

const HISTORY_DAYS = 60;
const SECONDS_PER_DAY = 24 * 60 * 60;

export async function getRankHistory(puuid: string) {
    const now = Math.floor(Date.now() / 1000);
    const from = now - HISTORY_DAYS * SECONDS_PER_DAY;

    const allEntries = await getRankHistoryByPuuid(puuid);

    const entries = allEntries
        .filter(entry => entry.timestamp >= from && entry.timestamp <= now)
        .map((entry, index, filtered) => {
            const previous = index > 0 ? filtered[index - 1] : undefined;

            return {
                id: entry.id,
                timestamp: entry.timestamp,
                date: new Date(entry.timestamp * 1000).toISOString(),
                soloTotalLp: entry.soloTotalLp,
                flexTotalLp: entry.flexTotalLp,
                soloDeltaLp:
                    entry.soloTotalLp !== null &&
                    previous?.soloTotalLp != null
                        ? entry.soloTotalLp - previous.soloTotalLp
                        : null,
                flexDeltaLp:
                    entry.flexTotalLp !== null &&
                    previous?.flexTotalLp != null
                        ? entry.flexTotalLp - previous.flexTotalLp
                        : null
            };
        });

    return {
        puuid,
        days: HISTORY_DAYS,
        from,
        to: now,
        entries
    };
}
