"use client";

import { useActionState, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  deletePatientAction,
  type DeletePatientState,
} from "./actions";

export function DeletePatientDialog({
  patientId,
  patientName,
}: {
  patientId: string;
  patientName: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<
    DeletePatientState,
    FormData
  >(deletePatientAction, {});

  useEffect(() => {
    if (state.deletedAt) setOpen(false);
  }, [state.deletedAt]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          aria-label={`Excluir ${patientName}`}
          title="Excluir paciente"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir paciente?</DialogTitle>
          <DialogDescription>
            Você está prestes a excluir <strong>{patientName}</strong>. Os
            links e respostas deste paciente também serão removidos. Esta ação
            não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <input type="hidden" name="patientId" value={patientId} />
          {state.error && (
            <p className="mb-4 text-sm text-destructive">{state.error}</p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? "Excluindo..." : "Excluir paciente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
