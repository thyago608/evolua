import "./load-env";
import { db, schema } from "../src/db";

/**
 * Cria um formulário padrão (e o ativa) se ainda não houver nenhum.
 * Uso: npm run seed
 */
async function main() {
  const existing = await db.select().from(schema.forms).limit(1);
  if (existing.length > 0) {
    console.log("Já existe formulário. Nada a fazer.");
    return;
  }

  const [form] = await db
    .insert(schema.forms)
    .values({ title: "Pesquisa de acompanhamento", isActive: true })
    .returning();

  await db.insert(schema.formQuestions).values([
    {
      formId: form.id,
      order: 0,
      type: "scale",
      label: "De 0 a 10, como você avalia seu atendimento?",
      options: { min: 0, max: 10 },
      required: true,
    },
    {
      formId: form.id,
      order: 1,
      type: "single_choice",
      label: "Como está se sentindo em relação ao seu tratamento?",
      options: ["Muito bem", "Bem", "Regular", "Mal", "Muito mal"],
      required: true,
    },
    {
      formId: form.id,
      order: 2,
      type: "boolean",
      label: "Você tem conseguido seguir as orientações médicas?",
      options: null,
      required: true,
    },
    {
      formId: form.id,
      order: 3,
      type: "textarea",
      label: "Deseja relatar algo para a equipe?",
      options: null,
      required: false,
    },
  ]);

  console.log("Formulário padrão criado e ativado:", form.title);
}

main().then(() => process.exit(0));
