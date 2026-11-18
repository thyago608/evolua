"use client";

import { useActionState, useEffect, useState } from "react";
import { ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  PATIENT_BRANCH_LABEL,
  type PatientBranch,
} from "@/lib/patient-branches";
import {
  updatePatientBranchAction,
  type PatientBranchState,
} from "../actions";

export function PatientBranchDialog({
  patientId,
  currentBranch,
  currentPlanStartDate,
  currentPlanEndDate,
}: {
  patientId: string;
  currentBranch: PatientBranch;
  currentPlanStartDate: string | null;
  currentPlanEndDate: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [branch, setBranch] = useState<PatientBranch>(currentBranch);
  const [state, formAction, pending] = useActionState<
    PatientBranchState,
    FormData
  >(updatePatientBranchAction, {});
  const fieldErrors = state.fieldErrors ?? {};
  const requiresPlan = branch === "acompanhamento";

  useEffect(() => {
    if (state.savedAt) setOpen(false);
  }, [state.savedAt]);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) setBranch(currentBranch);
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <ArrowRightLeft className="h-4 w-4" />
          Alterar ramo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar ramo do paciente</DialogTitle>
          <DialogDescription>
            O histórico de respostas é preservado no ramo em que cada pesquisa
            foi respondida.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="patientId" value={patientId} />
          <div className="space-y-2">
            <Label htmlFor="patient-branch">Ramo atual</Label>
            <input type="hidden" name="branch" value={branch} />
            <Select
              value={branch}
              onValueChange={(value) => setBranch(value as PatientBranch)}
            >
              <SelectTrigger id="patient-branch">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(PATIENT_BRANCH_LABEL) as [
                  PatientBranch,
                  string,
                ][]).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {requiresPlan ? (
            <div className="space-y-2">
              <Label>Vigência do plano</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="branch-plan-start"
                    className="text-xs font-normal text-muted-foreground"
                  >
                    Início
                  </Label>
                  <Input
                    id="branch-plan-start"
                    name="planStartDate"
                    type="date"
                    defaultValue={currentPlanStartDate ?? ""}
                    required
                  />
                  {fieldErrors.planStartDate && (
                    <p className="text-sm text-destructive">
                      {fieldErrors.planStartDate}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="branch-plan-end"
                    className="text-xs font-normal text-muted-foreground"
                  >
                    Fim
                  </Label>
                  <Input
                    id="branch-plan-end"
                    name="planEndDate"
                    type="date"
                    defaultValue={currentPlanEndDate ?? ""}
                    required
                  />
                  {fieldErrors.planEndDate && (
                    <p className="text-sm text-destructive">
                      {fieldErrors.planEndDate}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
              {branch === "segmento"
                ? "Segmento não possui vigência e usa o formulário ativo de Segmento."
                : "Novos não possuem vigência e usam o formulário ativo de Novos."}
            </p>
          )}

          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Salvar ramo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
