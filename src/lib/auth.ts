import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

export const SESSION_COOKIE = "session";
const SESSION_MAX_AGE = 60 * 60 * 8; // 8 horas

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET não configurada.");
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  user: string;
}

/** Assina um JWT de sessão. */
export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ user: payload.user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecretKey());
}

/** Verifica um token de sessão (compatível com Edge/middleware). */
export async function verifySessionToken(
  token: string | undefined
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.user === "string") {
      return { user: payload.user };
    }
    return null;
  } catch {
    return null;
  }
}

/** Valida usuário/senha contra as credenciais do admin (env). */
export async function verifyCredentials(
  user: string,
  password: string
): Promise<boolean> {
  const adminUser = process.env.ADMIN_USER;
  const adminHash = process.env.ADMIN_PASSWORD_HASH;
  if (!adminUser || !adminHash) {
    throw new Error("Credenciais do admin não configuradas no servidor.");
  }
  if (user !== adminUser) return false;
  return bcrypt.compare(password, adminHash);
}

/** Cria a sessão gravando o cookie httpOnly. */
export async function createSession(user: string): Promise<void> {
  const token = await signSession({ user });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

/** Remove a sessão. */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/** Lê a sessão atual (server components / actions). */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}
