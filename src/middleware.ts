import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/jwt";

const publicRoutes = ["/auth/login", "/auth/embark", "/auth/recover", "/auth/reset"];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isPublicRoute = publicRoutes.includes(path);

  // Get session
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("okamoto_session")?.value;
  const session = sessionCookie ? await decrypt(sessionCookie) : null;

  // Private and no session.
  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL("/auth/login", req.nextUrl));
  }

  // Public and no session.
  if (!session && isPublicRoute) {
    return NextResponse.next();
  }

  // Session exists.
  if (session && session.userId) {
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|manifest\\.webmanifest|.*\\.png|.*\\.ico$).*)",
  ],
};
