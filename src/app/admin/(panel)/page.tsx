import Link from "next/link";
import { desc } from "drizzle-orm";
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

export const dynamic = "force-dynamic";

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

async function getDashboardData() {
  const now = new Date();

  const [allPatients, allInvites, allResponses, activeForm] =
    await Promise.all([
      db.select().from(patients).orderBy(desc(patients.createdAt)),
      db.select().from(invites).orderBy(desc(invites.createdAt)),
      db.select().from(responses),
      db.select().from(forms).where(eq(forms.isActive, true)).limit(1),
    ]);

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

export default async function DashboardPage() {
  const { rows, hasActiveForm, totalUnseen, needsResendCount } =
    await getDashboardData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Painel</h1>
          <p className="text-muted-foreground">
            {rows.length} paciente(s) cadastrado(s).
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
            <CardTitle className="text-3xl">{rows.length}</CardTitle>
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
                      <PatientLinkDialog
                        patientId={row.id}
                        patientName={row.name}
                        activeInvite={row.activeInvite}
                        lastInviteCompleted={row.latestInviteStatus === "completed"}
                        surveyUrl={row.surveyUrl}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
