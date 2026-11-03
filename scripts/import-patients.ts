import "./load-env";
import * as XLSX from "xlsx";
import { and, eq } from "drizzle-orm";
import { db } from "../src/db";
import { patients } from "../src/db/schema";

type SpreadsheetRow = {
  Data?: unknown;
  "Data Final"?: unknown;
  Status?: unknown;
  Nome?: unknown;
  "Plano contratado"?: unknown;
};

const filePath = process.env.INPUT_XLSX;

if (!filePath) {
  throw new Error(
    "Defina INPUT_XLSX com o caminho para a planilha antes de importar."
  );
}

const sourcePath = filePath;

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Converte data do Excel, Date ou DD/MM/AAAA em YYYY-MM-DD. */
function toIsoDate(value: unknown, field: string): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatDate(value.getFullYear(), value.getMonth() + 1, value.getDate());
  }

  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) return formatDate(parsed.y, parsed.m, parsed.d);
  }

  const raw = text(value);
  const brazilian = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw);
  if (brazilian) {
    return formatDate(
      Number(brazilian[3]),
      Number(brazilian[2]),
      Number(brazilian[1])
    );
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  throw new Error(`${field} inválida: ${raw || "vazia"}`);
}

async function main() {
  const workbook = XLSX.readFile(sourcePath, { cellDates: true });
  const worksheet = workbook.Sheets.Pacientes;
  if (!worksheet) throw new Error('A aba "Pacientes" não foi encontrada.');

  const rows = XLSX.utils.sheet_to_json<SpreadsheetRow>(worksheet, {
    defval: "",
  });

  const candidates = rows.filter((row) => {
    const status = text(row.Status);
    const name = text(row.Nome);
    return name && status.toLocaleLowerCase("pt-BR") !== "cancelado";
  });

  let created = 0;
  let skipped = 0;

  for (const row of candidates) {
    const name = text(row.Nome);
    const planStartDate = toIsoDate(row.Data, `Início de ${name}`);
    const planEndDate = toIsoDate(row["Data Final"], `Fim de ${name}`);

    const [existing] = await db
      .select({ id: patients.id })
      .from(patients)
      .where(
        and(
          eq(patients.name, name),
          eq(patients.planStartDate, planStartDate),
          eq(patients.planEndDate, planEndDate)
        )
      )
      .limit(1);

    if (existing) {
      skipped++;
      continue;
    }

    await db.insert(patients).values({
      name,
      cpf: null,
      birthDate: null,
      planStartDate,
      planEndDate,
      planName: text(row["Plano contratado"]) || null,
      planStatus: text(row.Status) || null,
    });
    created++;
  }

  console.log(
    `Importação concluída: ${created} criado(s), ${skipped} já existente(s), ${candidates.length} linha(s) elegível(is).`
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Falha na importação:", error);
    process.exit(1);
  });
