"use client";

import { useState } from "react";
import { Copy, Check, RefreshCw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateLinkAction, markSentAction } from "../actions";

export function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex gap-2">
      <Input readOnly value={value} className="font-mono text-xs" />
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            /* ignore */
          }
        }}
      >
        {copied ? (
          <Check className="h-4 w-4 text-emerald-600" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

export function GenerateLinkButton({
  patientId,
  hasLink,
}: {
  patientId: string;
  hasLink: boolean;
}) {
  return (
    <form action={generateLinkAction}>
      <input type="hidden" name="patientId" value={patientId} />
      <Button type="submit" variant={hasLink ? "outline" : "default"}>
        <RefreshCw className="h-4 w-4" />
        {hasLink ? "Gerar novo link" : "Gerar link"}
      </Button>
    </form>
  );
}

export function MarkSentButton({
  inviteId,
  patientId,
}: {
  inviteId: string;
  patientId: string;
}) {
  return (
    <form action={markSentAction}>
      <input type="hidden" name="inviteId" value={inviteId} />
      <input type="hidden" name="patientId" value={patientId} />
      <Button type="submit" variant="outline">
        <Send className="h-4 w-4" />
        Marcar como enviado
      </Button>
    </form>
  );
}
