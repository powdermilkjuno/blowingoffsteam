import { redirect } from "next/navigation";
import { getSteamTicket } from "@/lib/steam-ticket";

export const dynamic = "force-dynamic";

// Sign-up is Steam first. If this browser already verified Steam, skip
// straight to the form; otherwise send them to Steam — never another button.
export default async function SignUpPage() {
  const ticket = await getSteamTicket();
  redirect(ticket ? "/onboarding" : "/auth/steam/login");
}
