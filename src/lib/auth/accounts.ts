import { auth } from "./server";

export type LinkedAccounts = {
  hasPassword: boolean;
  providers: string[];
};

// Better Auth records an email/password login as a "credential" account. Google
// sign-ups have no credential row, so those users cannot sign in with a
// password until they set one.
export async function getLinkedAccounts(): Promise<LinkedAccounts> {
  const { data, error } = await auth.listAccounts();

  if (error || !Array.isArray(data)) {
    return { hasPassword: false, providers: [] };
  }

  const providers = data.map((account) => account.providerId);

  return {
    hasPassword: providers.includes("credential"),
    providers,
  };
}
