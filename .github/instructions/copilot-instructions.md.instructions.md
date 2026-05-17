# Instruções Operacionais do Agente

Estas instruções devem ser consultadas e aplicadas antes de qualquer ação no projeto.

## Fluxo obrigatório antes de agir

1. Ler este arquivo por completo.
2. Confirmar o objetivo solicitado pelo usuário.
3. Verificar o menor conjunto de alterações necessário.
4. Executar a ação com segurança (sem comandos destrutivos).
5. Validar o resultado (erros, build, lint ou comportamento esperado).
6. Reportar de forma breve o que foi feito e o resultado.

## Regras de execução

- Priorizar mudanças mínimas e objetivas.
- Nunca reverter alterações do usuário sem solicitação explícita.
- Evitar comandos destrutivos (ex.: reset hard, checkout forçado).
- Antes de editar, entender o contexto do arquivo afetado.
- Após editar, verificar se foram introduzidos erros.
- Em caso de conflito ou ambiguidade, pedir confirmação ao usuário.

## Padrão de resposta

- Evite textos desnecessários (ex. Vou fazer isso, isso e isso... ou Ajuste aplicado, alteração feita... etc), não precisa dizer o que está sendo feito, apenas faça as operações, e ao fim me passe um pequeno relatório do que foi feito.
- Informe proximos passos ou sugestões de melhoria, mas sem ser prolixo.
- Se algo não estiver claro, peça confirmação antes de agir.

## Prioridade

Se houver conflito entre estas instruções e regras de sistema/plataforma, prevalecem as regras de sistema/plataforma.

## Design System Atual (manter este padrao)

Estas diretrizes devem ser preservadas em novas telas e ajustes visuais para evitar inconsistencias.

### Identidade visual

- Tema claro e acolhedor (nao usar dark mode como padrao).
- Fundo com gradientes/radiais suaves (nao usar fundo chapado unico).
- Linguagem visual com bordas suaves e contraste quente.

### Tokens de design (src/index.css)

- Cores principais:
  - --bg: #fbf3e8
  - --paper: #fffdf8
  - --panel: #fff9f0
  - --ink-strong: #1f1b18
  - --ink-soft: #5d534b
  - --line-soft: #decfbd
  - --line-strong: #2d2621
- Raios:
  - --radius-sm: 12px
  - --radius-md: 20px
  - --radius-lg: 34px
- Sombras:
  - --shadow-soft: 0 10px 24px rgba(44, 28, 14, 0.1)
  - --shadow-pop: 0 4px 0 #f07f48

### Tipografia

- Fonte de corpo: Manrope.
- Fonte de destaque/titulos: Syne.
- Manter hierarquia atual de titulos e textos de apoio.

### Componentes-base (src/App.css)

- Botoes: classes .btn, .solid, .ghost, .outline.
- Cartoes/paineis: .card, .panel, .auth-card.
- Layout de autenticacao: .auth-shell, .stack, .auth-actions.
- Evitar criar variacoes novas quando uma classe existente resolver o caso.

### Movimento e interacao

- Animacao principal: keyframe rise.
- Hover sutil com translateY(-1px) nos botoes.
- Transicoes curtas e discretas; sem animacoes agressivas.

### Regra de manutencao visual

- Em alteracoes futuras, priorizar reutilizacao das classes e tokens existentes.
- Qualquer novo token/componente deve seguir o mesmo estilo cromatico e tipografico.
- Evitar mudancas amplas de estilo sem solicitacao explicita do usuario.

### Foco em UX (sem fugir do design system)

- Priorizar clareza de fluxo: o usuario deve saber o proximo passo em cada tela.
- Reduzir friccao de formulario: labels claras, exemplos, autocomplete e inputMode adequados.
- Exibir feedback imediato: loading, sucesso e erro de forma objetiva e amigavel.
- Melhorar legibilidade e hierarquia: agrupar campos por contexto (ex.: empresa, endereco, acesso).
- Garantir responsividade real (desktop e mobile) sem quebrar o layout existente.
- Manter acessibilidade basica: contraste adequado, foco visivel e textos acionaveis claros.
- Ao melhorar UX, reutilizar classes/tokens atuais antes de criar novas variacoes visuais.

# Guia de Contexto para Iniciar o Frontend

Este documento resume o backend do projeto para acelerar o desenvolvimento do frontend com foco em autenticacao, autorizacao por papeis, fluxo de negocio e integracao com API.

## 1. Visao Geral do Produto

O sistema gerencia operacao de espaco kids em eventos:

1. Empresa se cadastra.
2. Operacao registra responsaveis (parents), criancas (children) e colaboradores.
3. Colaborador faz check-in/check-out de criancas.
4. Check-out exige confirmacao de CPF de um responsavel vinculado.

## 2. Stack do Backend e Implicacoes para o Frontend

- Framework: NestJS
- Runtime: Node.js
- Banco: Firestore
- Auth: Firebase Authentication
- Documentacao: Swagger em /api
- Porta padrao: 3000 (sem prefixo global de rota)

Implicacoes:

- Todas as rotas protegidas usam Authorization: Bearer <idToken>.
- Validacao de payload e estrita (whitelist + forbidNonWhitelisted).
- Campos extras enviados pelo frontend podem gerar erro 400.

## 3. URL Base e Ambientes

Sugestao de variaveis para frontend:

- NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
- NEXT_PUBLIC_SWAGGER_URL=http://localhost:3000/api

Observacao:

- O backend atual nao mostra enableCors em main.ts. Se frontend e backend estiverem em dominios diferentes, configurar CORS no backend.

## 4. Autenticacao e Sessao

## 4.1 Endpoints principais

- POST /auth/login
- POST /auth/signup
- POST /auth/refresh-auth
- POST /auth/recover-password
- POST /auth/logout
- GET /auth/me

## 4.2 Fluxo recomendado no frontend

1. Login com email/senha em POST /auth/login.
2. Guardar idToken e refreshToken (preferencialmente em storage seguro).
3. Enviar idToken no header Authorization.
4. Em 401, tentar POST /auth/refresh-auth com refreshToken.
5. Atualizar token e repetir a requisicao.
6. No logout, chamar POST /auth/logout e limpar sessao local.

## 4.3 Formato esperado em autenticacao

- Login retorna: idToken, refreshToken, expiresIn.
- Logout exige idToken valido no header.

## 5. Papeis e Controle de Acesso

Papeis conhecidos no sistema:

- company
- collaborator
- admin
- master

Comportamento de escopo:

- company e collaborator operam dados da propria company.
- admin/master podem operar em outras companies (em varios endpoints, via companyId no payload/query).

Recomendacao de frontend:

- Decodificar claims do token para montar navegacao por papel.
- Proteger rotas de UI por role e por escopo.

## 6. Modulos de Dominio para o Frontend

## 6.1 Company

- Dados da empresa autenticada: GET /v2/companies/me
- Atualiza empresa autenticada: PATCH /v2/companies/me
- Nome por ID: GET /v2/companies/:companyId/name

## 6.2 Collaborator

- Criar: POST /v2/collaborators
- Listar: GET /v2/collaborators
- Dados do colaborador autenticado: GET /v2/collaborators/me
- Atualiza colaborador autenticado: PATCH /v2/collaborators/me
- Detalhar: GET /v2/collaborators/:collaboratorId
- Nome por ID: GET /v2/collaborators/:collaboratorId/name
- Atualizar: PATCH /v2/collaborators/:collaboratorId
- Remover: DELETE /v2/collaborators/:collaboratorId

## 6.3 Parent

- Criar: POST /v2/parents
- Listar: GET /v2/parents
- Detalhar: GET /v2/parents/:parentId
- Nome por ID: GET /v2/parents/:parentId/name
- Atualizar: PATCH /v2/parents/:parentId
- Remover: DELETE /v2/parents/:parentId
- Vincular criancas: POST /v2/parents/:parentId/children

## 6.4 Child

- Criar: POST /v2/children
- Listar: GET /v2/children
- Detalhar: GET /v2/children/:childId
- Nome por ID: GET /v2/children/:childId/name
- Atualizar: PATCH /v2/children/:childId
- Remover: DELETE /v2/children/:childId
- Vincular responsaveis: POST /v2/children/:childId/parents

## 6.5 Attendance

- Check-in: POST /v2/attendance/checkin
- Check-out: POST /v2/attendance/checkout
- Listar atendimentos: GET /v2/attendance
- Detalhar: GET /v2/attendance/:attendanceId
- Atualizar: PATCH /v2/attendance/:attendanceId
- Remover: DELETE /v2/attendance/:attendanceId

Rotas uteis para dashboard de operacao:

- GET /v2/attendance/company/active-checkins
- GET /v2/attendance/company/last10
- GET /v2/attendance/company/last-checkin-and-checkout

## 7. Regras de Negocio Criticas para UI/UX

- Check-out exige responsibleDocument (CPF).
- CPF pode ser digitado com ou sem mascara; backend normaliza.
- Evitar dupla operacao de check-in para a mesma crianca sem checkout.
- Em rotas de admin, varios payloads exigem companyId.
- Campos de email/CPF/CNPJ sofrem normalizacao no backend.

## 8. DTOs Principais para Formularios

## 8.1 Signup de empresa

Campos obrigatorios:

- name
- legalName
- cnpj (14 digitos)
- address (objeto completo)
- contact (telefone BR)
- email
- password (minimo 6)

## 8.2 CreateChild

Obrigatorio:

- name

Opcional:

- parents[]
- document
- address
- email
- contact
- birthDate
- companyId (admin)

## 8.3 CreateParent

Obrigatorio:

- name

Opcional:

- document
- email
- contact
- birthDate
- address
- children[]
- companyId (admin)

## 8.4 CreateCollaborator

Obrigatorio:

- name
- email

Opcional:

- document
- contact
- birthDate
- address
- companyId (admin)

## 8.5 Attendance

Check-in:

- childId (obrigatorio)
- responsibleIdWhoCheckedInId (opcional)
- notes (opcional)
- companyId (admin)

Check-out:

- childId (obrigatorio)
- responsibleDocument (obrigatorio)
- notes (opcional)
- companyId (admin)

## 9. Sugestao de Arquitetura Frontend

## 9.1 Camadas

- api/client: instancia HTTP, interceptors, refresh token.
- api/modules: authApi, childApi, parentApi, collaboratorApi, attendanceApi, companyApi.
- domain/types: tipos de entidade e payloads.
- features: telas por contexto (auth, cadastro, operacao, dashboard).
- state: sessao (token, role, companyId) + cache de consultas.

## 9.2 Bibliotecas recomendadas

- React Query/TanStack Query para cache e invalidação.
- Zod ou schema local para validacao de formulario antes do envio.
- Mascara de CPF/CNPJ/telefone no input.

## 10. Fluxos de Tela Recomendados (MVP)

1. Login
2. Dashboard
3. Cadastro de parent
4. Cadastro de child
5. Vinculo parent-child
6. Check-in
7. Check-out com CPF
8. Lista de atendimentos e ativos

## 11. Estado e Navegacao por Role

Sugestao de menus:

- collaborator: atendimento, criancas, responsaveis
- company: tudo de collaborator + colaboradores + dados da empresa
- admin: visao global + admin-management + filtros por company

## 12. Tratamento de Erros

Padrao esperado:

- 400: payload invalido
- 401: token invalido/expirado
- 403: sem permissao
- 404: recurso nao encontrado
- 409: conflito (ex.: email/cnpj ja cadastrado)

Recomendacao:

- Mapear mensagens amigaveis por codigo HTTP.
- Logar detalhes tecnicos apenas em ambiente de desenvolvimento.

## 13. Checklist de Inicio do Frontend

1. Configurar API_BASE_URL.
2. Implementar cliente HTTP com Bearer token.
3. Implementar fluxo de login e refresh.
4. Construir guardas de rota por role.
5. Implementar CRUD de parent/child.
6. Implementar check-in/check-out com validacao de CPF.
7. Conectar dashboard com active-checkins e last10.
8. Revisar todos os payloads no Swagger (/api) antes de fechar cada tela.

## 14. Fontes de Verdade no Backend

- Relatorio de endpoints: ENDPOINTS_REPORT.md
- Swagger vivo: /api
- Controllers e DTOs em src/\*\*

Este arquivo deve ser usado como ponto de partida. Para contrato final de cada endpoint, consultar sempre o Swagger e os DTOs do backend.
