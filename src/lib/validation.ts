import { z } from "zod";

/** Remove tudo que não for dígito. */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Valida CPF pelo algoritmo dos dígitos verificadores. */
export function isValidCPF(raw: string): boolean {
  const cpf = onlyDigits(raw);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false; // todos iguais

  const calcCheck = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) {
      sum += parseInt(cpf[i], 10) * (len + 1 - i);
    }
    const mod = (sum * 10) % 11;
    return mod === 10 ? 0 : mod;
  };

  return (
    calcCheck(9) === parseInt(cpf[9], 10) &&
    calcCheck(10) === parseInt(cpf[10], 10)
  );
}

/** Formata CPF como 000.000.000-00. */
export function formatCPF(raw: string): string {
  const cpf = onlyDigits(raw).slice(0, 11);
  return cpf
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

/**
 * Normaliza telefone brasileiro para E.164 (+55...).
 * Aceita com ou sem +55, com DDD. Retorna null se inválido.
 */
export function toE164BR(raw: string): string | null {
  let digits = onlyDigits(raw);
  if (digits.startsWith("55") && digits.length >= 12) {
    // já tem código do país
  } else if (digits.length === 10 || digits.length === 11) {
    digits = "55" + digits;
  } else {
    return null;
  }
  // 55 + DDD(2) + número(8 ou 9) => 12 ou 13 dígitos
  if (digits.length !== 12 && digits.length !== 13) return null;
  return "+" + digits;
}

// CPF e nascimento são opcionais: podem ser preenchidos depois do cadastro.
// Uma string vazia (campo deixado em branco) é tratada como "não informado".
const optionalCPF = z
  .string()
  .optional()
  .refine((v) => !v || isValidCPF(v), "CPF inválido.");

const optionalDate = (message: string) =>
  z
    .string()
    .optional()
    .refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), message);

export const patientBaseSchema = z.object({
  cpf: optionalCPF,
  name: z.string().trim().min(2, "Informe o nome completo."),
  birthDate: optionalDate("Data de nascimento inválida."),
  planStartDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data de início da vigência inválida."),
  planEndDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data de fim da vigência inválida."),
});

export const patientSchema = patientBaseSchema.refine(
  (data) => data.planEndDate >= data.planStartDate,
  {
    message: "O fim da vigência deve ser igual ou posterior ao início.",
    path: ["planEndDate"],
  }
);

export const patientDetailsSchema = patientBaseSchema.pick({
  cpf: true,
  birthDate: true,
});

export type PatientInput = z.infer<typeof patientSchema>;
export type PatientDetailsInput = z.infer<typeof patientDetailsSchema>;
