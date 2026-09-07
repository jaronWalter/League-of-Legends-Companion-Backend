type SummonerBonus = {
    TOP: number;
    MID: number;
    BOT: number;
    SUPPORT: number;
};

export const summonerSpellPositions: Record<string, SummonerBonus> = {
    Barrier: {
        TOP: 0,
        MID: 0,
        BOT: 300,
        SUPPORT: 0
    },

    Heal: {
        TOP: 0,
        MID: 0,
        BOT: 0,
        SUPPORT: 300
    },

    Ignite: {
        TOP: 200,
        MID: 200,
        BOT: 0,
        SUPPORT: 200
    },

    Teleport: {
        TOP: 200,
        MID: 200,
        BOT: 200,
        SUPPORT: 0
    },

    Ghost: {
        TOP: 100,
        MID: 100,
        BOT: 100,
        SUPPORT: 0
    },

    Cleanse: {
        TOP: 0,
        MID: 0,
        BOT: 300,
        SUPPORT: 0
    }
}