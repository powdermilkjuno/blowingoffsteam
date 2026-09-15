import { refreshProfileArchetype } from "./archetypes";
import { getProfileById, saveSteamPlaytime } from "./db/profiles";
import { listLinkedSteamAccounts } from "./db/snapshots";
import { fetchPlaytime, type Playtime } from "./steam-api";

export type SyncResult = {
  checked: number;
  synced: number;
  privateProfiles: number;
  failed: number;
};

export async function syncLinkedPlaytime(account: {
  profileId: string;
  steamId: string;
  profileUrl: string;
}): Promise<Playtime> {
  const playtime = await fetchPlaytime(account.steamId);
  await saveSteamPlaytime({
    profileId: account.profileId,
    steamId: account.steamId,
    profileUrl: account.profileUrl,
    playtime,
  });
  const profile = await getProfileById(account.profileId);
  if (profile?.archetype) {
    await refreshProfileArchetype(profile);
  }
  return playtime;
}

export async function syncAllLinkedPlaytime(): Promise<SyncResult> {
  const accounts = await listLinkedSteamAccounts();
  const result: SyncResult = {
    checked: accounts.length,
    synced: 0,
    privateProfiles: 0,
    failed: 0,
  };

  for (const account of accounts) {
    try {
      const playtime = await syncLinkedPlaytime(account);
      if (playtime.isPublic) result.synced += 1;
      else result.privateProfiles += 1;
    } catch {
      result.failed += 1;
    }
  }

  return result;
}
