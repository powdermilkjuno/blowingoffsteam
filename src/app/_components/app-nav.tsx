import Link from "next/link";
import { signOutAction } from "../auth/actions";

export function AppNav({ displayName }: { displayName: string }) {
  return (
    <nav className="flex items-center gap-4 border-b border-[#2a3f5a] bg-[#16202d] px-6 py-3 text-sm">
      <Link href="/dashboard" className="font-medium text-white">
        Blowing Off Steam
      </Link>
      <Link href="/dashboard" className="text-[#8f98a0] hover:text-white">
        Dashboard
      </Link>
      <Link href="/friends" className="text-[#8f98a0] hover:text-white">
        Friends
      </Link>
      <Link href="/settings" className="text-[#8f98a0] hover:text-white">
        Settings
      </Link>

      <div className="ml-auto flex items-center gap-3">
        <span className="text-[#8f98a0]">{displayName}</span>
        <form action={signOutAction}>
          <button
            type="submit"
            className="text-[#66c0f4] hover:text-white"
          >
            Sign out
          </button>
        </form>
      </div>
    </nav>
  );
}
