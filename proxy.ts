import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { updateSession } from "./utils/supabase/middleware";

function shouldBypassSession(pathname: string) {
  return (
    pathname === "/desktop" ||
    pathname.startsWith("/desktop/") ||
    pathname.startsWith("/api/jobs") ||
    pathname.startsWith("/api/messages") ||
    pathname.startsWith("/api/whatsapp/webhook") ||
    pathname.startsWith("/api/traffic-requests")
  );
}

function hasSupabasePublicEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (shouldBypassSession(pathname)) {
    return NextResponse.next();
  }

  if (!hasSupabasePublicEnv()) {
    return NextResponse.next();
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
