"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { createFormAction } from "./actions";
import { FORM_BRANCH_LABEL, type FormBranch } from "@/lib/patient-branches";

export function NewFormControls() {
  const [branch, setBranch] = useState<FormBranch>("acompanhamento");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button">
          <Plus className="h-4 w-4" />
          Novo formulário
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo formulário</DialogTitle>
          <DialogDescription>
            Informe o título e o ramo que utilizará este questionário.
          </DialogDescription>
        </DialogHeader>
        <form action={createFormAction} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="new-form-title" className="text-sm font-medium">
              Título do formulário
            </label>
            <Input
              id="new-form-title"
              name="title"
              placeholder="Ex: Pesquisa de satisfação trimestral"
              autoFocus
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Ramo</label>
            <input type="hidden" name="branch" value={branch} />
            <Select
              value={branch}
              onValueChange={(value) => setBranch(value as FormBranch)}
            >
              <SelectTrigger aria-label="Ramo do formulário">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="acompanhamento">
                  {FORM_BRANCH_LABEL.acompanhamento}
                </SelectItem>
                <SelectItem value="segmento">
                  {FORM_BRANCH_LABEL.segmento}
                </SelectItem>
                <SelectItem value="novo">{FORM_BRANCH_LABEL.novo}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit">
              <Plus className="h-4 w-4" />
              Criar formulário
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
