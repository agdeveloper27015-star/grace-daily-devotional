import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import DictionaryModal from '../../components/DictionaryModal';
import type { DictionaryEntry } from '../../services/dictionaryService';

describe('DictionaryModal', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeAll(() => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    document.body.style.overflow = '';
  });

  it('renderiza referencias_relacionadas como lista de strings', async () => {
    const entry: DictionaryEntry = {
      palavra_pt: 'principio',
      palavra_original: 'רֵאשִׁית',
      transliteracao: 'reshit',
      strong: 'H7225',
      significado_raiz: 'inicio, primicia',
      significado_contextual: 'inicio absoluto da criacao',
      explicacao_detalhada: 'termo que introduz o inicio de tudo em Genesis.',
      por_que_esta_palavra: 'marca um ponto inicial definido.',
      conexao_teologica: 'conecta com Joao 1:1.',
      referencias_relacionadas: ['Gênesis 1:1', 'João 1:1'],
    };

    await act(async () => {
      root.render(
        <DictionaryModal
          entry={entry}
          word="principio"
          bookName="Gênesis"
          chapter={1}
          verse={1}
          onClose={() => undefined}
        />
      );
    });

    expect(document.body.textContent).toContain('Referências relacionadas');
    expect(document.body.textContent).toContain('Gênesis 1:1');
    expect(document.body.textContent).toContain('João 1:1');
  });
});
