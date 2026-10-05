interface RuneData {
    name: string;
    image: string;
}

interface RuneReforgedData {
    id: number;
    name: string;
    icon: string;
    slots: {
        runes: {
            id: number;
            name: string;
            icon: string;
        }[];
    }[];
}

const runes = new Map<number, RuneData>();

let runesLoaded = false;
let loadingPromise: Promise<void> | null = null;

export async function loadRunes() {
    if (runesLoaded) {
        return;
    }

    if (loadingPromise) {
        return loadingPromise;
    }

    loadingPromise = (async () => {
        const versionsResponse = await fetch(
            "https://ddragon.leagueoflegends.com/api/versions.json"
        );

        if (!versionsResponse.ok) {
            throw new Error("Failed to load Data Dragon versions.");
        }

        const versions = await versionsResponse.json() as string[];
        const latestVersion = versions[0];

        const response = await fetch(
            `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/runesReforged.json`
        );

        if (!response.ok) {
            throw new Error("Failed to load rune data.");
        }

        const data = await response.json() as RuneReforgedData[];

        for (const path of data) {
            for (const slot of path.slots) {
                for (const rune of slot.runes) {
                    runes.set(rune.id, {
                        name: rune.name,
                        image: `https://ddragon.leagueoflegends.com/cdn/img/${rune.icon}`
                    });
                }
            }
        }

        runesLoaded = true;
    })();

    try {
        await loadingPromise;
    } finally {
        loadingPromise = null;
    }
}

export async function ensureRunesLoaded() {
    await loadRunes();
}

export function getRune(runeId: number) {
    return runes.get(runeId);
}