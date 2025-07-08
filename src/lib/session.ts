"use server";

import { cookies } from "next/headers";
import { encrypt, decrypt } from "@/lib/jwt";

import { JWTPayload } from "jose";

// Creates a session cookie with users data.
export async function createSession({
  id,
  name,
  email,
}: JWTPayload): Promise<string | null> {
  const cookieStore = await cookies();
  const expiration = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const session = await encrypt({ id, name, email });

  if (!session) {
    return null;
  }

  cookieStore.set("session", session, {
    httpOnly: true,
    secure: true,
    expires: expiration,
    maxAge: 30 * 24 * 60 * 60,
    sameSite: "lax",
    path: "/",
  });

  return session;
}

// Returns decrypted session data from cookie.
export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;

  if (!sessionCookie) {
    return null;
  }

  const session = await decrypt(sessionCookie);
  return session;
}

// Delete session cookie.
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}
