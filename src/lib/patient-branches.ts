export const PATIENT_BRANCHES = [
  "acompanhamento",
  "novo",
  "segmento",
] as const;

export type PatientBranch = (typeof PATIENT_BRANCHES)[number];
export type FormBranch = PatientBranch;

export const PATIENT_BRANCH_LABEL: Record<PatientBranch, string> = {
  acompanhamento: "Acompanhamento",
  novo: "Novos",
  segmento: "Segmento",
};

export const FORM_BRANCH_LABEL: Record<FormBranch, string> = {
  acompanhamento: "Acompanhamento",
  novo: "Novos",
  segmento: "Segmento",
};

/** Cada ramo utiliza seu próprio formulário ativo. */
export function formBranchForPatientBranch(branch: PatientBranch): FormBranch {
  return branch;
}

export function branchRequiresPlan(branch: PatientBranch) {
  return branch === "acompanhamento";
}
