import { CheckCircle2 } from "lucide-react";

export default function ThanksPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="max-w-md rounded-xl border bg-background p-8 text-center">
        <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-600" />
        <h1 className="text-2xl font-semibold">Respostas enviadas!</h1>
        <p className="mt-2 text-muted-foreground">
          Muito obrigado por responder. Seu retorno ajuda no seu
          acompanhamento. Você já pode fechar esta página.
        </p>
      </div>
    </main>
  );
}
