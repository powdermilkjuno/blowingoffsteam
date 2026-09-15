import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import {
  getProfileByAuthUserId,
  isProfileComplete,
  type Profile,
} from "@/lib/db/profiles";

export async function requireCompleteProfile(): Promise<Profile> {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/login");

  const profile = await getProfileByAuthUserId(session.user.id);
  if (!profile || !isProfileComplete(profile)) redirect("/onboarding");

  return profile;
}
