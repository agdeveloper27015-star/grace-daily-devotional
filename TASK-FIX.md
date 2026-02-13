# TASK: Corrigir Home - Versículo do Dia e Progresso de Leitura

## Contexto
App React+TS de devocional cristão. A Home (components/Home.tsx) tem dois problemas:

## Bug 1: Versículo do Dia não funciona
**Problema:** Usa Gemini API com chave inválida (PLACEHOLDER). Sempre cai no fallback hardcoded "Romanos 8:28".

**Solução:** Criar sistema de versículo diário usando os dados da Bíblia que JÁ TEMOS no bibleService.ts:
- Criar função `getDailyVerse()` em `services/bibleService.ts`
- Criar uma lista curada de 365 versículos inspiracionais famosos e significativos (NÃO aleatórios!)
- Cada versículo deve ser uma passagem conhecida, com profundidade espiritual e contexto
- Categorias: promessas de Deus, conforto, sabedoria, fé, amor, esperança, força, gratidão
- Exemplos: Jeremias 29:11, Filipenses 4:13, Salmo 23:1, Isaías 41:10, João 3:16, Provérbios 3:5-6
- Selecionar o versículo baseado no dia do ano (dia 1 = verso 1, dia 2 = verso 2... determinístico)
- Formato: `{ text: string, reference: string }`
- NÃO depender de API externa

## Bug 2: "Continuar Leitura" é hardcoded
**Problema:** Em Home.tsx o progresso está fixo: `{ book: "Romanos", chapter: 8, percentage: 75 }`

**Solução:** 
- Importar `getReadingProgress` de `services/bibleService.ts`
- Se tiver progresso salvo no localStorage, mostrar o livro/capítulo real
- Calcular a % real: (capítulo atual / total de capítulos do livro) * 100
- Se NÃO tiver progresso, mostrar mensagem como "Comece sua leitura" em vez de dados fake
- Ao clicar na seção de progresso, navegar para a leitura (usar onNavigate('LEITURA'))

## Arquivos para modificar:
- `services/bibleService.ts` - adicionar getDailyVerse()
- `components/Home.tsx` - integrar versículo real + progresso real

## IMPORTANTE:
- Manter o design sage-green existente
- Manter todas as animações
- Tudo em português
- Não quebrar nenhuma funcionalidade existente
- NÃO mexer no geminiService.ts (será usado só para busca)
