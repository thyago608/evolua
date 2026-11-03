"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { saveFormAction, type SaveFormState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type QuestionType =
  | "text"
  | "textarea"
  | "single_choice"
  | "multi_choice"
  | "scale"
  | "boolean";

export interface EditorQuestion {
  clientId: string;
  type: QuestionType;
  label: string;
  required: boolean;
  options: string[] | { min: number; max: number } | null;
}

const TYPE_LABELS: Record<QuestionType, string> = {
  text: "Texto curto",
  textarea: "Texto longo",
  single_choice: "Escolha única",
  multi_choice: "Múltipla escolha",
  scale: "Escala (nota)",
  boolean: "Sim / Não",
};

let idCounter = 0;
function newQuestion(): EditorQuestion {
  idCounter += 1;
  return {
    clientId: `new-${idCounter}`,
    type: "text",
    label: "",
    required: true,
    options: null,
  };
}

function defaultOptionsFor(
  type: QuestionType
): EditorQuestion["options"] {
  if (type === "single_choice" || type === "multi_choice") return ["", ""];
  if (type === "scale") return { min: 1, max: 5 };
  return null;
}

/** Representação "persistível" usada para detectar alterações não salvas. */
function toSnapshot(title: string, questions: EditorQuestion[]) {
  return JSON.stringify({
    title,
    questions: questions.map((q) => ({
      type: q.type,
      label: q.label,
      required: q.required,
      options: q.options,
    })),
  });
}

export function FormEditor({
  formId,
  initialTitle,
  initialQuestions,
  isActive,
}: {
  formId: string;
  initialTitle: string;
  initialQuestions: EditorQuestion[];
  isActive: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [questions, setQuestions] = useState<EditorQuestion[]>(
    initialQuestions.length ? initialQuestions : []
  );
  const [state, formAction, pending] = useActionState<SaveFormState, FormData>(
    saveFormAction,
    {}
  );

  // Linha de base usada para saber se há alterações não salvas.
  const baselineRef = useRef(toSnapshot(initialTitle, initialQuestions));
  const dirty = toSnapshot(title, questions) !== baselineRef.current;

  // Após salvar com sucesso, a tela atual passa a ser a nova linha de base.
  useEffect(() => {
    if (state.ok && state.savedAt) {
      baselineRef.current = toSnapshot(title, questions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.savedAt]);

  // Avisa ao fechar/recarregar a aba com alterações não salvas.
  useEffect(() => {
    if (!dirty) return;
    function handler(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  function handleBack() {
    if (
      dirty &&
      !window.confirm(
        "Você tem alterações não salvas neste formulário. Sair sem salvar?"
      )
    ) {
      return;
    }
    router.push("/admin/forms");
  }

  function update(clientId: string, patch: Partial<EditorQuestion>) {
    setQuestions((qs) =>
      qs.map((q) => (q.clientId === clientId ? { ...q, ...patch } : q))
    );
  }

  function changeType(clientId: string, type: QuestionType) {
    update(clientId, { type, options: defaultOptionsFor(type) });
  }

  function remove(clientId: string) {
    setQuestions((qs) => qs.filter((q) => q.clientId !== clientId));
  }

  function move(index: number, dir: -1 | 1) {
    setQuestions((qs) => {
      const next = [...qs];
      const target = index + dir;
      if (target < 0 || target >= next.length) return qs;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function setOption(clientId: string, i: number, value: string) {
    setQuestions((qs) =>
      qs.map((q) => {
        if (q.clientId !== clientId || !Array.isArray(q.options)) return q;
        const opts = [...q.options];
        opts[i] = value;
        return { ...q, options: opts };
      })
    );
  }

  function addOption(clientId: string) {
    setQuestions((qs) =>
      qs.map((q) =>
        q.clientId === clientId && Array.isArray(q.options)
          ? { ...q, options: [...q.options, ""] }
          : q
      )
    );
  }

  function removeOption(clientId: string, i: number) {
    setQuestions((qs) =>
      qs.map((q) =>
        q.clientId === clientId && Array.isArray(q.options)
          ? { ...q, options: q.options.filter((_, idx) => idx !== i) }
          : q
      )
    );
  }

  const serialized = JSON.stringify(
    questions.map((q) => ({
      type: q.type,
      label: q.label,
      required: q.required,
      options: q.options,
    }))
  );

  return (
    <>
      <div>
        <Button
          type="button"
          variant="link"
          className="px-0"
          onClick={handleBack}
        >
          ← Voltar aos formulários
        </Button>
        <h1 className="text-2xl font-semibold">Editar formulário</h1>
        {isActive && (
          <p className="text-sm text-emerald-600">
            Este é o formulário ativo.
          </p>
        )}
      </div>

      <form action={formAction} className="space-y-6">
        <input type="hidden" name="formId" value={formId} />
        <input type="hidden" name="questions" value={serialized} />

        <Card>
          <CardContent className="space-y-2 py-4">
            <Label htmlFor="title">Título do formulário</Label>
            <Input
              id="title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="max-w-md"
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          {questions.map((q, index) => (
            <Card key={q.clientId}>
              <CardContent className="space-y-4 py-4">
                <div className="flex items-start gap-3">
                  <GripVertical className="mt-2 h-5 w-5 shrink-0 text-muted-foreground" />
                  <div className="flex-1 space-y-4">
                    <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
                      <div className="space-y-1.5">
                        <Label>Pergunta {index + 1}</Label>
                        <Input
                          value={q.label}
                          placeholder="Digite a pergunta"
                          onChange={(e) =>
                            update(q.clientId, { label: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Tipo</Label>
                        <Select
                          value={q.type}
                          onValueChange={(v) =>
                            changeType(q.clientId, v as QuestionType)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(
                              Object.keys(TYPE_LABELS) as QuestionType[]
                            ).map((t) => (
                              <SelectItem key={t} value={t}>
                                {TYPE_LABELS[t]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Opções para escolha */}
                    {(q.type === "single_choice" ||
                      q.type === "multi_choice") &&
                      Array.isArray(q.options) && (
                        <div className="space-y-2">
                          <Label>Opções</Label>
                          {q.options.map((opt, i) => (
                            <div key={i} className="flex gap-2">
                              <Input
                                value={opt}
                                placeholder={`Opção ${i + 1}`}
                                onChange={(e) =>
                                  setOption(q.clientId, i, e.target.value)
                                }
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeOption(q.clientId, i)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addOption(q.clientId)}
                          >
                            <Plus className="h-4 w-4" />
                            Adicionar opção
                          </Button>
                        </div>
                      )}

                    {/* Escala */}
                    {q.type === "scale" &&
                      q.options &&
                      !Array.isArray(q.options) && (
                        <div className="flex gap-3">
                          <div className="space-y-1.5">
                            <Label>Mínimo</Label>
                            <Input
                              type="number"
                              value={q.options.min}
                              className="w-24"
                              onChange={(e) =>
                                update(q.clientId, {
                                  options: {
                                    min: Number(e.target.value),
                                    max: (q.options as { max: number }).max,
                                  },
                                })
                              }
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Máximo</Label>
                            <Input
                              type="number"
                              value={q.options.max}
                              className="w-24"
                              onChange={(e) =>
                                update(q.clientId, {
                                  options: {
                                    min: (q.options as { min: number }).min,
                                    max: Number(e.target.value),
                                  },
                                })
                              }
                            />
                          </div>
                        </div>
                      )}

                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={q.required}
                          onCheckedChange={(c) =>
                            update(q.clientId, { required: c === true })
                          }
                        />
                        Obrigatória
                      </label>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => move(index, -1)}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => move(index, 1)}
                          disabled={index === questions.length - 1}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(q.clientId)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={() => setQuestions((qs) => [...qs, newQuestion()])}
          >
            <Plus className="h-4 w-4" />
            Adicionar pergunta
          </Button>
        </div>

        {state.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        {state.ok && !dirty && (
          <p className="text-sm text-emerald-600">Formulário salvo.</p>
        )}

        <div className="sticky bottom-4 flex items-center justify-end gap-3 rounded-lg bg-background/80 p-2 backdrop-blur">
          {dirty && (
            <Badge variant="warning">Alterações não salvas</Badge>
          )}
          <Button type="submit" disabled={pending} size="lg">
            {pending ? "Salvando..." : "Salvar formulário"}
          </Button>
        </div>
      </form>
    </>
  );
}
