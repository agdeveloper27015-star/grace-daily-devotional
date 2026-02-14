# Prompt para Gerar Dicionário Bíblico Completo

## Contexto
Preciso popular um dicionário bíblico completo para um app devocional. O dicionário é um JSON onde cada chave segue o formato: `livro_capitulo_versiculo_palavra` (tudo minúsculo, sem acentos, separado por underscore).

## Formato de cada entrada

```json
{
  "genesis_1_1_principio": {
    "palavra_pt": "Princípio",
    "palavra_original": "בְּרֵאשִׁית",
    "transliteracao": "bereshit",
    "strong": "H7225",
    "significado_raiz": "Início, começo, primeiro",
    "significado_contextual": "Descrição de como a palavra é usada especificamente neste versículo e contexto do livro.",
    "explicacao_detalhada": "Explicação teológica aprofundada do termo, sua etimologia, uso no texto original e significado espiritual.",
    "por_que_esta_palavra": "Por que esta palavra é importante nesta passagem e o que se perde na tradução.",
    "conexao_teologica": "Como esta palavra conecta-se a temas bíblicos maiores e à revelação progressiva.",
    "referencias_relacionadas": [
      {
        "referencia": "João 1:1",
        "relevancia": "O Verbo no princípio - conexão direta com Gênesis"
      },
      {
        "referencia": "Colossenses 1:16",
        "relevancia": "Cristo como agente da criação"
      }
    ]
  }
}
```

## Regras

1. **Chave**: `livro_capitulo_versiculo_palavra` — tudo minúsculo, sem acentos. Exemplos: `genesis_1_1_principio`, `mateus_5_3_bem_aventurados`, `salmos_23_1_senhor`
2. **Nomes dos livros** (usar exatamente):
   - AT: genesis, exodo, levitico, numeros, deuteronomio, josue, juizes, rute, 1samuel, 2samuel, 1reis, 2reis, 1cronicas, 2cronicas, esdras, neemias, ester, jo, salmos, proverbios, eclesiastes, cantares, isaias, jeremias, lamentacoes, ezequiel, daniel, oseias, joel, amos, obadias, jonas, miqueias, naum, habacuque, sofonias, ageu, zacarias, malaquias
   - NT: mateus, marcos, lucas, joao, atos, romanos, 1corintios, 2corintios, galatas, efesios, filipenses, colossenses, 1tessalonicenses, 2tessalonicenses, 1timoteo, 2timoteo, tito, filemom, hebreus, tiago, 1pedro, 2pedro, 1joao, 2joao, 3joao, judas, apocalipse
3. **palavra_original**: Em hebraico (AT) ou grego (NT), com diacríticos
4. **strong**: Código Strong correto (H para hebraico, G para grego)
5. **significado_contextual**: Deve ser específico ao versículo, não genérico
6. **explicacao_detalhada**: 3-5 frases, teologicamente preciso
7. **referencias_relacionadas**: 2-3 referências bíblicas relevantes com explicação da relevância
8. Selecionar **3-5 palavras-chave teologicamente relevantes por capítulo** (não toda palavra, apenas as significativas)
9. Palavras com número Strong real e verificável
10. Baseado na tradução **Almeida Corrigida Fiel (ACF)**

## O que gerar

Gere o JSON para o livro de **[NOME DO LIVRO]**, todos os capítulos, selecionando 3-5 palavras-chave por capítulo.

Retorne APENAS o JSON válido, sem markdown, sem explicações extras. O JSON deve poder ser parseado diretamente.

## Exemplo completo (Gênesis 1:1-3)

```json
{
  "genesis_1_1_principio": {
    "palavra_pt": "Princípio",
    "palavra_original": "בְּרֵאשִׁית",
    "transliteracao": "bereshit",
    "strong": "H7225",
    "significado_raiz": "Início, começo, primeiro em ordem",
    "significado_contextual": "No contexto de Gênesis 1:1, 'princípio' marca o início absoluto da criação divina, o momento em que Deus deu origem ao tempo, espaço e matéria.",
    "explicacao_detalhada": "O termo hebraico bereshit (H7225) é a primeira palavra da Bíblia e carrega imenso peso teológico. Derivada da raiz 'rosh' (cabeça, primeiro), indica não apenas um começo cronológico, mas a primazia e soberania de Deus sobre toda a criação. Os rabinos ensinavam que esta palavra contém em si toda a revelação divina.",
    "por_que_esta_palavra": "A palavra 'princípio' é fundamental porque estabelece que o universo teve um começo — não é eterno. Isso refuta o panteísmo e estabelece Deus como anterior e superior à criação.",
    "conexao_teologica": "Este 'princípio' conecta-se diretamente com João 1:1 ('No princípio era o Verbo'), revelando que Cristo estava presente na criação. A teologia bíblica traça uma linha do primeiro 'princípio' até a 'nova criação' em Apocalipse 21.",
    "referencias_relacionadas": [
      {
        "referencia": "João 1:1-3",
        "relevancia": "O Verbo estava no princípio e por ele todas as coisas foram feitas"
      },
      {
        "referencia": "Hebreus 11:3",
        "relevancia": "Pela fé entendemos que os mundos foram criados pela palavra de Deus"
      },
      {
        "referencia": "Apocalipse 21:1",
        "relevancia": "Novo céu e nova terra — Deus que criou no princípio recria no fim"
      }
    ]
  },
  "genesis_1_1_deus": {
    "palavra_pt": "Deus",
    "palavra_original": "אֱלֹהִים",
    "transliteracao": "Elohim",
    "strong": "H430",
    "significado_raiz": "Deus, divindade, poder supremo",
    "significado_contextual": "Elohim é o primeiro nome de Deus revelado na Bíblia, apresentando-O como Criador todo-poderoso. A forma plural com verbo singular sugere a pluralidade na unidade divina.",
    "explicacao_detalhada": "Elohim (H430) é a forma plural de 'Eloah' e aparece mais de 2.600 vezes no AT. O uso do plural com o verbo 'bara' (criou) no singular é um dos primeiros indícios da Trindade. Este nome enfatiza o poder, majestade e transcendência de Deus como Criador soberano.",
    "por_que_esta_palavra": "O nome Elohim revela que o Deus da Bíblia é fundamentalmente um Criador. Não é uma força impessoal, mas um Ser pessoal que age com propósito e poder infinito.",
    "conexao_teologica": "Elohim como Criador é a base de toda a teologia bíblica. Se Deus criou tudo, Ele tem autoridade sobre tudo. Este conceito fundamenta a soberania divina, a mordomia humana e a esperança da nova criação.",
    "referencias_relacionadas": [
      {
        "referencia": "Salmos 19:1",
        "relevancia": "Os céus declaram a glória de Deus (El) — a criação testifica do Criador"
      },
      {
        "referencia": "Isaías 45:18",
        "relevancia": "Deus formou a terra para ser habitada — criação com propósito"
      }
    ]
  },
  "genesis_1_2_espirito": {
    "palavra_pt": "Espírito",
    "palavra_original": "רוּחַ",
    "transliteracao": "Ruach",
    "strong": "H7307",
    "significado_raiz": "Vento, sopro, espírito",
    "significado_contextual": "O Espírito de Deus pairava sobre as águas primordiais, indicando Sua presença ativa e sustentadora na criação, preparando o caos para receber a ordem divina.",
    "explicacao_detalhada": "Ruach (H7307) pode significar vento, sopro ou espírito. O verbo 'merachefet' (pairava) é o mesmo usado para uma águia que paira sobre seus filhotes (Dt 32:11), sugerindo cuidado e proteção. O Espírito não estava inerte, mas ativamente envolvido na criação.",
    "por_que_esta_palavra": "Esta é a primeira menção do Espírito Santo na Bíblia, revelando que a Trindade estava presente e ativa na criação desde o primeiro momento.",
    "conexao_teologica": "O Espírito que pairou sobre o caos da criação é o mesmo que ressuscitou Cristo (Rm 8:11) e habita nos crentes. Há um paralelo entre a criação original e a nova criação espiritual.",
    "referencias_relacionadas": [
      {
        "referencia": "Salmos 104:30",
        "relevancia": "O Espírito de Deus renova a face da terra"
      },
      {
        "referencia": "Romanos 8:11",
        "relevancia": "O mesmo Espírito que ressuscitou Jesus vivifica nossos corpos mortais"
      }
    ]
  }
}
```

## Estratégia de geração

Gere **um livro por vez**, começando pelos que faltam. Cada livro deve ter 3-5 palavras por capítulo. Os livros da Bíblia têm entre 1 e 150 capítulos, então cada resposta pode ter de 5 a 750 entradas.

Para livros grandes (Gênesis, Salmos, Isaías, etc), pode dividir em partes:
- Gênesis 1-25, depois 26-50
- Salmos 1-50, depois 51-100, depois 101-150
- etc.
