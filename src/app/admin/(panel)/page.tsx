import Link from "next/link";
import { count, desc } from "drizzle-orm";
import { db } from "@/db";
import { patients, invites, responses, forms } from "@/db/schema";
import { eq } from "drizzle-orm";
import { formatDateBR } from "@/lib/dates";
import { buildSurveyUrl } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserPlus, AlertTriangle } from "lucide-react";
import { PatientLinkDialog } from "./patients/patient-link-dialog";
import { DeletePatientDialog } from "./patients/delete-patient-dialog";

export const dynamic = "force-dynamic";
const PATIENTS_PER_PAGE = 10;

type PatientRow = {
  id: string;
  name: string;
  phone: string | null;
  createdAt: Date;
  latestInviteStatus: string | null;
  latestDueAt: Date | null;
  responseCount: number;
  unseenCount: number;
  needsResend: boolean;
  activeInvite: { id: string; status: "pending" | "sent"; dueAt: Date } | null;
  surveyUrl: string | null;
};

async function getDashboardData(requestedPage: number) {
  const now = new Date();

  const [patientCountResult, allInvites, allResponses, activeForm] =
    await Promise.all([
      db.select({ total: count() }).from(patients),
      db.select().from(invites).orderBy(desc(invites.createdAt)),
      db.select().from(responses),
      db.select().from(forms).where(eq(forms.isActive, true)).limit(1),
    ]);

  const totalPatients = patientCountResult[0]?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalPatients / PATIENTS_PER_PAGE));
  const currentPage = Math.min(Math.max(requestedPage, 1), totalPages);
  const allPatients = await db
    .select()
    .from(patients)
    .orderBy(desc(patients.createdAt))
    .limit(PATIENTS_PER_PAGE)
    .offset((currentPage - 1) * PATIENTS_PER_PAGE);

  const latestInviteByPatient = new Map<string, (typeof allInvites)[number]>();
  for (const inv of allInvites) {
    // allInvites já vem ordenado desc por createdAt
    if (!latestInviteByPatient.has(inv.patientId)) {
      latestInviteByPatient.set(inv.patientId, inv);
    }
  }

  const respCount = new Map<string, number>();
  const unseenCount = new Map<string, number>();
  for (const r of allResponses) {
    respCount.set(r.patientId, (respCount.get(r.patientId) ?? 0) + 1);
    if (!r.seen) {
      unseenCount.set(r.patientId, (unseenCount.get(r.patientId) ?? 0) + 1);
    }
  }

  const rows: PatientRow[] = allPatients.map((p) => {
    const inv = latestInviteByPatient.get(p.id) ?? null;
    const needsResend =
      !!inv &&
      inv.status === "completed" &&
      inv.dueAt !== null &&
      new Date(inv.dueAt) <= now;

    const activeInvite =
      inv && (inv.status === "pending" || inv.status === "sent")
        ? { id: inv.id, status: inv.status, dueAt: new Date(inv.dueAt) }
        : null;

    const surveyUrl = inv && activeInvite ? buildSurveyUrl(inv.token) : null;

    return {
      id: p.id,
      name: p.name,
      phone: p.phone,
      createdAt: p.createdAt,
      latestInviteStatus: inv?.status ?? null,
      latestDueAt: inv?.dueAt ? new Date(inv.dueAt) : null,
      responseCount: respCount.get(p.id) ?? 0,
      unseenCount: unseenCount.get(p.id) ?? 0,
      needsResend,
      activeInvite,
      surveyUrl,
    };
  });

  return {
    rows,
    totalPatients,
    totalPages,
    currentPage,
    hasActiveForm: activeForm.length > 0,
    totalUnseen: allResponses.filter((r) => !r.seen).length,
    needsResendCount: rows.filter((r) => r.needsResend).length,
  };
}

function StatusBadge({ row }: { row: PatientRow }) {
  if (row.needsResend) {
    return <Badge variant="warning">Reenvio pendente</Badge>;
  }
  switch (row.latestInviteStatus) {
    case null:
      return <Badge variant="outline">Sem link</Badge>;
    case "pending":
      return <Badge variant="secondary">Link gerado</Badge>;
    case "sent":
      return <Badge variant="default">Aguardando resposta</Badge>;
    case "completed":
      return <Badge variant="success">Respondido</Badge>;
    default:
      return <Badge variant="outline">—</Badge>;
  }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawPage = Array.isArray(params.page) ? params.page[0] : params.page;
  const parsedPage = Number.parseInt(rawPage ?? "1", 10);
  const requestedPage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const {
    rows,
    totalPatients,
    totalPages,
    currentPage,
    hasActiveForm,
    totalUnseen,
    needsResendCount,
  } = await getDashboardData(requestedPage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Painel</h1>
          <p className="text-muted-foreground">
            {totalPatients} paciente(s) cadastrado(s).
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/patients/new">
            <UserPlus className="h-4 w-4" />
            Novo paciente
          </Link>
        </Button>
      </div>

      {!hasActiveForm && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="flex items-center gap-3 py-4 text-amber-800">
            <AlertTriangle className="h-5 w-5" />
            <span>
              Nenhum formulário ativo.{" "}
              <Link href="/admin/forms" className="font-medium underline">
                Ative um formulário
              </Link>{" "}
              para conseguir gerar links.
            </span>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pacientes</CardDescription>
            <CardTitle className="text-3xl">{totalPatients}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Respostas novas</CardDescription>
            <CardTitle className="text-3xl">{totalUnseen}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Reenvios pendentes</CardDescription>
            <CardTitle className="text-3xl">{needsResendCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pacientes</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Nenhum paciente ainda. Comece cadastrando um.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Próximo ciclo</TableHead>
                  <TableHead className="text-center">Respostas</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/admin/patients/${row.id}`}
                        className="hover:underline"
                      >
                        {row.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <StatusBadge row={row} />
                    </TableCell>
                    <TableCell>{formatDateBR(row.latestDueAt)}</TableCell>
                    <TableCell className="text-center">
                      {row.responseCount}
                      {row.unseenCount > 0 && (
                        <Badge variant="destructive" className="ml-2">
                          {row.unseenCount} nova(s)
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <PatientLinkDialog
                          patientId={row.id}
                          patientName={row.name}
                          activeInvite={row.activeInvite}
                          lastInviteCompleted={row.latestInviteStatus === "completed"}
                          surveyUrl={row.surveyUrl}
                        />
                        <DeletePatientDialog
                          patientId={row.id}
                          patientName={row.name}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        {totalPatients > PATIENTS_PER_PAGE && (
          <div className="flex flex-col gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </p>
            <div className="flex items-center gap-1">
              {currentPage > 1 ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/admin?page=${currentPage - 1}`}>Anterior</Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  Anterior
                </Button>
              )}
              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (page) => (
                  <Button
                    key={page}
                    asChild={page !== currentPage}
                    variant={page === currentPage ? "default" : "outline"}
                    size="sm"
                    disabled={page === currentPage}
                  >
                    {page === currentPage ? <span>{page}</span> : <Link href={`/admin?page=${page}`}>{page}</Link>}
                  </Button>
                )
              )}
              {currentPage < totalPages ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/admin?page=${currentPage + 1}`}>Próxima</Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  Próxima
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
