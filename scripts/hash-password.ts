import bcrypt from "bcryptjs";

/**
 * Uso: npm run hash-password -- "suaSenhaForte"
 * Copie o hash resultante para ADMIN_PASSWORD_HASH no .env / Vercel.
 */
async function main() {
  const password = process.argv[2];
  if (!password) {
    console.error('Uso: npm run hash-password -- "suaSenha"');
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 10);
  console.log(hash);
}

main();
