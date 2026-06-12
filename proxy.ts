import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { updateSession } from "./utils/supabase/middleware";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isDesktopRoute =
    pathname === "/desktop" ||
    pathname.startsWith("/desktop/");

  const isPublicApiRoute =
    pathname.startsWith("/api/traffic-requests") ||
    pathname.startsWith("/api/jobs") ||
    pathname.startsWith("/api/messages") ||
    pathname.startsWith("/api/whatsapp/webhook");

  if (isDesktopRoute || isPublicApiRoute) {
    return NextResponse.next();
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

