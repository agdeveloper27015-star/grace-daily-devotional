# Especificação do Dicionário Bíblico — Bíblia Dabar

## Objetivo

Cada entrada do dicionário explica uma palavra bíblica no seu contexto original (hebraico/grego), ajudando o leitor a entender não só **o que** a palavra significa, mas **por que** o autor bíblico a escolheu e **como** ela se conecta com o restante da Bíblia.

---

## Estrutura da Entrada (JSON)

```json
{
  "palavra_pt": "",
  "palavra_original": "",
  "transliteracao": "",
  "strong": "",
  "significado_raiz": "",
  "significado_contextual": "",
  "explicacao_detalhada": "",
  "por_que_esta_palavra": "",
  "conexao_teologica": "",
  "referencias_relacionadas": []
}
```

---

## Campos — Definição e Regras

### `palavra_pt` (string)
**O que é:** Tradução da palavra em português brasileiro.
- Use a tradução mais fiel ao original, não necessariamente a mais popular.
- Se houver múltiplos sentidos válidos, separe com `/` (ex: `"princípio/primícias"`).
- Sempre em minúsculas, exceto nomes próprios.

### `palavra_original` (string)
**O que é:** A palavra no alfabeto original (hebraico, aramaico ou grego).
- Hebraico/Aramaico: caracteres hebraicos com niqud (pontuação vocálica) quando disponível.
- Grego: caracteres gregos com acentos.
- Exemplo hebraico: `"שָׁמַיִם"`
- Exemplo grego: `"λόγος"`

### `transliteracao` (string)
**O que é:** A pronúncia romanizada da palavra original.
- Use o padrão de transliteração acadêmico simplificado.
- Exemplo: `"shâmayim"`, `"lógos"`, `"rêʼshîyth"`

### `strong` (string)
**O que é:** O código de referência da Concordância de Strong.
- Formato: `H` + número para hebraico (ex: `"H8064"`), `G` + número para grego (ex: `"G3056"`).
- Deve ser um número Strong **real e verificável**. Nunca inventar números.

### `significado_raiz` (string)
**O que é:** O significado raiz/etimológico da palavra segundo o dicionário Strong.
- Traduzir para português brasileiro.
- Manter conciso (1-2 frases).
- Incluir sentidos literal e figurado quando relevante.
- Exemplo: `"O céu (como elevado); o dual possivelmente alude ao arco visível onde as nuvens se movem, bem como ao éter superior onde estão os corpos celestiais."`

### `significado_contextual` (string)
**O que é:** O que a palavra significa **neste versículo específico**.
- Não repetir o significado_raiz. Focar no sentido que o autor pretendeu naquele contexto.
- 1-2 frases, linguagem clara e acessível.
- Exemplo: `"O domínio celestial criado por Deus — tanto o céu visível (atmosfera, espaço) quanto a morada de Deus."`

### `explicacao_detalhada` (string)
**O que é:** Explicação aprofundada da palavra, sua raiz, morfologia e uso bíblico.
- 2-4 frases.
- Pode incluir: raiz etimológica, forma gramatical (verbo, substantivo, etc.), número/gênero, uso em outros contextos bíblicos.
- Tom: didático mas acessível. Não é artigo acadêmico, é pra leitor curioso.
- Exemplo: `"Shamayim (שָׁמַיִם) é um substantivo dual/plural, sugerindo múltiplos 'céus'. A Bíblia distingue: o céu atmosférico (nuvens), o céu astronômico (estrelas) e o 'céu dos céus' (morada de Deus). Em Gênesis 1:1, abrange toda a dimensão celestial da criação."`

### `por_que_esta_palavra` (string)
**O que é:** Por que o autor bíblico **escolheu esta palavra específica** em vez de outra.
- Este é o campo mais valioso e diferencial do dicionário.
- Explique a intenção do autor, o contraste com alternativas, ou o que essa escolha revela.
- 1-3 frases.
- Exemplo: `"O autor de Gênesis escolheu esta palavra para estabelecer que o universo teve um início absoluto, em contraste com as cosmogonias pagãs que assumiam matéria eterna."`
- Exemplo 2: `"Estabelece que até o céu — a dimensão mais elevada e misteriosa — é criação de Deus, não uma divindade independente como acreditavam os povos vizinhos."`

### `conexao_teologica` (string)
**O que é:** Como esta palavra se conecta com outros textos bíblicos, especialmente entre AT e NT.
- Priorizar conexões AT↔NT (tipologia, cumprimento profético, paralelos).
- 1-3 frases.
- Sempre citar pelo menos 1 referência bíblica.
- Exemplo: `"Jesus ensina a orar 'Pai nosso que estás nos céus' (Mt 6:9). Apocalipse 21:1 promete 'novos céus' — a renovação completa da criação."`

### `referencias_relacionadas` (array de strings)
**O que é:** Lista de versículos bíblicos relacionados à palavra.
- Formato: `"Livro capítulo:versículo"` (ex: `"Gênesis 1:1"`, `"Mateus 6:9"`).
- 2-5 referências, priorizando as mais relevantes.
- Incluir o próprio versículo de origem + conexões AT/NT.
- Nomes dos livros em **português** (Gênesis, não Genesis; Mateus, não Matthew).

---

## Chave da Entrada (ID)

Formato: `{livro}_{capitulo}_{versiculo}_{palavra}`

- Tudo em minúsculas, sem acentos, separado por `_`.
- Exemplo: `genesis_1_1_ceu`, `joao_1_1_verbo`, `romanos_8_28_todas_coisas`

---

## Regras Gerais

1. **Nunca inventar números Strong.** Use apenas códigos verificáveis.
2. **Português brasileiro** em todos os campos (não Portugal).
3. **Tom acessível.** Imagine explicar para alguém inteligente que nunca estudou teologia.
4. **Sem enrolação.** Cada frase deve trazer informação nova.
5. **Priorizar palavras teologicamente ricas.** Artigos, preposições e conjunções comuns podem ter campos contextuais vazios.
6. **Consistência.** Mesma palavra Strong em versículos diferentes pode ter `significado_contextual` e `por_que_esta_palavra` diferentes (o contexto muda), mas `significado_raiz`, `palavra_original`, `transliteracao` e `strong` devem ser idênticos.
7. **Referências reais.** Toda referência bíblica citada deve existir de fato.

---

## Exemplo Completo

```json
{
  "palavra_pt": "princípio/primícias",
  "palavra_original": "רֵאשִׁית",
  "transliteracao": "rêʼshîyth",
  "strong": "H7225",
  "significado_raiz": "O primeiro, em lugar, tempo, ordem ou posto. Especificamente, uma primícia — o primeiro fruto oferecido a Deus.",
  "significado_contextual": "O ponto de partida absoluto, o primeiro momento da criação. Em Gênesis 1:1, indica que houve um começo definido para o universo.",
  "explicacao_detalhada": "Reshit (רֵאשִׁית) vem da raiz rosh (cabeça, primeiro). Denota não apenas prioridade temporal, mas também importância e primazia. É usada para as primícias oferecidas a Deus, sugerindo que o ato da criação foi a 'primícia' de Deus — o primeiro e mais fundamental de Seus atos.",
  "por_que_esta_palavra": "O autor de Gênesis escolheu esta palavra para estabelecer que o universo teve um início absoluto, em contraste com as cosmogonias pagãs que assumiam matéria eterna.",
  "conexao_teologica": "Conecta-se com João 1:1 ('No princípio era o Verbo'), Provérbios 8:22 (a sabedoria como primícia), e Colossenses 1:18 (Cristo como primogênito). O 'princípio' de Gênesis encontra seu cumprimento no 'novo princípio' em Cristo.",
  "referencias_relacionadas": [
    "Gênesis 1:1",
    "João 1:1",
    "Provérbios 8:22",
    "Colossenses 1:18"
  ]
}
```

---

## Campos Vazios

Se não houver informação suficiente para um campo, deixe como string vazia `""` (ou array vazio `[]` para referências). **Nunca preencher com conteúdo genérico ou inventado.**

Campos que podem ficar vazios em palavras comuns (artigos, preposições):
- `significado_contextual`
- `explicacao_detalhada`
- `por_que_esta_palavra`
- `conexao_teologica`
- `referencias_relacionadas`

Campos que **nunca** devem ficar vazios:
- `palavra_pt`
- `palavra_original`
- `transliteracao`
- `strong`
- `significado_raiz`
