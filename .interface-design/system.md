# Grace Interface System

## Direction
- Theme: Editorial claro, monocromatico (branco/cinza/preto) com um unico acento.
- Product center: Estudo biblico.
- Signature motif: Pergaminho moderno (textura sutil, camadas leves, linguagem editorial).
- Depth strategy: Surface shift (sem sombras pesadas como mecanismo principal).

## Color Tokens
- `--bg-page: #F6F6F4`
- `--bg-surface-1: #FFFFFF`
- `--bg-surface-2: #EEEEEB`
- `--bg-surface-3: #E2E2DE`
- `--fg-primary: #111111`
- `--fg-secondary: #2C2C2C`
- `--fg-muted: #6B6B6B`
- `--border-subtle: rgba(17,17,17,0.08)`
- `--border-default: rgba(17,17,17,0.14)`
- `--accent: #2F3B52`

## Typography
- Display headings: Cormorant Garamond
- UI and body: Source Sans 3
- Long Bible reading: Literata
- Numeric data: tabular nums enabled

## Spacing and Radius
- Base scale: 4px tokens (`--space-1..8`)
- Radius:
  - `--radius-sm: 10px`
  - `--radius-md: 16px`
  - `--radius-lg: 24px`

## Motion
- `--motion-fast: 140ms`
- `--motion-base: 180ms`
- `--motion-slow: 260ms`
- Easing: `--ease-standard: cubic-bezier(0.22, 1, 0.36, 1)`

## Layout Patterns
- Mobile-first with fixed bottom tabs.
- Desktop layout in 3 columns:
  - Side rail (left)
  - Main content (center)
  - Context panel (right)
- Notebook consolidates favorites + notes with segmented tabs.

## Component Patterns
- `paper-panel`: primary container surface
- `state-card`: utility card for rows/stats/results
- `pill-button` and `pill-button-accent`: control primitives
- `icon-button`: circular utility actions

## Rules
- Keep one accent color for CTA/focus.
- Preserve service contracts and localStorage keys.
- Avoid native-feeling controls when custom alternatives exist.
