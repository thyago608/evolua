# Handoff — Evolua.

Documento para continuidade do desenvolvimento da plataforma de pesquisas de
pacientes. Atualizado com base no estado do repositório em 03/11/2026.

## Estado atual

O MVP está implementado, com build de produção validado na sessão anterior.
Trata-se de uma aplicação Next.js única que contém:

- painel administrativo protegido por login;
- cadastro e acompanhamento de pacientes;
- construtor de formulários de pesquisa;
- links públicos individuais para pacientes responderem pesquisas;
- histórico de respostas por paciente;
- notificações de novas respostas no próprio painel.

O último ajuste aplicado foi a alteração da marca visível e do título da aba
para **`Evolua.`**. A solicitação atual era somente preparar este handoff;
não há uma funcionalidade em andamento interrompida.

## Stack e arquitetura

- Next.js 16, App Router, React 19 e TypeScript.
- Tailwind CSS e componentes shadcn/Radix locais em `src/components/ui`.
- Drizzle ORM + PostgreSQL.
- Renderização e leituras por React Server Components; mutações por Server
  Actions (`useActionState`) e `revalidatePath`. Não há React Query, API REST
  de frontend, nem `fetch` de dados no cliente.
- Autenticação simples de um único administrador: cookie HTTP-only assinado
  com `jose`; credenciais por variáveis de ambiente.
- Banco local: PostgreSQL em Docker, esperado em `localhost:5433`, banco
  `pesquisa`. Produção planejada: Neon + Vercel.

## Funcionalidades prontas

### Autenticação e marca

- Login em `/admin/login`; rotas administrativas protegidas por
  `src/middleware.ts`.
- Campo de senha tem botão para mostrar/ocultar o conteúdo.
- Cabeçalho do painel e título da página usam `Evolua.`.
- As credenciais locais atuais ficam exclusivamente em `.env.local`; não
  versionar nem repetir a senha em documentação ou commits.

### Pacientes

- Painel em `/admin` lista pacientes, status e acesso ao detalhe.
- O nome do paciente é clicável e abre `/admin/patients/[id]`.
- A ação **Link** abre um diálogo para copiar o link público, marcar como
  enviado e gerar um novo link.
- Novo paciente: `/admin/patients/new`.
  - Obrigatórios: nome completo, início e fim de vigência do plano.
  - CPF e data de nascimento são opcionais e podem ser informados depois.
  - CPF tem máscara (`000.000.000-00`) e validação de dígitos verificadores.
  - Nome completo tem label e placeholder `Digite o nome completo`.
  - Telefone foi removido da UI por enquanto, embora a coluna opcional ainda
    exista no banco para uma eventual integração futura.
- Detalhe do paciente exibe os dados, a vigência como intervalo, o histórico
  de respostas e um diálogo **Completar dados** / **Editar CPF/nascimento**.
  Esse diálogo fecha automaticamente depois de salvar com sucesso.

### Formulários e pesquisa pública

- Lista de formulários: `/admin/forms`.
- Editor: `/admin/forms/[id]`.
- Tipos suportados: texto, área de texto, escolha única, múltipla escolha,
  escala e booleano.
- O editor mantém alterações no estado local até clicar em **Salvar
  formulário**. Há indicação de alterações não salvas e confirmação antes de
  sair/recarregar para evitar perda silenciosa de edição.
- Link do paciente: `/s/[token]`; página de agradecimento em
  `/s/[token]/obrigado`.
- A submissão salva um snapshot de respostas, marca o convite como concluído
  e cria uma notificação não lida.

### Notificações

- A antiga página `/admin/responses` foi removida.
- O menu agora usa um popover **Notificações**, com sino e contador de
  respostas não lidas.
- Cada notificação abre o detalhe do paciente.
- O botão **Limpar notificações** marca todas como vistas.
- O histórico completo permanece no detalhe de cada paciente.

### Links e WhatsApp

- O botão visível de enviar por WhatsApp foi removido do painel e dos diálogos.
- Links podem ser copiados e gerados novamente.
- Há helpers legados/preparatórios em `src/lib/whatsapp.ts`, mas nenhuma
  integração de envio automático está ativa.

## Modelo de dados

Definido em `src/db/schema.ts`:

| Tabela | Responsabilidade |
| --- | --- |
| `patients` | Nome, CPF opcional/único, nascimento opcional, início/fim de vigência, telefone opcional e criação. |
| `forms` | Formulários e qual está ativo. |
| `form_questions` | Perguntas, posição, tipo, opções e obrigatoriedade. |
| `invites` | Link/token individual, formulário, status, datas de envio/conclusão e próxima data (`dueAt`). |
| `responses` | Respostas em JSON, paciente/convite, data e flag `seen`. |

Os status de convite são `pending`, `sent`, `completed` e `expired`.

## Arquivos mais importantes

```text
src/app/admin/(panel)/layout.tsx             # navegação e marca
src/app/admin/(panel)/page.tsx               # dashboard/listagem
src/app/admin/(panel)/notifications-popover.tsx
src/app/admin/(panel)/patients/actions.ts
src/app/admin/(panel)/patients/new/page.tsx
src/app/admin/(panel)/patients/[id]/page.tsx
src/app/admin/(panel)/patients/[id]/patient-details-dialog.tsx
src/app/admin/(panel)/patients/patient-link-dialog.tsx
src/app/admin/(panel)/forms/[id]/form-editor.tsx
src/app/admin/(panel)/forms/actions.ts
src/app/s/[token]/page.tsx                   # formulário público
src/app/s/[token]/actions.ts                 # submissão da pesquisa
src/db/schema.ts
src/db/index.ts
src/lib/auth.ts
src/lib/validation.ts                         # CPF e dados de entrada
src/lib/invites.ts
src/middleware.ts
scripts/seed.ts
```

## Ambiente local

1. Copiar `.env.example` para `.env.local` e preencher valores reais.
2. Subir Postgres local, se ainda necessário:

   ```bash
   docker run -d --name pesquisa-pg \
     -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=pesquisa \
     -p 5433:5432 postgres:16
   ```

3. Sincronizar schema e criar o formulário de exemplo:

   ```bash
   npm install
   npm run db:push
   npm run seed
   ```

4. Iniciar:

   ```bash
   npm run dev
   ```

Comandos úteis:

```bash
npm run build
npm run hash-password -- "nova-senha"
npm run db:studio
```

Para hashes bcrypt em `.env.local`, cada `$` precisa ser escapado como `\$`.
Na configuração de ambiente da Vercel, o hash deve ser colado sem escapes.

## Próximos passos recomendados

1. Atualizar o `readme.md`, que ainda menciona itens removidos ou alterados:
   `/admin/responses`, telefone obrigatório/visível e o envio manual por
   WhatsApp. O `HANDOFF.md` é a referência correta por enquanto.
2. Fazer uma validação manual final no navegador:
   criar paciente, informar CPF posteriormente, criar/editar formulário,
   gerar link, responder em janela anônima, conferir notificação e histórico.
3. Preparar produção:
   - criar projeto no Neon;
   - configurar `DATABASE_URL`, `ADMIN_USER`, `ADMIN_PASSWORD_HASH`,
     `SESSION_SECRET` e `APP_URL` na Vercel;
   - executar `npm run db:push` e `npm run seed` contra o banco Neon;
   - realizar o primeiro deploy e repetir o fluxo ponta a ponta no domínio
     público.
4. Antes de persistir dados reais, revisar privacidade/LGPD, controle de acesso
   e política de backup do banco. CPF e data de nascimento são dados pessoais
   sensíveis no contexto operacional.

## Itens propositalmente fora do escopo atual

- Consulta de nome/data de nascimento a partir de CPF: não foi implementada.
  Não há base pública, gratuita e legítima que entregue esses dados; a consulta
  oficial exige a data de nascimento previamente. Manter preenchimento manual.
- Envio automático de WhatsApp e reenvio trimestral: exigem provedor, template
  aprovado e cron; não estão ativos.
- E-mail de nova resposta: `src/lib/email.ts` é preparatório/env-gated, mas a
  integração com Resend ainda não foi concluída/configurada.
- Multiusuário, papéis e gestão de contas: fora do escopo; há um único login
  administrativo.
- Não há migrações SQL versionadas no repositório no momento; o fluxo usado foi
  `drizzle-kit push`. Antes de um processo formal de produção/equipe, vale
  adotar `drizzle-kit generate` + migrations versionadas.

## Cuidados para o próximo agente

- O worktree é novo e quase todos os arquivos do app estão não rastreados;
  trate o estado atual como trabalho do usuário e não reverta nem limpe nada.
- Leia `AGENTS.md` e a documentação instalada do Next (`node_modules/next/dist/docs`)
  antes de alterar código Next.js, pois esta versão possui mudanças relevantes.
- Não expor `.env.local`, hashes, `DATABASE_URL` ou segredos em commits, logs
  ou documentação.
- O repositório contém comentários com `Fase 1`/`Fase 2` apenas como contexto
  técnico; textos visíveis ao usuário com essa expressão já foram removidos.
