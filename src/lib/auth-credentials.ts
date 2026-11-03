import "server-only";
import bcrypt from "bcryptjs";

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
