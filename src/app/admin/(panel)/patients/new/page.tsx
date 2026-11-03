"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import {
  createPatientAction,
  type PatientFormState,
} from "../actions";
import { formatCPF, isValidCPF, onlyDigits } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NewPatientPage() {
  const [state, formAction, pending] = useActionState<
    PatientFormState,
    FormData
  >(createPatientAction, {});

  const [cpf, setCpf] = useState("");
  const cpfDigits = onlyDigits(cpf);
  const cpfValid = cpfDigits.length === 11 && isValidCPF(cpf);
  const cpfShowError = cpfDigits.length === 11 && !cpfValid;

  const fe = state.fieldErrors ?? {};

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6">
        <Button asChild variant="link" className="px-0">
          <Link href="/admin">← Voltar ao painel</Link>
        </Button>
        <h1 className="text-2xl font-semibold">Novo paciente</h1>
        <p className="text-muted-foreground">
          Cadastre o paciente para depois gerar o link da pesquisa.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do paciente</CardTitle>
          <CardDescription>
            Nome e vigência são obrigatórios. CPF e nascimento podem ser
            preenchidos depois.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                name="name"
                placeholder="Digite o nome completo"
                required
              />
              {fe.name && (
                <p className="text-sm text-destructive">{fe.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">
                CPF{" "}
                <span className="font-normal text-muted-foreground">
                  (opcional)
                </span>
              </Label>
              <div className="relative">
                <Input
                  id="cpf"
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
              <Label htmlFor="birthDate">
                Data de nascimento{" "}
                <span className="font-normal text-muted-foreground">
                  (opcional)
                </span>
              </Label>
              <Input id="birthDate" name="birthDate" type="date" />
              {fe.birthDate && (
                <p className="text-sm text-destructive">{fe.birthDate}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Vigência do plano</Label>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="planStartDate"
                    className="text-xs font-normal text-muted-foreground"
                  >
                    Início
                  </Label>
                  <Input
                    id="planStartDate"
                    name="planStartDate"
                    type="date"
                    required
                  />
                  {fe.planStartDate && (
                    <p className="text-sm text-destructive">
                      {fe.planStartDate}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="planEndDate"
                    className="text-xs font-normal text-muted-foreground"
                  >
                    Fim
                  </Label>
                  <Input
                    id="planEndDate"
                    name="planEndDate"
                    type="date"
                    required
                  />
                  {fe.planEndDate && (
                    <p className="text-sm text-destructive">
                      {fe.planEndDate}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {state.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={pending}>
                {pending ? "Salvando..." : "Cadastrar paciente"}
              </Button>
              <Button asChild variant="outline" type="button">
                <Link href="/admin">Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
