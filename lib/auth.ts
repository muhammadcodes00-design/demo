import { scryptSync, randomBytes, timingSafeEqual, createHmac } from "node:crypto";
import { cookies } from "next/headers";

const SECRET = process.env.AUTH_SECRET || "invortech-ds-secret-key-2026-demo";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const computed = scryptSync(password, salt, 64);
    const storedBuf = Buffer.from(hash, "hex");
    return timingSafeEqual(computed, storedBuf);
  } catch {
    return false;
  }
}

export function createToken(payload: { email: string; name: string }): string {
  const data = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 3600 * 1000 })).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function verifyToken(token: string): { email: string; name: string } | null {
  try {
    const [data, sig] = token.split(".");
    if (!data || !sig) return null;
    const expectedSig = createHmac("sha256", SECRET).update(data).digest("base64url");
    if (sig !== expectedSig) return null;
    const parsed = JSON.parse(Buffer.from(data, "base64url").toString("utf-8"));
    if (parsed.exp && parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("invortech_session")?.value;
  if (!token) return null;
  return verifyToken(token);
}
