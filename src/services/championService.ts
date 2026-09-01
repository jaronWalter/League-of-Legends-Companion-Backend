const champions = new Map<number, {
    name: string;
    image: string;
}>();

export async function loadChampions() {
    const versionResponse = await fetch(
        "https://ddragon.leagueoflegends.com/api/versions.json"
    );

    if (!versionResponse.ok) {
        throw new Error(`Data Dragon version error: ${versionResponse.status}`);
    }

    const versions: string[] = await versionResponse.json();
    const latestVersion = versions[0];

    const response = await fetch(
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