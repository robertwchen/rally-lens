import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED = ["/dashboard", "/athletes", "/sessions", "/review", "/benchmarks", "/settings"];
const AUTH_PAGES = ["/login", "/signup"];

export function middleware(req: NextRequest) {
  const token = req.cookies.get("rl_token")?.value;
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isProtected && !token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (AUTH_PAGES.includes(pathname) && token) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/athletes/:path*",
    "/sessions/:path*",
    "/review/:path*",
    "/benchmarks/:path*",
    "/settings/:path*",
    "/login",
    "/signup",
  ],
};
