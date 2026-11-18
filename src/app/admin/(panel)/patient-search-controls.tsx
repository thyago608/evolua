"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PATIENT_BRANCHES,
  PATIENT_BRANCH_LABEL,
  type PatientBranch,
} from "@/lib/patient-branches";

const SEARCH_DELAY_MS = 400;

export function PatientSearchControls({
  initialQuery,
  initialBranch,
}: {
  initialQuery: string;
  initialBranch: PatientBranch | null;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [branch, setBranch] = useState<PatientBranch | null>(initialBranch);

  useEffect(() => setQuery(initialQuery), [initialQuery]);
  useEffect(() => setBranch(initialBranch), [initialBranch]);

  function replaceUrl(nextQuery: string, nextBranch: PatientBranch | null) {
    const params = new URLSearchParams();
    const normalizedQuery = nextQuery.trim();
    if (normalizedQuery) params.set("q", normalizedQuery);
    if (nextBranch) params.set("branch", nextBranch);
    const queryString = params.toString();
    router.replace(queryString ? `/admin?${queryString}` : "/admin", {
      scroll: false,
    });
  }

  useEffect(() => {
    if (query.trim() === initialQuery) return;
    const timeout = window.setTimeout(
      () => replaceUrl(query, branch),
      SEARCH_DELAY_MS
    );
    return () => window.clearTimeout(timeout);
  }, [query, branch, initialQuery]);

  function handleBranchChange(value: string) {
    const nextBranch = value === "all" ? null : (value as PatientBranch);
    setBranch(nextBranch);
    replaceUrl(query, nextBranch);
  }

  return (
    <div className="flex w-full gap-2 pt-2">
      <Input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar paciente pelo nome..."
        aria-label="Buscar paciente pelo nome"
        className="min-w-0 flex-1"
      />
      <Select
        value={branch ?? "all"}
        onValueChange={handleBranchChange}
      >
        <SelectTrigger
          aria-label="Filtrar por ramo"
          className="w-44 shrink-0 text-muted-foreground"
        >
          <SelectValue placeholder="Todos os ramos" />
        </SelectTrigger>
        <SelectContent align="end">
          <SelectItem value="all">Todos os ramos</SelectItem>
          {PATIENT_BRANCHES.map((item) => (
            <SelectItem key={item} value={item}>
              {PATIENT_BRANCH_LABEL[item]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
