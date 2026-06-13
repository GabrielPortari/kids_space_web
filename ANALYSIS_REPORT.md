# Relatório de Análise — kids_space_web

**Data:** 2026-05-30
**Branch analisada:** `feat/admin-pannel`
**Autor da análise:** Claude Sonnet 4.6

---

## Sumário Executivo

O projeto é uma SPA React + TypeScript bem estruturada para gestão de presença infantil com RBAC. Tem decisões arquiteturais sólidas (React Query, Zod, hook-first), mas acumulou pontos de fragilidade em áreas críticas: **estado de modais explosivo**, **lógica duplicada de refresh de token**, **constantes duplicadas que podem dessincronizar**, **componentes monolíticos**, **mutações sem tratamento de erro**, e **cobertura de testes quase nula** fora dos payload builders.

---

## Stack Tecnológico

| Categoria | Tecnologia |
|-----------|-----------|
| Framework | React 19.2.4 + TypeScript 6.0.2 |
| Bundler | Vite 8.0.4 |
| Roteamento | React Router DOM 7.14.0 |
| Server State | TanStack React Query 5.99.0 |
| Forms | React Hook Form 7.72.1 + Zod 4.3.6 |
| Testes | Vitest 4.1.7 |
| Linting | ESLint 9.39.4 + typescript-eslint |

---

## 1. Pontos de Falha (Riscos Imediatos)

### 1.1 Race Condition no Refresh de Token — CRÍTICO

`AuthContext.tsx:28` e `client.ts:4` definem a mesma constante `AUTH_STORAGE_KEY = "kidsspace.session"` de forma independente. Mais grave: ambos implementam lógica de refresh em separado.

- **`AuthContext.tsx`** possui timer proativo que chama `refreshSession()`
- **`client.ts:60`** possui `refreshStoredSession()` que chama `refreshAuth()` diretamente e escreve no localStorage **sem notificar o `AuthContext`**

**Cenário de falha:**

```
AuthContext timer → refreshAuth(token) → novo token salvo no localStorage
apiRequest 401   → refreshAuth(token) → token já inválido → writeSession(null)
UI: "authenticated"  |  localStorage: null  →  próxima requisição: 401 loop
```

O timer dispara e começa o refresh. Simultaneamente, uma requisição recebe 401 e `apiRequest` também tenta o refresh com o mesmo token. O backend invalida o token na primeira chamada, a segunda falha e apaga a sessão via `writeSession(null)` no catch de `client.ts:79`. O `AuthContext` continua exibindo `status = "authenticated"` enquanto o localStorage está vazio.

---

### 1.2 Mutação de Vínculo de Pais Sem Invalidação de Cache

Em `useChildren.ts:117-127`, `assignParentsMut` não chama `queryClient.invalidateQueries` no `onSuccess`:

```typescript
const assignParentsMut = useMutation({
  mutationFn: ({ childId, parentIds }) => assignParentsToChild(childId, parentIds),
  onSuccess: () =>
    setStatusMessage("Vinculo de crianca para responsaveis atualizado."),
  // ← invalidateQueries ausente
});
```

O usuário vê a mensagem de sucesso, mas a lista de crianças não é atualizada. O vínculo só aparece após navegar para outra seção e retornar.

---

### 1.3 Handlers `mutateAsync` Sem Try/Catch

`useChildren.ts:243` usa `mutateAsync` que lança exceção em caso de erro. O handler não possui `try/catch`:

```typescript
async function onCreateChildModal(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  // ...validações...
  await createChildMut.mutateAsync({ ...payload }); // ← pode lançar
  // se lançar: os estados abaixo nunca são executados
  setChildForm(INITIAL_CHILD_FORM);       // modal fica com estado sujo
  setIsChildCreateModalOpen(false);        // modal permanece aberto
}
```

Se a API retornar erro, o modal fica aberto com o formulário preenchido e o usuário não recebe nenhum feedback de erro.

---

### 1.4 `parseResponse` Força `{}` como `T` para Status 204

```typescript
// client.ts:85-91
async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return {} as T; // ← type cast perigoso
  }
  return (await response.json()) as T;
}
```

Qualquer chamada que espere `T` com campos obrigatórios e receba um 204 retornará `{}` sem erro em runtime, causando `undefined` silencioso em propriedades esperadas downstream.

---

### 1.5 Ausência Total de Error Boundaries

Não há nenhum `ErrorBoundary` em nenhuma camada da aplicação. Um erro de renderização em qualquer seção (ex.: `ChildrenSection`) derruba toda a página sem feedback ao usuário.

---

## 2. Pontos de Melhoria

### 2.1 Constante `AUTH_STORAGE_KEY` Duplicada

Definida de forma independente em dois arquivos. Se a chave mudar, é necessário atualizar em dois lugares, e é fácil esquecer um.

- `src/auth/AuthContext.tsx:28`
- `src/api/client.ts:4`

---

### 2.2 Bloco de Extração de Endereço Copy-Pasted 4 Vezes

O mesmo bloco de 7 linhas aparece verbatim em `formatter.ts` nas funções:
- `toParentFormState` (linha 208)
- `toChildFormState` (linha 239)
- `toCompanyFormState` (linha 273)
- `toCollaboratorFormState` (linha 300)

```typescript
const address =
  item.address && typeof item.address === "object" && !Array.isArray(item.address)
    ? (item.address as Record<string, unknown>)
    : {};
```

---

### 2.3 `childCreateParentOptions` e `assigningChildParentOptions` São Idênticos

`useChildren.ts:168-220` — duas `useMemo` realizam exatamente o mesmo filtro de pais por termo de busca. A única diferença é o estado de origem (`childParentsSearch` vs `childCreateParentSearch`), o que não justifica duplicação.

---

### 2.4 Tipagem Fraca no Retorno das Queries

```typescript
const children = childrenQuery.data || [];
const parents = parentsQuery.data || [];
```

`childrenQuery.data` é `unknown[]` sem tipo explícito na query. O restante do código realiza casts manuais frequentes como `(parents as ListItem[])`. Tipar a query corretamente (`useQuery<Child[]>`) elimina esses casts.

---

### 2.5 `toCollaboratorFormState` Sem Tipo de Retorno Explícito

`formatter.ts:300` — única função de mapeamento no arquivo sem tipo de retorno declarado. Inconsistência com as demais funções do mesmo arquivo.

---

### 2.6 Mensagens de Status Hardcoded e Sem Acentuação

Strings como `"Crianca criada."` e `"Nao foi possivel identificar o role da sessao."` estão espalhadas pelo código. Além da ausência de acentuação, dificultam manutenção e eventual internacionalização.

---

### 2.7 `matchesSearch` Busca em Todos os Campos Indiscriminadamente

`formatter.ts:18-27` converte todos os valores do objeto (incluindo IDs, timestamps e campos internos) para string antes de aplicar o `includes`. O usuário pesquisando "2024" pode receber resultados inesperados baseados em timestamps ou IDs.

---

### 2.8 `flattenRecord` Com Recursão Sem Limite de Profundidade

`formatter.ts:404-441` realiza recursão em objetos aninhados sem nenhum guard de profundidade máxima. Um objeto circular ou excessivamente profundo causaria stack overflow.

---

## 3. Refatorações Recomendadas

### 3.1 Consolidar Estado de Modais em Reducer

`useChildren.ts` expõe 30+ valores no retorno, incluindo 5 booleans de visibilidade de modal + 5 setters correspondentes + 4 IDs de seleção. Padrão clássico de "estado explodido".

**Proposta:**

```typescript
type ChildModalState =
  | { kind: "none" }
  | { kind: "create" }
  | { kind: "view";           childId: string }
  | { kind: "edit";           childId: string }
  | { kind: "delete";         childId: string }
  | { kind: "assign-parents"; childId: string; parentIds: string[] };

const [modal, setModal] = useState<ChildModalState>({ kind: "none" });
```

Reduz de ~12 `useState` para 1, elimina inconsistências de estado (modal "open" sem ID associado), simplifica o retorno do hook e facilita transições seguras entre estados.

---

### 3.2 Unificar Lógica de Refresh de Token

Remover `refreshStoredSession()` de `client.ts`. O `apiRequest` deve, em caso de 401, apenas reler o token atualizado pelo `AuthContext` via localStorage e retentar, sem executar o refresh diretamente:

```typescript
// Lógica simplificada para client.ts
if (response.status === 401 && !skipAuth) {
  const refreshedSession = readSession();
  if (refreshedSession?.idToken !== currentSession?.idToken) {
    response = await doFetch(refreshedSession.idToken);
  }
}
```

---

### 3.3 Extrair Helper de Endereço em `formatter.ts`

```typescript
function extractAddress(item: ListItem): Record<string, unknown> {
  return item.address &&
    typeof item.address === "object" &&
    !Array.isArray(item.address)
    ? (item.address as Record<string, unknown>)
    : {};
}
```

Substitui as 4 repetições idênticas por uma única função testável.

---

### 3.4 Extrair Helper de Filtro de Pais em `useChildren.ts`

```typescript
function filterParentOptions(parents: ListItem[], term: string) {
  return parents
    .map((item) => ({
      id: extractId(item),
      name: String(item.name || "Responsável sem nome"),
    }))
    .filter(
      (opt) =>
        opt.id &&
        (!term ||
          opt.name.toLowerCase().includes(term) ||
          opt.id.toLowerCase().includes(term)),
    );
}
```

Elimina as duas `useMemo` duplicadas.

---

### 3.5 Quebrar Componentes de Seção Monolíticos

`ChildrenSection.tsx` (1507 linhas) e `ParentsSection.tsx` (~1300 linhas) devem ser divididos em subcomponentes menores:

```
ChildrenSection/
├── index.tsx               (orquestração, ~100 linhas)
├── ChildrenTable.tsx        (tabela + linha)
├── ChildCreateModal.tsx
├── ChildEditModal.tsx
├── ChildViewModal.tsx
├── ChildDeleteModal.tsx
└── AssignParentsModal.tsx
```

---

### 3.6 Centralizar Query Keys

```typescript
// src/pages/workspace/queryKeys.ts
export const queryKeys = {
  children: (companyId?: string, role?: string) =>
    ["children", companyId, role] as const,
  parents: (companyId?: string, role?: string) =>
    ["parents", companyId, role] as const,
};
```

Evita chaves hardcoded que podem divergir entre invalidação e busca, causando cache stale silencioso.

---

## 4. Cobertura de Testes

| Área | Status |
|------|--------|
| Payload builders (`formPayloads`, `childPayload`) | ✅ Coberto |
| Utilitários de `formatter.ts` | ❌ Não testado |
| Hooks (`useChildren`, `useParents`, etc.) | ❌ Não testado |
| Componentes (modais, seções) | ❌ Não testado |
| Fluxo de autenticação (login, refresh, logout) | ❌ Não testado |
| API client (`apiRequest`, retry 401) | ❌ Não testado |
| E2E | ❌ Ausente |

A cobertura atual é de aproximadamente **5% do código funcional crítico**.

---

## 5. Segurança

| Item | Risco | Mitigação Recomendada |
|------|-------|-----------------------|
| Tokens em `localStorage` | XSS pode ler o token | Backend adotar httpOnly cookies; curto prazo: manter tokens de curta duração |
| JWT decodificado sem verificação de assinatura | Frontend confia no payload sem validar | Aceitável se o backend valida; manter consciência |
| `AUTH_STORAGE_KEY` duplicado | Dessincronização silenciosa entre módulos | Centralizar em módulo compartilhado |
| Retorno 204 castado como `T` | Crash silencioso em propriedades undefined | Usar `T \| void` ou tratamento explícito |

---

## 6. Plano de Ação Priorizado

### Fase 1 — Correções Críticas

> Baixo esforço, alto impacto imediato. Recomendado resolver nesta sprint.

| # | Ação | Arquivo(s) | Esforço Estimado |
|---|------|------------|-----------------|
| 1 | Adicionar `try/catch` em todos os handlers `mutateAsync` | `useChildren.ts`, `useParents.ts`, `useCollaborators.ts` | 1h |
| 2 | Adicionar `invalidateQueries` ao `assignParentsMut.onSuccess` | `useChildren.ts:117` | 15min |
| 3 | Centralizar `AUTH_STORAGE_KEY` em módulo único | `auth/constants.ts` (novo) | 30min |
| 4 | Remover `refreshStoredSession` de `client.ts`; delegar ao `AuthContext` | `client.ts:60` | 2h |
| 5 | Adicionar `ErrorBoundary` na raiz do workspace | `RoleWorkspacePage.tsx` | 1h |

---

### Fase 2 — Melhorias de Qualidade

> Esforço moderado. Melhora manutenção e reduz superfície de bugs futuros.

| # | Ação | Arquivo(s) | Esforço Estimado |
|---|------|------------|-----------------|
| 6 | Extrair helper `extractAddress` em `formatter.ts` | `formatter.ts:208-325` | 30min |
| 7 | Tipar queries explicitamente (`useQuery<Child[]>`) | Todos os hooks | 1h |
| 8 | Consolidar modal state em reducer em `useChildren.ts` | `useChildren.ts:43-63` | 3h |
| 9 | Centralizar query keys em `queryKeys.ts` | Novo arquivo + hooks | 1h |
| 10 | Adicionar tipo de retorno em `toCollaboratorFormState` | `formatter.ts:300` | 10min |
| 11 | Tratar retorno 204 com tipo `T \| void` | `client.ts:85` | 30min |

---

### Fase 3 — Refatorações Estruturais

> Esforço alto. Impacto na sustentabilidade e testabilidade a longo prazo.

| # | Ação | Esforço Estimado |
|---|------|-----------------|
| 12 | Quebrar `ChildrenSection.tsx` em subcomponentes | 1 dia |
| 13 | Quebrar `ParentsSection.tsx` em subcomponentes | 1 dia |
| 14 | Adicionar testes unitários para utilitários de `formatter.ts` | 3h |
| 15 | Adicionar testes para `useChildren` e `useParents` | 1 dia |
| 16 | Adicionar testes para `AuthContext` (login, refresh, logout) | 4h |
| 17 | Avaliar migração de tokens para `sessionStorage` ou httpOnly cookies | — |

---

## Resumo de Impacto

```
FASE 1 — Correções Críticas (~5h total)
  • try/catch nos handlers       → evita estado inconsistente de UI
  • invalidateQueries no assign  → corrige bug visível ao usuário final
  • centralizar AUTH_STORAGE_KEY → previne race condition latente
  • unificar refresh token       → elimina race condition real
  • ErrorBoundary                → evita crash total de página

FASE 2 — Qualidade (~6h total)
  • Consolidar modal state       → reduz 12 useState para 1 reducer
  • Centralizar query keys       → evita invalidação de cache errada
  • Extrair helpers duplicados   → elimina drift entre cópias

FASE 3 — Sustentabilidade (~4 dias total)
  • Quebrar seções monolíticas   → legibilidade e testabilidade
  • Cobertura de testes          → confiança em refatorações futuras
```
