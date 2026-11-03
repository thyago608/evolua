import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { forms, formQuestions } from "@/db/schema";
import { formatDateBR } from "@/lib/dates";
import { activateFormAction, createFormAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Pencil, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function FormsPage() {
  const rows = await db
    .select({
      id: forms.id,
      title: forms.title,
      isActive: forms.isActive,
      createdAt: forms.createdAt,
      questionCount: sql<number>`count(${formQuestions.id})`.mapWith(Number),
    })
    .from(forms)
    .leftJoin(formQuestions, eq(formQuestions.formId, forms.id))
    .groupBy(forms.id)
    .orderBy(desc(forms.createdAt));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Formulários</h1>
        <p className="text-muted-foreground">
          Crie e edite os questionários. Apenas um formulário fica ativo por
          vez — é ele que os pacientes respondem.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novo formulário</CardTitle>
          <CardDescription>Dê um título para começar.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createFormAction} className="flex gap-2">
            <Input
              name="title"
              placeholder="Ex: Pesquisa de satisfação trimestral"
              className="max-w-md"
            />
            <Button type="submit">
              <Plus className="h-4 w-4" />
              Criar
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {rows.length === 0 ? (
          <p className="text-muted-foreground">Nenhum formulário ainda.</p>
        ) : (
          rows.map((f) => (
            <Card key={f.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{f.title}</span>
                    {f.isActive ? (
                      <Badge variant="success">Ativo</Badge>
                    ) : (
                      <Badge variant="outline">Inativo</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {f.questionCount} pergunta(s) · criado em{" "}
                    {formatDateBR(f.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!f.isActive && (
                    <form action={activateFormAction}>
                      <input type="hidden" name="formId" value={f.id} />
                      <Button
                        type="submit"
                        variant="outline"
                        size="sm"
                        disabled={f.questionCount === 0}
                        title={
                          f.questionCount === 0
                            ? "Adicione perguntas antes de ativar"
                            : undefined
                        }
                      >
                        Ativar
                      </Button>
                    </form>
                  )}
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/forms/${f.id}`}>
                      <Pencil className="h-4 w-4" />
                      Editar
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
