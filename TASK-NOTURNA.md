# TASK-NOTURNA.md — Melhorias Grace Daily Devotional

## Contexto
App devocional cristão em React + TypeScript + Vite. 
Usa Tailwind via CDN (`tailwind.config` inline no `index.html`).
Cores: sage-green (#6B8E83), sage-light (#E8F1EE).
Fontes: Inter (sans), Playfair Display (serif).
Dados bíblicos: ACF via JSON GitHub API.
Persistência: localStorage (sem backend).

## REGRAS IMPORTANTES
- NÃO mudar o design visual existente (cores, fontes, espaçamentos)
- NÃO adicionar novas dependências npm
- NÃO modificar vite.config.ts, package.json, tsconfig.json
- NÃO implementar autenticação (auth vem depois)
- Manter tudo em português brasileiro
- Tailwind é via CDN (script tag no index.html), NÃO usar @apply
- Testar se compila: `npm run build` deve passar sem erros

## Tarefas (em ordem de prioridade)

### 1. Expandir versículos diários para 365
**Arquivo:** `services/bibleService.ts`
- O array `DAILY_VERSES` tem ~60 versículos. Expandir para 365 (um por dia do ano)
- Manter versículos existentes, adicionar novos
- Todos em português ACF (Almeida Corrigida Fiel)
- Versículos significativos e inspiradores (não aleatórios)
- Categorias: fé, esperança, amor, força, sabedoria, paz, gratidão, coragem, perdão, consolo
- Não repetir versículos

### 2. PWA — Tornar instalável como app no celular
**Arquivos novos:** `public/manifest.json`, `public/sw.js`
**Modificar:** `index.html`

Implementar:
- Criar `manifest.json` com nome "Grace", tema sage-green, ícones
- Criar service worker básico para cache offline
- Adicionar `<link rel="manifest">` no index.html
- Adicionar meta tags para iOS (apple-mobile-web-app-capable, etc)
- Adicionar ícones PWA (pode usar SVG inline ou gerar placeholder)
- O app deve funcionar offline após primeiro carregamento (cache dos assets)
- Criar arquivo `public/icons/icon-192.svg` e `public/icons/icon-512.svg` (ícones simples com a letra G estilizada em sage-green)

Nota: os ícones SVG devem estar em pasta `public/icons/`. O manifest.json em `public/`.

### 3. Melhorar Perfil (Profile.tsx)
**Arquivo:** `components/Profile.tsx`

O perfil atual é estático com dados fake ("Grace Thompson"). Melhorar para:
- Mostrar estatísticas REAIS do localStorage:
  - Total de versículos lidos (calcular dos capítulos visitados)
  - Total de favoritos
  - Total de notas
  - Dias usando o app (salvar primeira visita em localStorage)
- Seção "Minha Jornada" com as stats acima em cards bonitos
- Remover "Grace Thompson" e "Membro desde 2023"
- Trocar por "Meu Perfil" com avatar genérico
- Manter "Configurações da Conta", "Notificações Diárias", "Idiomas" como placeholders
- Adicionar seção "Sobre o Grace" no final (versão 1.0, feito com ❤️)

### 4. Saudação dinâmica no header (App.tsx)
**Arquivo:** `App.tsx`

Atualmente diz "Bom dia, Grace" sempre. Mudar para:
- "Bom dia" (5h-12h)
- "Boa tarde" (12h-18h)
- "Boa noite" (18h-5h)
- Trocar "Grace" por "Peregrino" (usuário genérico sem auth)
- Usar hora local do dispositivo

### 5. Melhorar botões de favorito/nota na lista de Favoritos e Notas
**Arquivos:** `components/Favorites.tsx`, `components/Notes.tsx`

Os botões de ação (editar, excluir) usam `opacity-0 group-hover:opacity-100` que não funciona em mobile.
- Mudar para `sm:opacity-0 sm:group-hover:opacity-100` (visível sempre em mobile, hover em desktop)
- Mesmo padrão já aplicado no Reading.tsx

### 6. Adicionar "Voltar ao topo" na leitura (Reading.tsx)
**Arquivo:** `components/Reading.tsx`

Quando o usuário rola muito pra baixo lendo um capítulo longo:
- Mostrar um botão flutuante "↑" no canto inferior direito
- Aparece quando scroll > 500px
- Smooth scroll to top ao clicar
- Estilo: círculo sage-green com seta branca, shadow, 48x48px
- Fade in/out suave

## Ordem de execução
1 → 4 → 5 → 6 → 3 → 2

## Teste final
Após todas as mudanças, rodar `npm run build` e confirmar que compila sem erros.
