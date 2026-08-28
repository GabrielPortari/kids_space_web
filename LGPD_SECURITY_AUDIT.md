# Auditoria de Segurança e Conformidade LGPD — Kids Space

**Data da auditoria:** 2026-08-27
**Escopo:** `kids_space_back` (API NestJS), `kids_space_web` (painel workspace + master-panel), `kids_space` (app mobile Flutter)
**Tipo:** Auditoria somente leitura + correções aplicadas em branches separadas (sem merge)

## Resumo executivo

Nível de risco geral identificado: **ALTO**.

A arquitetura de multi-tenancy (`companyId`) é consistente na maior parte dos endpoints, senhas são 100% delegadas ao Firebase Auth, e há uma base de auditoria (log de operações) já implementada. Ainda assim, a auditoria encontrou falhas concretas de autorização, vazamento de dado sensível em log, ausência de rate limiting em pontos críticos e ausência total de captura de consentimento do responsável legal — este último obrigatório pela LGPD ao tratar dados de crianças (art. 14) e dados de saúde (art. 11, categoria especial).

Todos os achados abaixo foram corrigidos em branches dedicadas, **não mescladas**, para validação antes do merge.

## Achados e correções

### 1. [CRÍTICO/ALTO] Auto-verificação/auto-ativação de empresa
- **Onde:** `src/company/company.controller.ts` (`PATCH /v2/companies/:id`), `src/company/company.service.ts` (`updateByActor`)
- **Problema:** o endpoint aceitava os campos `active`, `verified` e `cnpj` de qualquer ator autorizado pelo guard, incluindo a própria empresa (dono do recurso). Uma empresa podia se autoaprovar/autoativar, contornando a curadoria administrativa.
- **Correção:** `updateByActor` agora descarta `active`, `verified` e `cnpj` do payload quando o ator não tem privilégio de admin.
- **Branch:** `fix/lgpd-security-audit` (PR #4)

### 2. [ALTO] Dado de saúde de criança em texto puro no log de auditoria (LGPD art. 11)
- **Onde:** `src/logging/log.interceptor.ts`
- **Problema:** a lista de campos redigidos do log não cobria `healthInfo` e seus subcampos (`allergies`, `medications`, `medicalConditions`, `dietaryRestrictions`, `fearsOrSensitivities`). Toda alteração em `/v2/children` duplicava a ficha de saúde completa da criança em texto puro na coleção de logs.
- **Correção:** campos de saúde adicionados à lista de redação (redação recursiva já existente cobre subobjetos); query string das requisições também passou a ser sanitizada (evitava vazar CPF em buscas `?document=`).
- **Branch:** `fix/lgpd-security-audit` (PR #4)

### 3. [MÉDIO] Ausência de rate limiting na confirmação de CPF do responsável no checkout
- **Onde:** `POST /v2/attendance/checkout`
- **Problema:** nenhuma proteção contra tentativas repetidas de adivinhar o CPF correto do responsável para retirar uma criança.
- **Correção:** novo `CheckoutRateLimitGuard`, limitando tentativas por `childId` e por IP (5 tentativas / 5 min por criança).
- **Branch:** `fix/lgpd-rate-limit-consent` (PR #5)

### 4. [MÉDIO] Bootstrap de admin master sem rate limiting
- **Onde:** `POST /v2/admins/bootstrap/master`
- **Problema:** endpoint aceita apenas uma chave estática via header, sem qualquer limite de tentativas.
- **Correção:** novo `MasterBootstrapRateLimitGuard` (5 tentativas / 15 min por IP, 10 globais).
- **Branch:** `fix/lgpd-rate-limit-consent` (PR #5)
- **Observação:** a lógica de rate limiting foi extraída para uma classe base reutilizável (`src/common/guards/rate-limit.guard.ts`), usada também pelo `AuthRateLimitGuard` já existente.

### 5. [MÉDIO] Ausência de captura de consentimento do responsável legal (LGPD art. 7º, 8º, 11 e 14)
- **Onde:** cadastro de criança em toda a stack (API, web, mobile)
- **Problema:** nenhum model ou DTO registrava o consentimento do responsável legal para o tratamento dos dados da criança, incluindo dados de saúde — exigido pela LGPD por se tratar de dado de criança/adolescente (art. 14) combinado com dado sensível de saúde (art. 11).
- **Correção:**
  - **API:** novo `ConsentRecord` (`accepted`, `acceptedByName`, `acceptedByParentId?`, `termsVersion`, `acceptedAt` — este último sempre definido pelo servidor, nunca confiado do cliente). Campo `consent` agora **obrigatório** em `POST /v2/children`. Não editável via `PATCH` — registrado uma única vez, na criação. Branch: `fix/lgpd-rate-limit-consent` (PR #5).
  - **Web:** formulário de criação de criança (workspace e master-panel) coleta o aceite explícito (checkbox) e o nome do responsável legal; validação no cliente antes do envio; exibição somente leitura nos modais de visualização. Branch: `fix/lgpd-child-consent` (PR #3 em `kids_space_web`).
  - **Mobile:** novo diálogo `ChildConsentDialog`, usado tanto no fluxo em que o responsável cadastra o próprio filho (nome pré-preenchido) quanto no fluxo em que um colaborador/empresa cadastra a criança em nome do responsável presente. Branch: `fix/lgpd-child-consent` (PR #2 em `kids_space`).

## ⚠️ Breaking change e ordem de deploy

`POST /v2/children` passou a **exigir** o campo `consent` no corpo da requisição. Isso significa:

1. O backend (PR #5) só deve ir para produção **depois ou junto** com os PRs de web e mobile que passam a enviar esse campo.
2. Se o backend subir sozinho, qualquer cadastro de criança feito por um cliente desatualizado (web ou mobile antigos) passará a falhar com `400 Bad Request`.
3. Se web/mobile subirem sozinhos (backend antigo), o campo `consent` será enviado mas simplesmente ignorado pelo backend antigo — sem erro, porém sem registrar o consentimento.

**Recomendação:** subir os três PRs juntos, ou nesta ordem: web/mobile primeiro (client passa a enviar o campo, sem quebrar nada no backend antigo) e backend por último (passa a exigir o campo).

## Pull requests abertos (nenhum mesclado)

| Repositório | PR | Branch | Conteúdo |
|---|---|---|---|
| `kids_space_api` (ex-`kids_space_back`) | [#4](https://github.com/GabrielPortari/kids_space_api/pull/4) | `fix/lgpd-security-audit` | Achados #1 e #2 (auto-verificação de empresa, dado de saúde em log) |
| `kids_space_api` | [#5](https://github.com/GabrielPortari/kids_space_api/pull/5) | `fix/lgpd-rate-limit-consent` | Achados #3, #4 e #5 (rate limiting + consentimento) |
| `kids_space_web` | [#3](https://github.com/GabrielPortari/kids_space_web/pull/3) | `fix/lgpd-child-consent` | Achado #5 — captura de consentimento no painel |
| `kids_space` (mobile) | [#2](https://github.com/GabrielPortari/kids_space/pull/2) | `fix/lgpd-child-consent` | Achado #5 — captura de consentimento no app |

## Achados identificados mas ainda não corrigidos (não solicitados nesta rodada)

Os seguintes achados médios/baixos da auditoria original seguem pendentes e não foram tratados nestes PRs:

- Ausência de mecanismo de exportação/portabilidade e de arquivamento auditável de exclusão (LGPD art. 18) — as coleções `deleted_*` planejadas em `constants/collections.ts` nunca chegaram a ser implementadas.
- Ausência de política de retenção/TTL para `attendances` e `logs`.
- Falta de `ClassSerializerInterceptor`/DTOs de resposta explícitos (over-fetching estrutural).
- Rate limiter em memória (não distribuído) — não sobrevive a múltiplas instâncias em produção.
- Web: tokens em `localStorage` (`kids_space_web/src/auth/AuthContext.tsx`).
- Mobile: uso de `print()` para logar exceções, que pode ecoar dados sensíveis em logs de debug/crash reporting.

## Testes executados

- **Backend:** `npx tsc --noEmit` sem erros; `npx jest` — 20 suítes / 104 testes passando.
- **Web:** `npx vitest run` — 11 testes passando; `npx tsc -b` sem novos erros (6 erros pré-existentes em `ChildHealthInfoFields.tsx`/`AttendanceSection.tsx`, não relacionados a este trabalho); `npx eslint` sem novos erros nos arquivos alterados.
- **Mobile:** `flutter analyze` sem erros novos (apenas infos de estilo pré-existentes, como `use_build_context_synchronously`, já presentes no restante dos arquivos).

Testes manuais (checklist para quem for validar antes do merge):

- [ ] `PATCH /v2/companies/:id` chamado pela própria empresa não consegue mais alterar `active`/`verified`/`cnpj`.
- [ ] Logs de criação/atualização de criança não contêm mais `healthInfo` em texto puro.
- [ ] `POST /v2/attendance/checkout` bloqueado após 5 tentativas com CPFs diferentes para o mesmo `childId` em 5 minutos.
- [ ] `POST /v2/admins/bootstrap/master` bloqueado após 5 tentativas por IP em 15 minutos.
- [ ] Cadastro de criança pela web (workspace e master-panel) exige o checkbox de consentimento e o nome do responsável.
- [ ] Cadastro de criança pelo app mobile (responsável e colaborador) exige o mesmo consentimento, com nome pré-preenchido quando o próprio responsável está logado.
