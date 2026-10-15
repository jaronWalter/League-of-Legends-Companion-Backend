interface ProfileIconData {
    image: {
        full: string;
    };
}

interface ProfileIconResponse {
    data: Record<string, ProfileIconData>;
}

const profileIcons = new Map<number, string>();

let profileIconsLoaded = false;
let loadingPromise: Promise<void> | null = null;
let dataDragonVersion = "";

export async function loadProfileIcons() {
    if (profileIconsLoaded) {
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
        dataDragonVersion = versions[0];

        const response = await fetch(
            `https://ddragon.leagueoflegends.com/cdn/${dataDragonVersion}/data/en_US/profileicon.json`
        );

        if (!response.ok) {
            throw new Error("Failed to load profile icons.");
        }

        const result = await response.json() as ProfileIconResponse;

        for (const [id, profileIcon] of Object.entries(result.data)) {
            profileIcons.set(
                Number(id),
                `https://ddragon.leagueoflegends.com/cdn/${dataDragonVersion}/img/profileicon/${profileIcon.image.full}`
            );
        }

        profileIconsLoaded = true;
    })();

    try {
        await loadingPromise;
    } finally {
        loadingPromise = null;
    }
}

export async function ensureProfileIconsLoaded() {
    await loadProfileIcons();
}

export function getProfileIcon(profileIconId: number) {
    const image = profileIcons.get(profileIconId);

    if (!image) {
        return undefined;
    }

    return {
        id: profileIconId,
        image
    };
}