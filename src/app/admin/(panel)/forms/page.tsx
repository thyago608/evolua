import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { forms, formQuestions } from "@/db/schema";
import { formatDateBR } from "@/lib/dates";
import { activateFormAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { CircleHelp, Pencil } from "lucide-react";
import { FORM_BRANCH_LABEL, type FormBranch } from "@/lib/patient-branches";
import { NewFormControls } from "./new-form-controls";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const dynamic = "force-dynamic";

type FormRow = {
  id: string;
  title: string;
  branch: FormBranch;
  isActive: boolean;
  createdAt: Date;
  questionCount: number;
};

function FormListSection({
  title,
  branch,
  description,
  forms: sectionForms,
}: {
  title: string;
  branch: FormBranch;
  description: string;
  forms: FormRow[];
}) {
  return (
    <section className="space-y-3">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={`Entenda o ramo ${FORM_BRANCH_LABEL[branch]}`}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <CircleHelp className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">{description}</TooltipContent>
          </Tooltip>
        </div>
        <p className="text-sm text-muted-foreground">
          Apenas um formulário pode ficar ativo neste ramo.
        </p>
      </div>

      {sectionForms.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-5 text-sm text-muted-foreground">
            Nenhum formulário de {FORM_BRANCH_LABEL[branch].toLowerCase()} ainda.
          </CardContent>
        </Card>
      ) : (
        sectionForms.map((form) => (
          <Card key={form.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{form.title}</span>
                  {form.isActive ? (
                    <Badge variant="success">Ativo</Badge>
                  ) : (
                    <Badge variant="outline">Inativo</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {form.questionCount} pergunta(s) · criado em{" "}
                  {formatDateBR(form.createdAt)}
                </p>
              </div>
              <div className="flex gap-2">
                {!form.isActive && (
                  <form action={activateFormAction}>
                    <input type="hidden" name="formId" value={form.id} />
                    <Button
                      type="submit"
                      variant="outline"
                      size="sm"
                      disabled={form.questionCount === 0}
                      title={
                        form.questionCount === 0
                          ? "Adicione perguntas antes de ativar"
                          : undefined
                      }
                    >
                      Ativar
                    </Button>
                  </form>
                )}
                <Button asChild variant="outline" size="sm">
                  <Link href={`/admin/forms/${form.id}`}>
                    <Pencil className="h-4 w-4" />
                    Editar
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </section>
  );
}

export default async function FormsPage() {
  const rows = (await db
    .select({
      id: forms.id,
      title: forms.title,
      branch: forms.branch,
      isActive: forms.isActive,
      createdAt: forms.createdAt,
      questionCount: sql<number>`count(${formQuestions.id})`.mapWith(Number),
    })
    .from(forms)
    .leftJoin(formQuestions, eq(formQuestions.formId, forms.id))
    .groupBy(forms.id)
    .orderBy(desc(forms.createdAt))) as FormRow[];

  return (
    <TooltipProvider>
      <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Formulários</h1>
          <p className="text-muted-foreground">
            Crie e edite os questionários. Cada ramo possui seu próprio
            formulário ativo.
          </p>
        </div>
        <NewFormControls />
      </div>

      <div className="space-y-8">
        <FormListSection
          title="Formulários para novos pacientes"
          branch="novo"
          description="Para pacientes recém-chegados à base. Este ramo não utiliza vigência de plano."
          forms={rows.filter((form) => form.branch === "novo")}
        />
        <FormListSection
          title="Formulários de Segmentos"
          branch="segmento"
          description="Para pacientes sem acompanhamento ativo. Eles podem migrar para Acompanhamento e também retornar a este ramo."
          forms={rows.filter((form) => form.branch === "segmento")}
        />
        <FormListSection
          title="Formulários de Acompanhamentos"
          branch="acompanhamento"
          description="Para pacientes em acompanhamento, com vigência de plano definida."
          forms={rows.filter((form) => form.branch === "acompanhamento")}
        />
      </div>
      </div>
    </TooltipProvider>
  );
}
