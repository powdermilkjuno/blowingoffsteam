import Link from "next/link";
import { SteamButton } from "./auth/_components/social-buttons";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-[#1b2838] px-6 py-16 font-sans text-[#c7d5e0]">
      <main className="flex w-full max-w-sm flex-col items-center gap-8 text-center">
        <div className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight text-white">
            Blowing Off Steam
          </h1>
          <p className="text-sm leading-6 text-[#8f98a0]">
            See where your hours actually went, and compare libraries with
            friends.
          </p>
        </div>

        <div className="flex w-full flex-col items-center gap-5">
          <Link
            href="/auth/steam/login"
            className="w-full rounded bg-[#66c0f4] px-6 py-4 text-lg font-semibold text-[#1b2838] hover:bg-white"
          >
            Sign in
          </Link>

          <SteamButton boxed={false} />
        </div>

        <p className="text-sm text-[#8f98a0]">
          Already set up?{" "}
          <Link href="/auth/sign-in" className="text-[#66c0f4] hover:text-white">
            Use email or Google
          </Link>
        </p>
      </main>
    </div>
  );
}
