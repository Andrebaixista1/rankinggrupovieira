# Sistema de Subagentes

Este diretório contém os prompts operacionais usados pelo orquestrador principal para distribuir trabalho neste repositório sem sobreposição de escopo.

## Objetivo

- transformar os papéis definidos em `AGENTS.md` em subagentes acionáveis;
- garantir que cada subagente tenha fronteiras de escrita explícitas;
- padronizar o handoff entre orquestrador e especialistas;
- impedir que duas frentes alterem o mesmo arquivo ou a mesma decisão ao mesmo tempo.

## Contexto do Projeto

Este repositório é o ranking do Grupo Vieira, uma aplicação React/Vite em JavaScript com rotas serverless em `api/`.

Principais áreas:

- `src/App.jsx`: composição principal, transformação de dados, estado local e renderização dos rankings.
- `src/App.css` e `src/index.css`: estilos da aplicação e ajustes globais.
- `api/ranking.js` e `api/update-metrics.js`: proxy/normalização de dados e métricas de atualização.
- `vercel.json` e `vite.config.js`: deploy, rewrites e build.

## Subagentes disponíveis

- `orchestrator.md`: contrato do agente principal, roteamento, divisão e integração.
- `frontend.md`: composição da tela, interação local, acessibilidade e estrutura de UI.
- `backend.md`: robustez de execução, persistência local, cache, scripts e efeitos colaterais.
- `api.md`: contratos, payloads, normalização, proxy, webhooks e rewrites.
- `marketing.md`: copy, labels, títulos, mensagens e clareza comercial.
- `design.md`: CSS, visual system, hierarquia visual, responsividade e refinamento visual.

## Runner real

Quando o ambiente disponibilizar um executor real de subagentes, o orquestrador deve usá-lo em vez de apenas simular delegação.

### Executor padrão

- usar `multi_agent_v1.spawn_agent` para subtarefas independentes e bem delimitadas;
- usar `multi_agent_v1.wait_agent` apenas quando o próximo passo do caminho crítico depender do retorno;
- usar `multi_agent_v1.close_agent` ao final da integração ou quando o agente não for mais necessário.

### Regra de acionamento

Dispare subagentes reais apenas quando:

- o usuário pedir explicitamente delegação, subagentes ou trabalho paralelo;
- houver uma subtarefa concreta que avance o trabalho sem bloquear o próximo passo local imediato;
- o escopo de escrita ou análise do subagente estiver claramente fechado.

Não dispare quando:

- a tarefa for trivial;
- o próximo passo local depender exatamente daquele resultado;
- não houver fronteira segura de arquivos ou decisão.

## Protocolo de distribuição

### 1. Classificação inicial

O orquestrador deve classificar cada pedido do usuário em uma destas categorias:

- interface;
- design system;
- copy;
- integração;
- persistência/cache;
- tarefa híbrida.

### 2. Escolha do dono primário

Escolha primeiro o dono do arquivo e só depois a disciplina:

- `src/App.css` e `src/index.css`: `design`;
- `api/*`, `vercel.json` e `vite.config.js`: `api`;
- cache local, timeouts, scripts e efeitos colaterais não contratuais: `backend`;
- `src/App.jsx`, layout, navegação visual, estado local de UI e renderização: `frontend`;
- títulos, labels, descrições, mensagens de erro e nomes exibidos ao usuário: `marketing`.

### 3. Inclusão de sidecar

Só adicione um segundo subagente se ele puder trabalhar em arquivos diferentes:

- `frontend` + `design`: permitido se `frontend` ficar em `src/App.jsx` e `design` em CSS;
- `backend` + `api`: permitido se `backend` ficar em robustez/cache e `api` em contrato/proxy;
- `marketing` como sidecar: permitido apenas para texto em arquivos que nenhum outro agente esteja editando.

### 4. Regras de bloqueio

O orquestrador deve bloquear distribuição paralela quando:

- dois subagentes precisariam editar o mesmo arquivo;
- a tarefa mistura layout e copy no mesmo arquivo sem possibilidade de divisão por etapas;
- a alteração depende de contrato de API ainda indefinido;
- a tarefa pede refactor transversal sem fronteira clara;
- a mudança em `src/App.jsx` mistura transformação de dados, UI e copy ao mesmo tempo.

Nesses casos, o orquestrador deve executar em fases:

1. definir contrato ou base técnica;
2. aplicar implementação principal;
3. aplicar polimento visual ou textual.

## Formato obrigatório do handoff

Toda tarefa enviada pelo orquestrador a um subagente deve conter:

```md
## Objetivo
O resultado exato esperado.

## Contexto
O que já existe no repositório e o que não pode ser quebrado.

## Escopo de escrita permitido
Lista fechada de arquivos, pastas ou globs que o subagente pode alterar.

## Escopo proibido
Arquivos, pastas ou decisões fora da competência do subagente.

## Restrições
Regras técnicas, UX, compatibilidade, testes e dependências.

## Entregável
O que deve ser devolvido ao orquestrador.

## Critérios de bloqueio
Quando interromper e devolver dúvida ou risco.
```

## Formato obrigatório da devolução

Todo subagente deve responder exatamente no formato abaixo:

```md
## Status
done | blocked

## Arquivos alterados
- caminho/arquivo-a
- caminho/arquivo-b

## O que foi feito
- alteração objetiva 1
- alteração objetiva 2

## Riscos ou pendências
- risco 1
- pendência 2

## Testes
- comando executado ou motivo por não executar
```

Nenhum especialista deve renomear essas seções. Informações extras devem ser encaixadas em `O que foi feito`, `Riscos ou pendências` ou `Testes`.

## Matriz de conflito

- `src/App.jsx`: um único dono por mudança, salvo edição manual sequencial pelo orquestrador.
- `src/App.css` e `src/index.css`: preferencialmente `design`; não editar em paralelo com outro agente.
- `api/ranking.js`, `api/update-metrics.js`, `vercel.json` e `vite.config.js`: tratar como pacote do agente `api` quando a mudança tocar integração, proxy ou deploy.
- Copy em `src/App.jsx`: fase separada de `marketing` quando houver também alteração de layout ou lógica.
- Dados vindos do webhook de ranking: contrato pertence a `api`; exibição pertence a `frontend`.

## Convenção de fases

Quando a tarefa tocar mais de uma disciplina, usar esta ordem padrão:

1. `api` ou `backend` para base técnica;
2. `frontend` para composição e comportamento;
3. `design` para polimento visual;
4. `marketing` para copy final.

## Política de integração com runner

- o orquestrador mantém o caminho crítico no fluxo principal;
- subagentes reais recebem sidecars independentes ou fatias de implementação com write set disjunto;
- o orquestrador não deve refazer localmente uma tarefa já delegada;
- após o retorno, o orquestrador revisa, integra e decide se precisa de nova rodada;
- se um agente ficar ocioso após entregar, ele deve ser fechado.
