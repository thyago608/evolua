"use client";

import { useActionState } from "react";
import { submitSurveyAction, type SurveyState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export interface PublicQuestion {
  id: string;
  type: string;
  label: string;
  required: boolean;
  options: string[] | { min: number; max: number } | null;
}

export function SurveyForm({
  token,
  questions,
}: {
  token: string;
  questions: PublicQuestion[];
}) {
  const [state, formAction, pending] = useActionState<SurveyState, FormData>(
    submitSurveyAction,
    {}
  );

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="token" value={token} />

      {questions.map((q, index) => (
        <div key={q.id} className="space-y-3">
          <Label className="text-base">
            {index + 1}. {q.label}
            {q.required && <span className="ml-1 text-destructive">*</span>}
          </Label>
          <QuestionField q={q} />
        </div>
      ))}

      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? "Enviando..." : "Enviar respostas"}
      </Button>
    </form>
  );
}

function QuestionField({ q }: { q: PublicQuestion }) {
  switch (q.type) {
    case "text":
      return <Input name={q.id} required={q.required} />;
    case "textarea":
      return <Textarea name={q.id} required={q.required} rows={4} />;
    case "boolean":
      return (
        <RadioGroup name={q.id} className="flex gap-6">
          <label className="flex items-center gap-2">
            <RadioGroupItem value="true" /> Sim
          </label>
          <label className="flex items-center gap-2">
            <RadioGroupItem value="false" /> Não
          </label>
        </RadioGroup>
      );
    case "single_choice":
      return (
        <RadioGroup name={q.id} className="gap-2">
          {(q.options as string[])?.map((opt) => (
            <label key={opt} className="flex items-center gap-2">
              <RadioGroupItem value={opt} /> {opt}
            </label>
          ))}
        </RadioGroup>
      );
    case "multi_choice":
      return (
        <div className="space-y-2">
          {(q.options as string[])?.map((opt) => (
            <label key={opt} className="flex items-center gap-2">
              <CheckboxInput name={q.id} value={opt} /> {opt}
            </label>
          ))}
        </div>
      );
    case "scale": {
      const opts = q.options as { min: number; max: number } | null;
      const min = opts?.min ?? 1;
      const max = opts?.max ?? 5;
      const nums = Array.from({ length: max - min + 1 }, (_, i) => min + i);
      return (
        <RadioGroup name={q.id} className="flex flex-wrap gap-3">
          {nums.map((n) => (
            <label
              key={n}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground"
            >
              <RadioGroupItem value={String(n)} className="sr-only" />
              {n}
            </label>
          ))}
        </RadioGroup>
      );
    }
    default:
      return <Input name={q.id} required={q.required} />;
  }
}

/** Checkbox nativo controlado via Radix para funcionar com name/value no form. */
function CheckboxInput({ name, value }: { name: string; value: string }) {
  return <Checkbox name={name} value={value} />;
}
