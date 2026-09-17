interface ItemData {
    name: string;
    image: {
        full: string;
    };
}

interface ItemResponse {
    data: Record<string, ItemData>;
}

const items = new Map<number, {
    name: string;
    image: string;
}>();

let itemsLoaded = false;
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


export async function loadItems(): Promise<void> {
    if (itemsLoaded) {
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
        `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/item.json`
    );

    if (!response.ok) {
        throw new Error(
            `Data Dragon item error: ${response.status}`
        );
    }

    const data = await response.json() as ItemResponse;

    items.clear();

    for (const [itemId, item] of Object.entries(data.data)) {
        items.set(Number(itemId), {
            name: item.name,
            image: `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/item/${item.image.full}`
        });
    }

    itemsLoaded = true;

    console.log(`Loaded Data Dragon items ${latestVersion}`);
}


export async function ensureItemsLoaded(): Promise<void> {
    if (itemsLoaded) {
        return;
    }

    if (!loadingPromise) {
        loadingPromise = loadItems()
            .finally(() => {
                loadingPromise = null;
            });
    }

    await loadingPromise;
}


export function getItem(itemId: number) {
    return items.get(itemId);
}
