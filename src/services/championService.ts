interface ChampionData {
    key: string;
    name: string;
    image: {
        full: string;
    };
}

interface ChampionResponse {
    data: Record<string, ChampionData>;
}

const champions = new Map<number, {
    name: string;
    image: string;
}>();

let championsLoaded = false;
let loadingPromise: Promise<void> | null = null;


async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await fetch(url);
        } catch (error) {
            console.log(`Fetch failed, attempt ${attempt}/${retries}`);

            if (attempt < retries) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }

    throw new Error("Fetch failed");
}


export async function loadChampions(): Promise<void> {
    if (championsLoaded) {
        return;
    }

    const versionResponse = await fetchWithRetry(
        "https://ddragon.leagueoflegends.com/api/versions.json"
    );

    if (!versionResponse.ok) {
        throw new Error(
            `Data Dragon version error: ${versionResponse.status}`
        );
    }

    const versions = await versionResponse.json() as string[];
    const latestVersion = versions[0];

    const response = await fetchWithRetry(
        `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/champion.json`
    );

    if (!response.ok) {
        throw new Error(
            `Data Dragon champion error: ${response.status}`
        );
    }

    const data = await response.json() as ChampionResponse;

    champions.clear();

    for (const champion of Object.values(data.data)) {
        champions.set(Number(champion.key), {
            name: champion.name,
            image: `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/champion/${champion.image.full}`
        });
    }

    championsLoaded = true;

    console.log(`Loaded Data Dragon ${latestVersion}`);
}


export async function ensureChampionsLoaded(): Promise<void> {
    if (championsLoaded) {
        return;
    }

    if (!loadingPromise) {
        loadingPromise = loadChampions()
            .finally(() => {
                loadingPromise = null;
            });
    }
    await loadingPromise;
}


export function getChampion(championId: number) {
    return champions.get(championId);
}