import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = "vacayza_cs_preview";

function isComingSoonEnabled(): boolean {
  const v = process.env.COMING_SOON?.toLowerCase();
  return v === "true" || v === "1";
}

async function bypassCookieValue(secret: string): Promise<string> {
  const data = new TextEncoder().encode(`vacayza:coming-soon:${secret}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function middleware(request: NextRequest) {
  if (!isComingSoonEnabled()) {
    return NextResponse.next();
  }

  const { pathname, searchParams } = request.nextUrl;
  const bypassSecret = process.env.COMING_SOON_BYPASS_SECRET;

  if (bypassSecret) {
    const param = searchParams.get("bypass");
    if (param !== null && param === bypassSecret) {
      const expectedHash = await bypassCookieValue(bypassSecret);
      const url = request.nextUrl.clone();
      url.searchParams.delete("bypass");
      const res = NextResponse.redirect(url);
      res.cookies.set(COOKIE_NAME, expectedHash, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
      return res;
    }

    const cookie = request.cookies.get(COOKIE_NAME)?.value;
    if (cookie) {
      const expectedHash = await bypassCookieValue(bypassSecret);
      if (timingSafeEqualHex(cookie, expectedHash)) {
        return NextResponse.next();
      }
    }
  }

  if (pathname === "/coming-soon") {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/coming-soon";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
