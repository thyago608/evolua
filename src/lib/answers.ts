export type AnswerValue = string | string[] | number | boolean | null;

/** Formato persistido em responses.answers (snapshot da pergunta). */
export interface StoredAnswer {
  questionId: string;
  label: string;
  type: string;
  value: AnswerValue;
}

/** Converte o valor de uma resposta em texto legível. */
export function renderAnswerValue(answer: StoredAnswer): string {
  const { value, type } = answer;
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : "—";
  }
  if (type === "boolean") {
    return value === true || value === "true" ? "Sim" : "Não";
  }
  return String(value);
}
