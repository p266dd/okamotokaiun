import { SignJWT, jwtVerify, JWTPayload } from "jose";

const jwtSecret = new TextEncoder().encode(process.env.SECRET);
const expiration = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

export async function encrypt(payload: JWTPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiration)
    .sign(jwtSecret);
}

export async function decrypt(
  session: string | Uint8Array<ArrayBufferLike>
): Promise<JWTPayload | null> {
  try {
    const decrypt = await jwtVerify(session, jwtSecret, {
      algorithms: ["HS256"],
    });
    return decrypt.payload;
  } catch (error) {
    console.error("Decrypt error: ", error);
    return null;
  }
}
