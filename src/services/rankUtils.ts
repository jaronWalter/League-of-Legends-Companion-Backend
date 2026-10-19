const TIER_BASE: Record<string, number> = {
    IRON: 0,
    BRONZE: 400,
    SILVER: 800,
    GOLD: 1200,
    PLATINUM: 1600,
    EMERALD: 2000,
    DIAMOND: 2400,
    MASTER: 2800,
    GRANDMASTER: 2800,
    CHALLENGER: 2800
};

const DIVISION_OFFSET: Record<string, number> = {
    IV: 0,
    III: 100,
    II: 200,
    I: 300
};

export function getTotalRankLp(
    tier: string,
    rank: string,
    leaguePoints: number
): number | null {
    const normalizedTier = tier.toUpperCase();
    const normalizedRank = rank.toUpperCase();

    const tierBase = TIER_BASE[normalizedTier];

    if (tierBase === undefined) {
        return null;
    }

    // Master, Grandmaster und Challenger haben keine normalen Divisionen.
    if (
        normalizedTier === "MASTER" ||
        normalizedTier === "GRANDMASTER" ||
        normalizedTier === "CHALLENGER"
    ) {
        return tierBase + leaguePoints;
    }

    const divisionOffset = DIVISION_OFFSET[normalizedRank];

    if (divisionOffset === undefined) {
        return null;
    }

    return tierBase + divisionOffset + leaguePoints;
}