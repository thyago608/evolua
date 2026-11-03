import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { invites, forms, formQuestions } from "@/db/schema";
import { SurveyForm, type PublicQuestion } from "./survey-form";
import { CheckCircle2, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-muted/40 px-4 py-10">
      <div className="mx-auto max-w-2xl">{children}</div>
    </main>
  );
}

export default async function SurveyPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const [invite] = await db
    .select()
    .from(invites)
    .where(eq(invites.token, token))
    .limit(1);

  if (!invite || invite.status === "expired") {
    return (
      <Shell>
        <div className="rounded-xl border bg-background p-8 text-center">
          <XCircle className="mx-auto mb-3 h-10 w-10 text-destructive" />
          <h1 className="text-xl font-semibold">Link inválido</h1>
          <p className="mt-2 text-muted-foreground">
            Este link não é válido ou não está mais ativo. Entre em contato com
            a clínica.
          </p>
        </div>
      </Shell>
    );
  }

  if (invite.status === "completed") {
    return (
      <Shell>
        <div className="rounded-xl border bg-background p-8 text-center">
          <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-600" />
          <h1 className="text-xl font-semibold">Pesquisa já respondida</h1>
          <p className="mt-2 text-muted-foreground">
            Obrigado! Já recebemos suas respostas.
          </p>
        </div>
      </Shell>
    );
  }

  const [form] = await db
    .select()
    .from(forms)
    .where(eq(forms.id, invite.formId))
    .limit(1);

  const questions = await db
    .select()
    .from(formQuestions)
    .where(eq(formQuestions.formId, invite.formId))
    .orderBy(asc(formQuestions.order));

  const publicQuestions: PublicQuestion[] = questions.map((q) => ({
    id: q.id,
    type: q.type,
    label: q.label,
    required: q.required,
    options: q.options as PublicQuestion["options"],
  }));

  return (
    <Shell>
      <div className="rounded-xl border bg-background p-6 sm:p-8">
        <header className="mb-6 border-b pb-4">
          <h1 className="text-2xl font-semibold">
            {form?.title ?? "Pesquisa"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Suas respostas são importantes para o seu acompanhamento.
          </p>
        </header>
        {publicQuestions.length === 0 ? (
          <p className="text-muted-foreground">
            Este formulário ainda não possui perguntas.
          </p>
        ) : (
          <SurveyForm token={token} questions={publicQuestions} />
        )}
      </div>
    </Shell>
  );
}
