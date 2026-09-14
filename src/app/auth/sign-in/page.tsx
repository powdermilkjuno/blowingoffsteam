import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: PageProps<"/auth/sign-in">) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") query.set(key, value);
  }
  redirect(`/login${query.size ? `?${query}` : ""}`);
}
