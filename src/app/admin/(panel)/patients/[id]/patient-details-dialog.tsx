"use client";

import { useActionState, useEffect, useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatCPF, isValidCPF, onlyDigits } from "@/lib/validation";
import {
  updatePatientDetailsAction,
  type PatientDetailsState,
} from "../actions";

export function PatientDetailsDialog({
  patientId,
  currentCpf,
  currentBirthDate,
}: {
  patientId: string;
  currentCpf: string | null;
  currentBirthDate: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [cpf, setCpf] = useState(currentCpf ? formatCPF(currentCpf) : "");
  const [state, formAction, pending] = useActionState<
    PatientDetailsState,
    FormData
  >(updatePatientDetailsAction, {});

  const cpfDigits = onlyDigits(cpf);
  const cpfValid = cpfDigits.length === 11 && isValidCPF(cpf);
  const cpfShowError = cpfDigits.length === 11 && !cpfValid;
  const fe = state.fieldErrors ?? {};

  const hasMissingInfo = !currentCpf || !currentBirthDate;

  useEffect(() => {
    if (state.ok && state.savedAt) {
      setOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.savedAt]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setCpf(currentCpf ? formatCPF(currentCpf) : "");
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Pencil className="h-4 w-4" />
          {hasMissingInfo ? "Completar dados" : "Editar CPF/nascimento"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>CPF e data de nascimento</DialogTitle>
          <DialogDescription>
            Esses dados podem ser preenchidos agora ou mais tarde.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="patientId" value={patientId} />

          <div className="space-y-2">
            <Label htmlFor="edit-cpf">CPF</Label>
            <div className="relative">
              <Input
                id="edit-cpf"
                name="cpf"
                value={cpf}
                onChange={(e) => setCpf(formatCPF(e.target.value))}
                placeholder="000.000.000-00"
                inputMode="numeric"
                className="pr-9"
              />
              {cpfDigits.length === 11 && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  {cpfValid ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <X className="h-4 w-4 text-destructive" />
                  )}
                </span>
              )}
            </div>
            {(cpfShowError || fe.cpf) && (
              <p className="text-sm text-destructive">
                {fe.cpf ?? "CPF inválido."}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-birthDate">Data de nascimento</Label>
            <Input
              id="edit-birthDate"
              name="birthDate"
              type="date"
              defaultValue={currentBirthDate ?? ""}
            />
            {fe.birthDate && (
              <p className="text-sm text-destructive">{fe.birthDate}</p>
            )}
          </div>

          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          {state.ok && (
            <p className="text-sm text-emerald-600">Dados atualizados.</p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
