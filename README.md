# Ranking Grupo Vieira

Painel de TV (dashboard) que exibe, em rotação automática, os rankings de formalização do Grupo Vieira, uma tela comercial da plataforma **Nova Europa 5** e uma aba de **jogos ao vivo**. Feito para rodar em telão/monitor da operação.

Stack: **React 19 + Vite**, animações com **Framer Motion** e **GSAP**. Deploy na **Vercel** (com API serverless em `/api`).

## Identidade visual

Tema **claro** com a identidade **VieiraCred** — azul da marca `#066EEA` (mesma da bolinha do logo) sobre fundo claro, cards brancos e texto navy. Modais (1º lugar e gols) em **azul e branco**. A paleta é centralizada em variáveis CSS no `src/index.css` (`--brand`, `--brand-deep`, `--cyan`, `--text`, `--surface`, etc.).

## Telas em rotação

O painel alterna automaticamente entre:

- **Ranking TOP 10 Vendedor** — resultado do dia por vendedor (com avatar)
- **Ranking TOP 5 Supervisor** — por equipe
- **Ranking Grupo** — por franquia
- **Ranking TOP 10 Portabilidade / Novo / CLT** — por produto
- **Jogos de Hoje - Ao Vivo** — placares e status via API da ESPN
- **Nova Europa 5** — vídeo comercial da plataforma (`src/assets/Europa5 Comercial.mp4`) em tela cheia

Recursos: tela de intro, spotlight do 1º lugar a cada troca de ranking, modal de gol ao vivo e skeleton loader durante o carregamento.

Cada tela fica 30s (`ROTATION_INTERVAL`), exceto a do Nova Europa 5: ela avança somente quando o vídeo termina (evento `ended`), com a barra de progresso acompanhando a duração real do vídeo. O botão de pausa também pausa o vídeo.

## Rodando localmente

```bash
npm install
npm run dev      # servidor de desenvolvimento (Vite)
npm run build    # build de produção -> dist/
npm run preview  # pré-visualiza o build
npm run lint     # ESLint
```

## Estrutura

```
src/
  App.jsx              # orquestra rotação, timers, intro e modais
  App.css / index.css  # tema (paleta em variáveis CSS)
  components/          # RankCard, RankRow, GameRow, GamesScroller,
                       # Europa5Card, SpotlightOverlay, GoalModal, IntroScreen...
  hooks/               # useRankingData, useWorldCupGames, useEuropa5Stats,
                       # useSpotlight, useGoalModal
  lib/                 # rankings, formatters, countryUtils, gameUtils, constants
api/                   # funções serverless (Vercel): ranking, worldcup-games,
                       # worldcup-stadiums, europa5-stats
public/                # logo (bolinha VieiraCred), bandeiras, assets
```

## APIs / proxy

Em produção, o front consome as rotas serverless em `/api` (proxy da Vercel), evitando CORS e escondendo o upstream:

- `/api/ranking` — dados de formalização (New Corban)
- `/api/worldcup-games` e `/api/worldcup-stadiums` — jogos/estádios (ESPN)
- `/api/europa5-stats` — estatísticas da plataforma Nova Europa 5

## Variáveis de ambiente (nomes)

Configuradas na Vercel (ver `vercel.json`):

- `UPSTREAM_API_BASE` — base da API de ranking (upstream)
- `UPSTREAM_API_BASE_FALLBACK` — base alternativa (fallback)

> Os valores reais ficam na Vercel — não versionar segredos.

## Deploy

Deploy na **Vercel**: `buildCommand: npm run build`, saída em `dist/`. As rotas `/api/*` são reescritas para as funções serverless e o restante cai no SPA (`index.html`), conforme `vercel.json`.
