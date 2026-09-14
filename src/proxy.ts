import { auth } from "@/lib/auth/server";

export default auth.middleware({
  loginUrl: "/auth/sign-in",
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/friends/:path*",
    "/groups/:path*",
    "/settings/:path*",
    "/u/:path*",
  ],
};
