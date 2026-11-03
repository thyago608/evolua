/** Meses do ciclo de reenvio. */
export const CYCLE_MONTHS = 3;

/** Retorna uma nova data somando `months` meses. */
export function addMonths(from: Date, months: number): Date {
  const d = new Date(from);
  d.setMonth(d.getMonth() + months);
  return d;
}

/** Próxima data de vencimento (due) a partir de agora/base. */
export function nextDueDate(from: Date = new Date()): Date {
  return addMonths(from, CYCLE_MONTHS);
}

/** Formata data (YYYY-MM-DD ou Date) como DD/MM/AAAA. */
export function formatDateBR(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? parseLocalDate(value) : value;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Formata data e hora como DD/MM/AAAA HH:mm. */
export function formatDateTimeBR(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Interpreta "YYYY-MM-DD" como data local (evita shift de fuso). */
function parseLocalDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (match) {
    return new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3])
    );
  }
  return new Date(value);
}
