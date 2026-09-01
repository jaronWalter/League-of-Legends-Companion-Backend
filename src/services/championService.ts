const champions = new Map<number, {
    name: string;
    image: string;
}>();

async function fetchWithRetry(url: string, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await fetch(url);
        } catch (error) {
            console.log(`Fetch failed, attempt ${attempt}/${retries}`);

            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    throw new Error("Fetch failed");
}

export async function loadChampions() {
    const versionResponse = await fetchWithRetry(
        "https://ddragon.leagueoflegends.com/api/versions.json"
    );

    if (!versionResponse.ok) {
        throw new Error(`Data Dragon version error: ${versionResponse.status}`);
    }

    const versions: string[] = await versionResponse.json();
    const latestVersion = versions[0];

    const response = await fetchWithRetry(
        `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/champion.json`
    );

    if (!response.ok) {
        throw new Error(`Data Dragon champion error: ${response.status}`);
    }

    const data = await response.json();

    for (const champion of Object.values(data.data) as any[]) {
        champions.set(Number(champion.key), {
            name: champion.name,
            image: `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/champion/${champion.image.full}`
        });
    }

    console.log(`Loaded Data Dragon ${latestVersion}`);
}

export function getChampion(championId: number) {
    return champions.get(championId);
}