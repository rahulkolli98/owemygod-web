import { NextRequest, NextResponse } from "next/server";

export function proxy(_request: NextRequest) {
  // Auth cookies are issued by the API origin, so the Next.js server cannot
  // reliably inspect them here. Protected-route enforcement happens client-side.
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/groups/:path*", "/profile/:path*"],
};