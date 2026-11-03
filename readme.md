# Plataforma de Pesquisa com Pacientes

Plataforma web para cadastrar pacientes, enviar a cada um um link único de
pesquisa, visualizar o histórico de respostas e acompanhar o ciclo de reenvio
(a cada 3 meses). O painel administrativo e o formulário público do paciente
vivem na **mesma codebase** (rotas diferentes).

## Stack

- **Next.js 16 (App Router) + React 19 + TypeScript**
- **Tailwind CSS + shadcn/ui** (componentes)
- **Drizzle ORM + Postgres** — Neon (produção) ou Postgres comum (local)
- **Auth simples**: login único (usuário/senha via env), sessão em cookie
  assinado (JWT)

## Estrutura de rotas

| Rota | Acesso | Descrição |
|------|--------|-----------|
| `/admin/login` | público | Login do administrador |
| `/admin` | protegido | Painel: pacientes, status, respostas novas |
| `/admin/patients/new` | protegido | Cadastro de paciente |
| `/admin/patients/[id]` | protegido | Detalhe + link + histórico de respostas |
| `/admin/forms` · `/admin/forms/[id]` | protegido | Construtor de formulário |
| `/admin/responses` | protegido | Feed de respostas |
| `/s/[token]` | público | Formulário que o paciente responde |

Tudo sob `/admin/*` exige sessão (ver `src/middleware.ts`). `/s/[token]` é público.

---

## Rodando localmente

### 1. Pré-requisitos
- Node 20+ (testado com 24)
- Um Postgres. A forma mais rápida é via Docker:

```bash
docker run -d --name pesquisa-pg \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=pesquisa \
  -p 5433:5432 postgres:16
```

### 2. Variáveis de ambiente
Copie `.env.example` para `.env.local` e preencha. Gere o hash da senha:

```bash
npm run hash-password -- "suaSenhaForte"
```

> **Atenção (apenas em arquivos `.env`):** o hash bcrypt contém `$`, que o
> Next expande como variável. **Escape cada `$` com `\$`** no `.env.local`.
> Na Vercel, cole o hash **sem** escapar (lá o valor é literal).

Exemplo de `.env.local`:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/pesquisa"
ADMIN_USER="admin"
ADMIN_PASSWORD_HASH="\$2a\$10\$...."
SESSION_SECRET="uma-string-longa-e-aleatoria"
APP_URL="http://localhost:3000"
```

### 3. Criar o schema e o formulário padrão
```bash
npm install
npx drizzle-kit push        # cria as tabelas
npm run seed                # cria e ativa um formulário de exemplo
```

### 4. Subir o app
```bash
npm run dev
# http://localhost:3000  → redireciona para /admin/login
```

---

## Deploy em produção (Vercel + Neon)

1. **Banco (Neon):** crie um projeto em [neon.tech](https://neon.tech) e copie a
   connection string (`DATABASE_URL`). O client detecta `neon.tech` na URL e usa
   o driver HTTP serverless automaticamente.
2. **Importe o repositório na Vercel** (New Project → importar este repo).
3. **Environment Variables** (Production) na Vercel:
   - `DATABASE_URL` — string da Neon
   - `ADMIN_USER`
   - `ADMIN_PASSWORD_HASH` — hash **sem** escapar os `$`
   - `SESSION_SECRET` — string longa e aleatória
   - `APP_URL` — URL pública do projeto (ex: `https://seu-app.vercel.app`)
4. **Aplicar o schema no banco de produção** (uma vez, da sua máquina apontando
   para a Neon):
   ```bash
   DATABASE_URL="<string-neon>" npx drizzle-kit push
   DATABASE_URL="<string-neon>" npm run seed
   ```
5. **Deploy** — a Vercel builda e publica. Acesse `/admin/login`.

---

## Como usar

1. Em **Formulários**, crie/edite as perguntas e **ative** um formulário.
2. Cadastre um **paciente** (nome, nascimento, CPF, vigência, telefone).
3. No detalhe do paciente, clique **Gerar link** e envie pelo **WhatsApp**
   (botão abre o WhatsApp com a mensagem e o link prontos). Marque como enviado.
4. Quando o paciente responder, a resposta aparece no painel (**badge de
   respostas novas**) e no histórico do paciente.
5. Após 3 meses o paciente é destacado como **"reenvio pendente"** no painel.

---

## Fase 2 (automação — opcional)

O núcleo já está preparado para ligar, sem refatorar:
- **Envio automático por WhatsApp** (Twilio) — `src/lib/whatsapp.ts`
  (`sendWhatsApp`, hoje env-gated com fallback manual via `wa.me`).
- **Cron de reenvio a cada 3 meses** — criar `src/app/api/cron/dispatch` +
  `vercel.json` com schedule; usa `invites.dueAt`.
- **Notificação por e-mail** (Resend) — `src/lib/email.ts` (`notifyNewResponse`,
  já chamada no submit; ativa quando `RESEND_API_KEY`/`NOTIFY_EMAIL` existem).

Variáveis adicionais estão comentadas em `.env.example`.
