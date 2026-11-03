"use client";

import { Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatDateBR } from "@/lib/dates";
import {
  CopyField,
  GenerateLinkButton,
  MarkSentButton,
} from "./[id]/link-actions";

export interface PatientLinkDialogProps {
  patientId: string;
  patientName: string;
  activeInvite: {
    id: string;
    status: "pending" | "sent";
    dueAt: Date;
  } | null;
  lastInviteCompleted: boolean;
  surveyUrl: string | null;
}

export function PatientLinkDialog({
  patientId,
  patientName,
  activeInvite,
  lastInviteCompleted,
  surveyUrl,
}: PatientLinkDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Link2 className="h-4 w-4" />
          Link
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link da pesquisa</DialogTitle>
          <DialogDescription>
            {patientName} · envio manual.
          </DialogDescription>
        </DialogHeader>

        {activeInvite && surveyUrl ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Status:</span>
              {activeInvite.status === "sent" ? (
                <Badge variant="default">Enviado</Badge>
              ) : (
                <Badge variant="secondary">Gerado (não enviado)</Badge>
              )}
              <span className="text-muted-foreground">
                · ciclo até {formatDateBR(activeInvite.dueAt)}
              </span>
            </div>
            <CopyField value={surveyUrl} />
            <div className="flex flex-wrap gap-2">
              {activeInvite.status !== "sent" && (
                <MarkSentButton
                  inviteId={activeInvite.id}
                  patientId={patientId}
                />
              )}
              <GenerateLinkButton patientId={patientId} hasLink />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {lastInviteCompleted
                ? "Última pesquisa respondida. Gere um novo link para o próximo ciclo."
                : "Nenhum link ativo para este paciente."}
            </p>
            <GenerateLinkButton patientId={patientId} hasLink={false} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
