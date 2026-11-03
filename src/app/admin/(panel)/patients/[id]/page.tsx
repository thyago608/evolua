import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { patients, invites, responses } from "@/db/schema";
import { formatDateBR, formatDateTimeBR } from "@/lib/dates";
import { formatCPF } from "@/lib/validation";
import { buildSurveyUrl } from "@/lib/whatsapp";
import type { StoredAnswer } from "@/lib/answers";
import { renderAnswerValue } from "@/lib/answers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CopyField, GenerateLinkButton, MarkSentButton } from "./link-actions";
import { PatientDetailsDialog } from "./patient-details-dialog";

export const dynamic = "force-dynamic";

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [patient] = await db
    .select()
    .from(patients)
    .where(eq(patients.id, id))
    .limit(1);

  if (!patient) notFound();

  const [latestInvite] = await db
    .select()
    .from(invites)
    .where(eq(invites.patientId, id))
    .orderBy(desc(invites.createdAt))
    .limit(1);

  const history = await db
    .select()
    .from(responses)
    .where(eq(responses.patientId, id))
    .orderBy(desc(responses.submittedAt));

  // Marca as respostas deste paciente como vistas.
  const hasUnseen = history.some((r) => !r.seen);
  if (hasUnseen) {
    await db
      .update(responses)
      .set({ seen: true })
      .where(and(eq(responses.patientId, id), eq(responses.seen, false)));
  }

  const activeLink =
    latestInvite &&
    (latestInvite.status === "pending" || latestInvite.status === "sent")
      ? latestInvite
      : null;

  const surveyUrl = activeLink ? buildSurveyUrl(activeLink.token) : null;

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="link" className="px-0">
          <Link href="/admin">← Voltar ao painel</Link>
        </Button>
        <h1 className="text-2xl font-semibold">{patient.name}</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Dados do paciente */}
        <Card>
          <CardHeader>
            <CardTitle>Dados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row
              label="CPF"
              value={patient.cpf ? formatCPF(patient.cpf) : "Não informado"}
            />
            <Row
              label="Nascimento"
              value={
                patient.birthDate
                  ? formatDateBR(patient.birthDate)
                  : "Não informado"
              }
            />
            <Row
              label="Vigência do plano"
              value={`${formatDateBR(patient.planStartDate)} a ${formatDateBR(patient.planEndDate)}`}
            />
            {patient.phone && <Row label="Telefone" value={patient.phone} />}
            <div className="pt-2">
              <PatientDetailsDialog
                patientId={patient.id}
                currentCpf={patient.cpf}
                currentBirthDate={patient.birthDate}
              />
            </div>
          </CardContent>
        </Card>

        {/* Link da pesquisa */}
        <Card>
          <CardHeader>
            <CardTitle>Link da pesquisa</CardTitle>
            <CardDescription>
              Copie o link e envie manualmente ao paciente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeLink && surveyUrl ? (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  {activeLink.status === "sent" ? (
                    <Badge variant="default">Enviado</Badge>
                  ) : (
                    <Badge variant="secondary">Gerado (não enviado)</Badge>
                  )}
                  <span className="text-muted-foreground">
                    · ciclo até {formatDateBR(activeLink.dueAt)}
                  </span>
                </div>
                <CopyField value={surveyUrl} />
                <div className="flex flex-wrap gap-2">
                  {activeLink.status !== "sent" && (
                    <MarkSentButton
                      inviteId={activeLink.id}
                      patientId={patient.id}
                    />
                  )}
                  <GenerateLinkButton patientId={patient.id} hasLink />
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {latestInvite?.status === "completed"
                    ? "Última pesquisa respondida. Gere um novo link para o próximo ciclo."
                    : "Nenhum link ativo para este paciente."}
                </p>
                <GenerateLinkButton patientId={patient.id} hasLink={false} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Histórico de respostas */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de respostas</CardTitle>
          <CardDescription>
            {history.length} resposta(s) registrada(s).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {history.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground">
              Este paciente ainda não respondeu nenhuma pesquisa.
            </p>
          ) : (
            history.map((r, idx) => {
              const answers = (r.answers as unknown as StoredAnswer[]) ?? [];
              const responseNumber = history.length - idx;
              return (
                <Card key={r.id} className="overflow-hidden shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/40 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {responseNumber}
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold">
                          Resposta {responseNumber}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Enviada em {formatDateTimeBR(r.submittedAt)}
                        </p>
                      </div>
                    </div>
                    {idx === 0 && <Badge variant="secondary">Mais recente</Badge>}
                  </div>
                  <CardContent className="p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {answers.map((a, i) => (
                        <div
                          key={i}
                          className="rounded-lg border bg-muted/30 p-3"
                        >
                          <p className="text-xs font-medium text-muted-foreground">
                            {a.label}
                          </p>
                          <p className="text-sm">{renderAnswerValue(a)}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
