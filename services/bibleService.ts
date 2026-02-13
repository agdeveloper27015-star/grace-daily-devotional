import { BibleBook, BibleChapter, BibleVerse, BibleReference } from '../types';

// Bible data from thiagobodruk/bible GitHub repository
const BIBLE_JSON_URL = 'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/pt_acf.json';

let bibleCache: BibleBook[] | null = null;

export const fetchBibleData = async (): Promise<BibleBook[]> => {
  if (bibleCache) {
    return bibleCache;
  }

  try {
    const response = await fetch(BIBLE_JSON_URL);
    if (!response.ok) {
      throw new Error('Failed to fetch Bible data');
    }
    const data = await response.json();
    bibleCache = data;
    return data;
  } catch (error) {
    console.error('Error fetching Bible data:', error);
    // Return a minimal fallback for Genesis 1
    return [{
      abbrev: 'gn',
      name: 'Gênesis',
      chapters: [
        ['No princípio criou Deus os céus e a terra.', 'E a terra era sem forma e vazia; e havia trevas sobre a face do abismo; e o Espírito de Deus se movia sobre a face das águas.', 'E disse Deus: Haja luz; e houve luz.', 'E viu Deus que era boa a luz; e fez Deus separação entre a luz e as trevas.', 'E Deus chamou à luz Dia; e às trevas chamou Noite. E foi a tarde e a manhã, o dia primeiro.']
      ]
    }];
  }
};

export const getBooks = async (): Promise<BibleBook[]> => {
  const bible = await fetchBibleData();
  return bible;
};

export const getBook = async (abbrev: string): Promise<BibleBook | null> => {
  const bible = await fetchBibleData();
  return bible.find(book => book.abbrev === abbrev) || null;
};

export const getChapter = async (abbrev: string, chapterNumber: number): Promise<BibleChapter | null> => {
  const book = await getBook(abbrev);
  if (!book || chapterNumber < 1 || chapterNumber > book.chapters.length) {
    return null;
  }
  
  const verses = book.chapters[chapterNumber - 1];
  return {
    bookAbbrev: abbrev,
    bookName: book.name,
    chapterNumber,
    verses: verses.map((text, index) => ({
      number: index + 1,
      text
    }))
  };
};

export const getVerse = async (abbrev: string, chapterNumber: number, verseNumber: number): Promise<BibleVerse | null> => {
  const chapter = await getChapter(abbrev, chapterNumber);
  if (!chapter || verseNumber < 1 || verseNumber > chapter.verses.length) {
    return null;
  }
  
  const verse = chapter.verses[verseNumber - 1];
  return {
    ...verse,
    bookAbbrev: abbrev,
    bookName: chapter.bookName,
    chapterNumber
  };
};

export const formatReference = (reference: BibleReference): string => {
  return `${reference.bookName} ${reference.chapter}:${reference.verse}`;
};

// Reading progress management
const PROGRESS_KEY = 'grace_bible_progress';

export interface ReadingProgress {
  bookAbbrev: string;
  bookName: string;
  chapter: number;
  timestamp: number;
}

export const saveReadingProgress = (progress: ReadingProgress): void => {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
};

export const getReadingProgress = (): ReadingProgress | null => {
  const stored = localStorage.getItem(PROGRESS_KEY);
  return stored ? JSON.parse(stored) : null;
};

// Local Bible search - searches through all verses
export interface BibleSearchResult {
  bookName: string;
  bookAbbrev: string;
  chapter: number;
  verse: number;
  text: string;
}

export const searchBible = async (query: string, maxResults: number = 30): Promise<BibleSearchResult[]> => {
  const bible = await fetchBibleData();
  const results: BibleSearchResult[] = [];
  const normalizedQuery = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 2);
  
  if (queryWords.length === 0) return [];

  for (const book of bible) {
    // Check if searching for a book name
    const bookNameNorm = book.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const isBookSearch = normalizedQuery.includes(bookNameNorm) || bookNameNorm.includes(normalizedQuery);
    
    for (let chIdx = 0; chIdx < book.chapters.length; chIdx++) {
      const verses = book.chapters[chIdx];
      for (let vIdx = 0; vIdx < verses.length; vIdx++) {
        const verseText = verses[vIdx];
        const normalizedVerse = verseText.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        
        // Score: how many query words match
        const matchCount = queryWords.filter(w => normalizedVerse.includes(w)).length;
        
        if (matchCount === queryWords.length || (isBookSearch && matchCount > 0)) {
          results.push({
            bookName: book.name,
            bookAbbrev: book.abbrev,
            chapter: chIdx + 1,
            verse: vIdx + 1,
            text: verseText
          });
          
          if (results.length >= maxResults) return results;
        }
      }
    }
  }
  
  // If exact match found few results, try partial matching
  if (results.length < 5) {
    for (const book of bible) {
      for (let chIdx = 0; chIdx < book.chapters.length; chIdx++) {
        const verses = book.chapters[chIdx];
        for (let vIdx = 0; vIdx < verses.length; vIdx++) {
          const verseText = verses[vIdx];
          const normalizedVerse = verseText.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          
          const matchCount = queryWords.filter(w => normalizedVerse.includes(w)).length;
          
          if (matchCount > 0 && !results.some(r => r.bookAbbrev === book.abbrev && r.chapter === chIdx + 1 && r.verse === vIdx + 1)) {
            results.push({
              bookName: book.name,
              bookAbbrev: book.abbrev,
              chapter: chIdx + 1,
              verse: vIdx + 1,
              text: verseText
            });
            
            if (results.length >= maxResults) return results;
          }
        }
      }
    }
  }
  
  return results;
};

// Get reading percentage for a book
export const getReadingPercentage = async (bookAbbrev: string, currentChapter: number): Promise<number> => {
  const book = await getBook(bookAbbrev);
  if (!book) return 0;
  return Math.round((currentChapter / book.chapters.length) * 100);
};

// Curated daily inspirational verses (365 meaningful verses)
const DAILY_VERSES: { text: string; reference: string }[] = [
  { text: "Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o Senhor; pensamentos de paz, e não de mal, para vos dar o fim que esperais.", reference: "Jeremias 29:11" },
  { text: "Posso todas as coisas naquele que me fortalece.", reference: "Filipenses 4:13" },
  { text: "O Senhor é o meu pastor, nada me faltará.", reference: "Salmos 23:1" },
  { text: "Não temas, porque eu sou contigo; não te assombres, porque eu sou teu Deus; eu te fortaleço, e te ajudo, e te sustento com a destra da minha justiça.", reference: "Isaías 41:10" },
  { text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.", reference: "João 3:16" },
  { text: "Confia no Senhor de todo o teu coração, e não te estribes no teu próprio entendimento. Reconhece-o em todos os teus caminhos, e ele endireitará as tuas veredas.", reference: "Provérbios 3:5-6" },
  { text: "E sabemos que todas as coisas contribuem juntamente para o bem daqueles que amam a Deus, daqueles que são chamados segundo o seu propósito.", reference: "Romanos 8:28" },
  { text: "O Senhor é a minha luz e a minha salvação; a quem temerei? O Senhor é a força da minha vida; de quem me recearei?", reference: "Salmos 27:1" },
  { text: "Mas os que esperam no Senhor renovarão as forças, subirão com asas como águias; correrão, e não se cansarão; caminharão, e não se fatigarão.", reference: "Isaías 40:31" },
  { text: "Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.", reference: "Mateus 11:28" },
  { text: "Eu sou o caminho, e a verdade e a vida; ninguém vem ao Pai, senão por mim.", reference: "João 14:6" },
  { text: "Tudo tem o seu tempo determinado, e há tempo para todo o propósito debaixo do céu.", reference: "Eclesiastes 3:1" },
  { text: "Buscai primeiro o reino de Deus, e a sua justiça, e todas estas coisas vos serão acrescentadas.", reference: "Mateus 6:33" },
  { text: "O amor é sofredor, é benigno; o amor não é invejoso; o amor não trata com leviandade, não se ensoberbece.", reference: "1 Coríntios 13:4" },
  { text: "Porque pela graça sois salvos, por meio da fé; e isto não vem de vós, é dom de Deus.", reference: "Efésios 2:8" },
  { text: "Entrega o teu caminho ao Senhor; confia nele, e ele o fará.", reference: "Salmos 37:5" },
  { text: "A alegria do Senhor é a vossa força.", reference: "Neemias 8:10" },
  { text: "Deus é o nosso refúgio e fortaleza, socorro bem presente na angústia.", reference: "Salmos 46:1" },
  { text: "Lâmpada para os meus pés é tua palavra, e luz para o meu caminho.", reference: "Salmos 119:105" },
  { text: "Não to mandei eu? Esforça-te, e tem bom ânimo; não temas, nem te espantes; porque o Senhor teu Deus é contigo, por onde quer que andares.", reference: "Josué 1:9" },
  { text: "Ora, a fé é o firme fundamento das coisas que se esperam, e a prova das coisas que se não veem.", reference: "Hebreus 11:1" },
  { text: "Se Deus é por nós, quem será contra nós?", reference: "Romanos 8:31" },
  { text: "Clama a mim, e responder-te-ei, e anunciar-te-ei coisas grandes e firmes que não sabes.", reference: "Jeremias 33:3" },
  { text: "Não se turbe o vosso coração; credes em Deus, crede também em mim.", reference: "João 14:1" },
  { text: "O Senhor é bom, ele é fortaleza no dia da angústia e conhece os que confiam nele.", reference: "Naum 1:7" },
  { text: "Deita sobre o Senhor o teu cuidado, e ele te susterá; não permitirá jamais que o justo seja abalado.", reference: "Salmos 55:22" },
  { text: "Porque os meus pensamentos não são os vossos pensamentos, nem os vossos caminhos os meus caminhos, diz o Senhor.", reference: "Isaías 55:8" },
  { text: "Bem-aventurados os pacificadores, porque eles serão chamados filhos de Deus.", reference: "Mateus 5:9" },
  { text: "Em tudo dai graças, porque esta é a vontade de Deus em Cristo Jesus para convosco.", reference: "1 Tessalonicenses 5:18" },
  { text: "Ensina-nos a contar os nossos dias, de tal maneira que alcancemos coração sábio.", reference: "Salmos 90:12" },
  { text: "Porque onde estiver o vosso tesouro, aí estará também o vosso coração.", reference: "Mateus 6:21" },
  { text: "Mas, a todos quantos o receberam, deu-lhes o poder de serem feitos filhos de Deus.", reference: "João 1:12" },
  { text: "Bendize, ó minha alma, ao Senhor, e tudo o que há em mim bendiga o seu santo nome.", reference: "Salmos 103:1" },
  { text: "Eu vim para que tenham vida, e a tenham com abundância.", reference: "João 10:10" },
  { text: "O fruto do Espírito é: amor, gozo, paz, longanimidade, benignidade, bondade, fé, mansidão, temperança.", reference: "Gálatas 5:22-23" },
  { text: "Pois nem a morte, nem a vida poderão nos separar do amor de Deus, que está em Cristo Jesus nosso Senhor.", reference: "Romanos 8:38-39" },
  { text: "Cria em mim, ó Deus, um coração puro, e renova em mim um espírito reto.", reference: "Salmos 51:10" },
  { text: "A misericórdia do Senhor é a causa de não sermos consumidos; porque as suas misericórdias não têm fim. Novas são cada manhã; grande é a tua fidelidade.", reference: "Lamentações 3:22-23" },
  { text: "Aquele que habita no esconderijo do Altíssimo, à sombra do Onipotente descansará.", reference: "Salmos 91:1" },
  { text: "O Senhor pelejará por vós, e vós vos calareis.", reference: "Êxodo 14:14" },
  { text: "Ainda que eu ande pelo vale da sombra da morte, não temerei mal algum, porque tu estás comigo.", reference: "Salmos 23:4" },
  { text: "Bem-aventurados os que têm fome e sede de justiça, porque eles serão fartos.", reference: "Mateus 5:6" },
  { text: "Muita paz têm os que amam a tua lei, e para eles não há tropeço.", reference: "Salmos 119:165" },
  { text: "Porque eu, o Senhor teu Deus, te tomo pela tua mão direita; e te digo: Não temas, eu te ajudo.", reference: "Isaías 41:13" },
  { text: "Jesus Cristo é o mesmo, ontem, e hoje, e eternamente.", reference: "Hebreus 13:8" },
  { text: "Não andeis ansiosos por coisa alguma; em tudo, porém, sejam conhecidas diante de Deus as vossas petições, pela oração e súplica, com ações de graças.", reference: "Filipenses 4:6" },
  { text: "O Senhor é fiel, e ele vos confirmará e guardará do maligno.", reference: "2 Tessalonicenses 3:3" },
  { text: "Aguarda o Senhor; anima-te, e ele fortalecerá o teu coração; espera, pois, pelo Senhor.", reference: "Salmos 27:14" },
  { text: "Eis que estou à porta, e bato; se alguém ouvir a minha voz, e abrir a porta, entrarei em sua casa, e com ele cearei, e ele comigo.", reference: "Apocalipse 3:20" },
  { text: "Pedi, e dar-se-vos-á; buscai, e encontrareis; batei, e abrir-se-vos-á.", reference: "Mateus 7:7" },
  { text: "Eu sou a videira, vós as varas; quem está em mim, e eu nele, esse dá muito fruto; porque sem mim nada podeis fazer.", reference: "João 15:5" },
  { text: "Alegrai-vos sempre no Senhor; outra vez digo, alegrai-vos.", reference: "Filipenses 4:4" },
  { text: "O Senhor está perto dos que têm o coração quebrantado, e salva os contritos de espírito.", reference: "Salmos 34:18" },
  { text: "Filho meu, não te esqueças da minha lei, e o teu coração guarde os meus mandamentos. Porque eles aumentarão os teus dias e te acrescentarão anos de vida e paz.", reference: "Provérbios 3:1-2" },
  { text: "Sejam vossos costumes sem avareza, contentando-vos com o que tendes; porque ele disse: Não te deixarei, nem te desampararei.", reference: "Hebreus 13:5" },
  { text: "Estas coisas vos tenho dito para que tenhais paz em mim. No mundo tereis aflições; mas tende bom ânimo, eu venci o mundo.", reference: "João 16:33" },
  { text: "O meu Deus, segundo as suas riquezas, suprirá todas as vossas necessidades em glória, por Cristo Jesus.", reference: "Filipenses 4:19" },
  { text: "O amor é paciente, é benigno; o amor não é invejoso, não trata com leviandade, não se ensoberbece.", reference: "1 Coríntios 13:4-5" },
  { text: "E nós conhecemos, e cremos no amor que Deus tem para conosco. Deus é amor; e quem vive no amor, vive em Deus, e Deus nele.", reference: "1 João 4:16" },
  { text: "Nisto conhecemos o amor: que Cristo deu a sua vida por nós; e nós devemos dar a vida pelos irmãos.", reference: "1 João 3:16" },
  { text: "Acima de tudo, porém, revistam-se do amor, que é o vínculo da perfeição.", reference: "Colossenses 3:14" },
  { text: "O amor não faz mal ao próximo; de modo que o cumprimento da lei é o amor.", reference: "Romanos 13:10" },
  { text: "Entrai pelas portas dele com gratidão, e em seus átrios com louvor; louvai-o, e bendizei o seu nome.", reference: "Salmos 100:4" },
  { text: "Tudo o que fizerdes, seja em palavra ou em ação, fazei-o em nome do Senhor Jesus, dando por ele graças a Deus Pai.", reference: "Colossenses 3:17" },
  { text: "Bendito o Deus e Pai de nosso Senhor Jesus Cristo, que nos abençoou com todas as bênçãos espirituais nas regiões celestiais em Cristo.", reference: "Efésios 1:3" },
  { text: "A graça do Senhor Jesus Cristo, e o amor de Deus, e a comunhão do Espírito Santo sejam convosco.", reference: "2 Coríntios 13:14" },
  { text: "Deleita-te também no Senhor, e te concederá os desejos do teu coração.", reference: "Salmos 37:4" },
  { text: "O Senhor te abençoe e te guarde; o Senhor faça resplandecer o seu rosto sobre ti, e tenha misericórdia de ti.", reference: "Números 6:24-25" },
  { text: "Cantai ao Senhor, bendizei o seu nome; anunciai a sua salvação de dia em dia.", reference: "1 Crônicas 16:23" },
  { text: "Regozijai-vos no Senhor, vós justos, pois aos retos fica bem o louvor.", reference: "Salmos 33:1" },
  { text: "Graças dou a Deus, que me tem dado a vitória por nosso Senhor Jesus Cristo.", reference: "1 Coríntios 15:57" },
  { text: "Louvai ao Senhor, porque ele é bom; porque a sua benignidade dura para sempre.", reference: "Salmos 118:1" },
  { text: "O Senhor é a minha força e o meu escudo; nele confiou o meu coração, e fui socorrido.", reference: "Salmos 28:7" },
  { text: "Cantai-lhe, cantai-lhe salmos; fazei maravilhas na sua bondade.", reference: "Salmos 105:2" },
  { text: "Pois tu, Senhor, és bom, e perdoador, e grande em benignidade para com todos os que te invocam.", reference: "Salmos 86:5" },
  { text: "E dizei: Livra-nos, ó Deus da nossa salvação, e ajunta-nos, e livra-nos das nações.", reference: "1 Crônicas 16:35" },
  { text: "Grande é o Senhor, e mui digno de louvor, na cidade do nosso Deus, no seu monte santo.", reference: "Salmos 48:1" },
  { text: "Louvai ao Senhor todas as nações; louvai-o todos os povos.", reference: "Salmos 117:1" },
  { text: "Bendize, ó minha alma, ao Senhor, e não te esqueças de nenhum de seus benefícios.", reference: "Salmos 103:2" },
  { text: "Cantai ao Senhor um cântico novo, e o seu louvor na assembleia dos santos.", reference: "Salmos 149:1" },
  { text: "O que oferecer sacrifício de louvor me glorificará; e àquele que bem ordenar o seu caminho eu mostrarei a salvação de Deus.", reference: "Salmos 50:23" },
  { text: "Bem-aventurado o povo que conhece o som festivo; que anda, ó Senhor, na luz da tua presença.", reference: "Salmos 89:15" },
  { text: "Vinde, exultemos de alegria no Senhor; cantemos com júbilo à rocha da nossa salvação.", reference: "Salmos 95:1" },
  { text: "Celebrai com júbilo ao Senhor, todos os habitantes da terra.", reference: "Salmos 100:1" },
  { text: "Cantai louvores a Deus, cantai louvores; cantai louvores ao nosso Rei, cantai louvores.", reference: "Salmos 47:6" },
  { text: "Bendizei, povos, ao nosso Deus, e fazei ouvir a voz do seu louvor.", reference: "Salmos 66:8" },
  { text: "Deixo-vos a paz, a minha paz vos dou; não vo-la dou como o mundo a dá. Não se turbe o vosso coração, nem se atemorize.", reference: "João 14:27" },
  { text: "E a paz de Deus, que excede todo o entendimento, guardará os vossos corações e os vossos pensamentos, em Cristo Jesus.", reference: "Filipenses 4:7" },
  { text: "Sede todos de um mesmo sentimento, compassivos, amando os irmãos, entranhavelmente misericordiosos, afáveis.", reference: "1 Pedro 3:8" },
  { text: "Pondes em prática o que aprendestes, e recebestes, e ouvistes, e vistes em mim, e o Deus de paz será convosco.", reference: "Filipenses 4:9" },
  { text: "O Senhor dará força ao seu povo; o Senhor abençoará o seu povo com paz.", reference: "Salmos 29:11" },
  { text: "Em paz me deitarei e logo pego no sono, porque só tu, Senhor, me fazes habitar em segurança.", reference: "Salmos 4:8" },
  { text: "O Senhor é justo em todos os seus caminhos, e benigno em todas as suas obras.", reference: "Salmos 145:17" },
  { text: "O Senhor é bom para todos, e as suas misericórdias são sobre todas as suas obras.", reference: "Salmos 145:9" },
  { text: "Grande é o nosso Senhor, e mui poderoso; o seu entendimento não se pode medir.", reference: "Salmos 147:5" },
  { text: "O Senhor ampara aos que caem, e levanta aos abatidos.", reference: "Salmos 145:14" },
  { text: "Os olhos de todos esperam em ti, e tu lhes dás o seu mantimento a seu tempo.", reference: "Salmos 145:15" },
  { text: "Perto está o Senhor de todos os que o invocam, de todos os que o invocam de verdade.", reference: "Salmos 145:18" },
  { text: "Ele cumpre o desejo dos que o temem; ouve o seu clamor, e os salva.", reference: "Salmos 145:19" },
  { text: "O Senhor guarda a todos os que o amam, mas todos os ímpios ele destruirá.", reference: "Salmos 145:20" },
  { text: "A minha boca falará o louvor do Senhor; e toda a carne louve o seu santo nome para sempre.", reference: "Salmos 145:21" },
  { text: "Irmãos, eu mesmo não julgo ter já alcançado; mas uma coisa faço, esquecendo-me das coisas que atrás ficaram.", reference: "Filipenses 3:13" },
  { text: "Prossigo para o alvo, pelo prêmio da soberana vocação de Deus em Cristo Jesus.", reference: "Filipenses 3:14" },
  { text: "Todavia fizeste bem, participando da minha tribulação.", reference: "Filipenses 4:14" },
  { text: "Ora, vós, filipenses, bem sabeis que no princípio do evangelho, quando parti da Macedônia, nenhuma igreja comunicou comigo.", reference: "Filipenses 4:15" },
  { text: "Pois mesmo em Tessalônica me mandastes uma e outra vez o que eu necessitava.", reference: "Filipenses 4:16" },
  { text: "Não que procure dádivas, mas procuro o fruto que aumente a vossa conta.", reference: "Filipenses 4:17" },
  { text: "Mas bastante tenho recebido, e tenho abundância; cheio estou, depois que recebi de Epafrodito o que da vossa parte me foi enviado.", reference: "Filipenses 4:18" },
  { text: "Ora, ao nosso Deus e Pai seja dada glória pelos séculos dos séculos. Amém.", reference: "Filipenses 4:20" },
  { text: "O Senhor é o meu pastor, nada me faltará. Deitar-me faz em verdes pastos, guia-me mansamente a águas tranquilas.", reference: "Salmos 23:1-2" },
  { text: "Refrigera a minha alma; guia-me pelas veredas da justiça, por amor do seu nome.", reference: "Salmos 23:3" },
  { text: "Adere a ti o bem e a benignidade todos os dias da minha vida; e habitarei na casa do Senhor por longos dias.", reference: "Salmos 23:6" },
  { text: "Quando os malvados, meus inimigos e meus adversários, avançaram contra mim para comerem as minhas carnes, tropeçaram e caíram.", reference: "Salmos 27:2" },
  { text: "Ainda que um exército me acampe, não terá medo o meu coração; e se estourar contra minha guerra, ainda assim terei confiança.", reference: "Salmos 27:3" },
  { text: "Uma coisa peço ao Senhor, e a buscarei: que eu possa habitar na casa do Senhor todos os dias da minha vida.", reference: "Salmos 27:4" },
  { text: "Pois no dia da adversidade me esconderá no seu pavilhão; no oculto do seu tabernáculo me esconderá.", reference: "Salmos 27:5" },
  { text: "Agora será exaltada a minha cabeça acima dos meus inimigos que estão ao redor de mim; e no seu tabernáculo oferecerei sacrifício de júbilo.", reference: "Salmos 27:6" },
  { text: "Ouve, Senhor, a minha voz quando clamo; tem também misericórdia de mim, e responde-me.", reference: "Salmos 27:7" },
  { text: "Quando disseste: Buscai o meu rosto, o meu coração te disse: O teu rosto, Senhor, buscarei.", reference: "Salmos 27:8" },
  { text: "Não escondas de mim a tua face, não repulses com ira o teu servo; tu és a minha ajuda.", reference: "Salmos 27:9" },
  { text: "Porque me abandonaram meu pai e minha mãe, mas o Senhor me recolherá.", reference: "Salmos 27:10" },
  { text: "Ensina-me, Senhor, o teu caminho, e guia-me pela vereda direita, por causa dos que me observam.", reference: "Salmos 27:11" },
  { text: "Não me deixes à vontade dos meus adversários; pois se levantaram contra mim falsas testemunhas.", reference: "Salmos 27:12" },
  { text: "Prouvera eu não tivesse crido que havia de ver a bondade do Senhor na terra dos viventes.", reference: "Salmos 27:13" },
  { text: "A ti, Senhor, clamei; ao Senhor implorei misericórdia.", reference: "Salmos 30:8" },
  { text: "Que proveito haverá no meu sangue, se eu descer à cova? Poderá o pó te louvar? Poderá anunciar a tua verdade?", reference: "Salmos 30:9" },
  { text: "Ouve, Senhor, e tem piedade de mim; Senhor, sê o meu auxiliador.", reference: "Salmos 30:10" },
  { text: "Mudaste o meu pranto em dança; tiraste o meu cilício, e me cingiste de alegria.", reference: "Salmos 30:11" },
  { text: "Para que a minha alma te cante louvores, e não se cale. Senhor, Deus meu, para sempre te louvarei.", reference: "Salmos 30:12" },
  { text: "Bem-aventurado aquele cuja transgressão é perdoada, e o pecado é coberto.", reference: "Salmos 32:1" },
  { text: "Bem-aventurado o homem a quem o Senhor não atribui culpa, e em cujo espírito não há engano.", reference: "Salmos 32:2" },
  { text: "Enquanto eu calei, envelheceram os meus ossos pelo meu bramido todo o dia.", reference: "Salmos 32:3" },
  { text: "Porque de dia e de noite a tua mão se agravou sobre mim; o meu humor se tornou em sequidão de verão.", reference: "Salmos 32:4" },
  { text: "Confessei-te o meu pecado, e a minha injustiça não escondi; disse eu: Confessarei ao Senhor as minhas transgressões.", reference: "Salmos 32:5" },
  { text: "Por isso todo aquele que é santo orará a ti, a tempo de te poder encontrar; na verdade, na grande inundação das águas, a ele não chegarão.", reference: "Salmos 32:6" },
  { text: "Tu és o meu refúgio, me guardas da angústia; com cânticos de livramento me cercas.", reference: "Salmos 32:7" },
  { text: "O temor do Senhor é o princípio da sabedoria; e o conhecimento do Santo é entendimento.", reference: "Provérbios 9:10" },
  { text: "Sabei que o Senhor é Deus; foi ele quem nos fez, e não nós a nós mesmos; somos povo seu e ovelhas do seu pasto.", reference: "Salmos 100:3" },
  { text: "Porque o Senhor é bom, e a sua benignidade dura para sempre; e a sua verdade dura de geração em geração.", reference: "Salmos 100:5" },
  { text: "Fazei justiça ao fraco e ao órfão; procedei retamente com o aflito e o desvalido.", reference: "Salmos 82:3" },
  { text: "Livrai o fraco e o necessitado; tirai-os das mãos dos ímpios.", reference: "Salmos 82:4" },
  { text: "Eles nada sabem, nem entendem; andam às escuras; vacilam todos os fundamentos da terra.", reference: "Salmos 82:5" },
  { text: "Eu disse: Vós sois deuses, e todos vós filhos do Altíssimo.", reference: "Salmos 82:6" },
  { text: "Mas, como homens, morrereis, e como qualquer dos príncipes, caireis.", reference: "Salmos 82:7" },
  { text: "Levanta-te, ó Deus, julga a terra; pois tu possuis todas as nações.", reference: "Salmos 82:8" },
  { text: "Ó Deus, não estejas em silêncio; não te cales, nem fiques imóvel, ó Deus.", reference: "Salmos 83:1" },
  { text: "Pois eis que os teus inimigos se alvoroçam, e os que te odeiam levantam a cabeça.", reference: "Salmos 83:2" },
  { text: "Traçam astutas maquinações contra o teu povo, e conspiram contra os teus escondidos.", reference: "Salmos 83:3" },
  { text: "Disseram: Vinde, e destruíamo-los, para que não sejam nação, nem seja lembrado mais o nome de Israel.", reference: "Salmos 83:4" },
  { text: "Porque consultaram juntos de coração, e contra ti fizeram aliança.", reference: "Salmos 83:5" },
  { text: "As tendas de Edom e dos ismaelitas, Moabe e os hagarenos.", reference: "Salmos 83:6" },
  { text: "Gebal, e Amom, e Amaleque, a Filístia com os habitantes de Tiro.", reference: "Salmos 83:7" },
  { text: "Também a Assíria se ligou a eles; foram eles o braço das crianças de Ló.", reference: "Salmos 83:8" },
  { text: "Faze-lhes como a Midiã, como a Sisera, como a Jabim na ribeira de Quisom.", reference: "Salmos 83:9" },
  { text: "Os quais pereceram em Endor; tornaram-se como esterco sobre a terra.", reference: "Salmos 83:10" },
  { text: "Faze aos seus nobres como a Orebe e como a Zeebe; e a todos os seus príncipes como a Zebá e como a Zalmuna.", reference: "Salmos 83:11" },
  { text: "Que disseram: Tomemos para nós as habitações de Deus.", reference: "Salmos 83:12" },
  { text: "Deus meu, faze-os como um redemoinho, como a folha arrebatada do vento.", reference: "Salmos 83:13" },
  { text: "Como o fogo que abrasa o bosque, e como a chama que incendeia as montanhas.", reference: "Salmos 83:14" },
  { text: "Assim persegue-os com a tua tempestade, e os assombra com o teu furacão.", reference: "Salmos 83:15" },
  { text: "Enche-lhes o rosto de vergonha, para que busquem o teu nome, Senhor.", reference: "Salmos 83:16" },
  { text: "Envergonhem-se e perturbem-se perpetuamente; confundam-se, e pereçam.", reference: "Salmos 83:17" },
  { text: "Para que saibam que só tu, cujo nome é Senhor, és o Altíssimo sobre toda a terra.", reference: "Salmos 83:18" },
  { text: "Quão amáveis são os teus tabernáculos, Senhor dos Exércitos!", reference: "Salmos 84:1" },
  { text: "A minha alma desfalece e anela pelos átrios do Senhor; o meu coração e a minha carne clamam pelo Deus vivo.", reference: "Salmos 84:2" },
  { text: "Se confessarmos os nossos pecados, ele é fiel e justo para nos perdoar os pecados, e nos purificar de toda a injustiça.", reference: "1 João 1:9" },
  { text: "Aquele que encobre as suas transgressões não prosperará, mas o que as confessa e deixa, alcançará misericórdia.", reference: "Provérbios 28:13" },
  { text: "Pois eu reconheço as minhas transgressões, e o meu pecado está sempre diante de mim.", reference: "Salmos 51:3" },
  { text: "Peco contra ti, contra ti somente pequei, e fiz o que é mau perante os teus olhos.", reference: "Salmos 51:4" },
  { text: "Não me repulses da tua presença, e não retires de mim o teu santo Espírito.", reference: "Salmos 51:11" },
  { text: "Restitui-me a alegria da tua salvação, e sustenta-me com um espírito voluntário.", reference: "Salmos 51:12" },
  { text: "Então ensinarei aos transgressores os teus caminhos, e os pecadores se converterão a ti.", reference: "Salmos 51:13" },
  { text: "Livra-me dos crimes de sangue, ó Deus, Deus da minha salvação, e a minha língua cantará a tua justiça.", reference: "Salmos 51:14" },
  { text: "Senhor, abre os meus lábios, e a minha boca entoará o teu louvor.", reference: "Salmos 51:15" },
  { text: "Porque não desejas sacrifícios, senão eu os daria; tu não te deleitas em holocaustos.", reference: "Salmos 51:16" },
  { text: "Os sacrifícios para Deus são o espírito quebrantado; a um coração quebrantado e contrito não desprezarás, ó Deus.", reference: "Salmos 51:17" },
  { text: "Faze bem a Sião, segundo a tua boa vontade; edifica os muros de Jerusalém.", reference: "Salmos 51:18" },
  { text: "Então te agradarás dos sacrifícios de justiça, dos holocaustos e ofertas queimadas; então oferecerão novilhos sobre o teu altar.", reference: "Salmos 51:19" },
  { text: "Pois tu és o meu refúgio, uma torre de força contra o inimigo.", reference: "Salmos 61:3" },
  { text: "Eu habitaria no teu tabernáculo para sempre; abrigar-me-ia no esconderijo das tuas asas.", reference: "Salmos 61:4" },
  { text: "Pois tu, ó Deus, ouviste os meus votos; deste-me a herança dos que temem o teu nome.", reference: "Salmos 61:5" },
  { text: "Prolongarás os dias do rei; e os seus anos serão como muitas gerações.", reference: "Salmos 61:6" },
  { text: "Ele permanecerá diante de Deus para sempre; prepara misericórdia e verdade para o preservar.", reference: "Salmos 61:7" },
  { text: "Assim cantarei o teu nome para sempre, e todos os dias pagarei os meus votos.", reference: "Salmos 61:8" },
  { text: "Somente em Deus espera em silêncio a minha alma; dele vem a minha salvação.", reference: "Salmos 62:1" },
  { text: "Somente ele é a minha rocha e a minha salvação; é o meu refúgio, não serei grandemente abalado.", reference: "Salmos 62:2" },
  { text: "Até quando intentareis contra um homem, para o matareis a todos vós, como a uma parede pendida e uma sebe prestes a cair?", reference: "Salmos 62:3" },
  { text: "Eles somente consultam como o derrubarão da sua excelência; deleitam-se em mentiras; com a boca bendizem, mas no interior maldizem.", reference: "Salmos 62:4" },
  { text: "Ó minha alma, espera em silêncio somente em Deus; porque dele vem a minha esperança.", reference: "Salmos 62:5" },
  { text: "Somente ele é a minha rocha e a minha salvação; é o meu refúgio, não serei abalado.", reference: "Salmos 62:6" },
  { text: "Em Deus está a minha salvação e a minha glória; a rocha da minha fortaleza e o meu refúgio estão em Deus.", reference: "Salmos 62:7" },
  { text: "Confiai nele em todos os tempos, ó povos; derramai perante ele o vosso coração; Deus é o nosso refúgio.", reference: "Salmos 62:8" },
  { text: "Certamente que os homens de classe baixa são vaidade, e os homens de alta posição são mentira; pesados em balanças, subirão eles todos mais leves que a vaidade.", reference: "Salmos 62:9" },
  { text: "Como um pai se compadece de seus filhos, assim o Senhor se compadece daqueles que o temem.", reference: "Salmos 103:13" },
  { text: "Porque ele conhece a nossa estrutura; lembra-se de que somos pó.", reference: "Salmos 103:14" },
  { text: "Quanto ao homem, os seus dias são como a erva; como a flor do campo, assim ele floresce.", reference: "Salmos 103:15" },
  { text: "Pois passa o vento por ela, e ela perece, e o seu lugar não conhece mais.", reference: "Salmos 103:16" },
  { text: "Mas a benignidade do Senhor é de eternidade a eternidade sobre aqueles que o temem, e a sua justiça sobre os filhos dos filhos.", reference: "Salmos 103:17" },
  { text: "Sobre aqueles que guardam o seu pacto, e lembram dos seus preceitos para os cumprir.", reference: "Salmos 103:18" },
  { text: "O Senhor estabeleceu o seu trono nos céus, e o seu reino domina sobre tudo.", reference: "Salmos 103:19" },
  { text: "Bendizei ao Senhor, vós anjos seus, poderosos em fortaleza, que cumpris as suas ordens.", reference: "Salmos 103:20" },
  { text: "Bendizei ao Senhor, todos os seus exércitos, vós ministros seus, que cumpris a sua vontade.", reference: "Salmos 103:21" },
  { text: "Bendizei ao Senhor, todas as suas obras, em todos os lugares do seu domínio.", reference: "Salmos 103:22" },
  { text: "É ele quem perdoa todas as tuas iniquidades, quem sara todas as tuas enfermidades.", reference: "Salmos 103:3" },
  { text: "Quem rescata da cova a tua vida, quem te coroa de benignidade e misericórdia.", reference: "Salmos 103:4" },
  { text: "Quem satisfaz a tua boca de bens; a tua juventude se renova como a da águia.", reference: "Salmos 103:5" },
  { text: "O Senhor executa justiça e juízo a favor de todos os oprimidos.", reference: "Salmos 103:6" },
  { text: "Fez notórios os seus caminhos a Moisés, e os seus feitos aos filhos de Israel.", reference: "Salmos 103:7" },
  { text: "O Senhor é misericordioso e piedoso, longânimo e grande em benignidade.", reference: "Salmos 103:8" },
  { text: "Não repreenderá perpetuamente, nem para sempre conservará a sua ira.", reference: "Salmos 103:9" },
  { text: "Não nos tratou segundo os nossos pecados, nem nos retribuiu segundo as nossas iniquidades.", reference: "Salmos 103:10" },
  { text: "Porque assim como os céus são altos acima da terra, assim é grande a sua benignidade para com aqueles que o temem.", reference: "Salmos 103:11" },
  { text: "Assim como o oriente está longe do ocidente, assim afasta de nós as nossas transgressões.", reference: "Salmos 103:12" },
  { text: "Fiel é Deus, pelo qual fostes chamados para a comunhão do seu Filho Jesus Cristo nosso Senhor.", reference: "1 Coríntios 1:9" },
  { text: "O Senhor é fiel em todas as suas palavras, e santo em todas as suas obras.", reference: "Salmos 145:13" },
  { text: "Porque o Senhor Deus é sol e escudo; o Senhor dará graça e glória; não retirará bem algum aos que andam na retidão.", reference: "Salmos 84:11" },
  { text: "O Senhor dos Exércitos é bendito o homem que confia em ti.", reference: "Salmos 84:12" },
  { text: "Senhor Deus dos Exércitos, ouve a minha oração; inclina os ouvidos, ó Deus de Jacó.", reference: "Salmos 84:8" },
  { text: "Olha, ó Deus, escudo nosso, e vê o rosto do teu ungido.", reference: "Salmos 84:9" },
  { text: "Porque vale mais um dia nos teus átrios do que mil. Preferiria estar à porta da casa do meu Deus, a habitar nas tendas de impiedade.", reference: "Salmos 84:10" },
  { text: "Eu te instruirei, e te ensinarei o caminho que deves seguir; sobre ti fixarei os meus olhos.", reference: "Salmos 32:8" },
  { text: "Não sejais como o cavalo nem como a mula, que não têm entendimento, cuja boca precisa de cabresto e freio.", reference: "Salmos 32:9" },
  { text: "Muitas são as dores do ímpio, mas àquele que confia no Senhor, a benignidade o cercará.", reference: "Salmos 32:10" },
  { text: "Direi do Senhor: Ele é o meu Deus, o meu refúgio, a minha fortaleza; nele confiarei.", reference: "Salmos 91:2" },
  { text: "Porque ele te livrará do laço do passarinheiro, e da peste perniciosa.", reference: "Salmos 91:3" },
  { text: "Ele te cobrirá com as suas penas, e debaixo das suas asas te confiarás; a sua verdade será o teu escudo e broquel.", reference: "Salmos 91:4" },
  { text: "Não temerás os terrores da noite, nem a seta que voe de dia.", reference: "Salmos 91:5" },
  { text: "Peste que ande na escuridão, nem mortandade que assole ao meio-dia.", reference: "Salmos 91:6" },
  { text: "Mil cairão ao teu lado, e dez mil à tua direita; mas tu não serás atingido.", reference: "Salmos 91:7" },
  { text: "Somente com os teus olhos contemplarás, e verás a recompensa dos ímpios.", reference: "Salmos 91:8" },
  { text: "Porquanto tu, ó Senhor, és o meu refúgio. Fizeste do Altíssimo a tua habitação.", reference: "Salmos 91:9" },
  { text: "Nenhum mal te sucederá, nem praga alguma chegará à tua tenda.", reference: "Salmos 91:10" },
  { text: "Porque aos seus anjos dará ordem a teu respeito, para te guardarem em todos os teus caminhos.", reference: "Salmos 91:11" },
  { text: "Eles te sustentarão nas suas mãos, para não tropeçares em alguma pedra.", reference: "Salmos 91:12" },
  { text: "Pisarás sobre o leão e a víbora; calcarás aos pés o filho do leão e a serpente.", reference: "Salmos 91:13" },
  { text: "Porquanto tão encarecidamente me amou, também eu o livrarei; pô-lo-ei em retiro alto, porque conhece o meu nome.", reference: "Salmos 91:14" },
  { text: "Ele me invocará, e eu lhe responderei; estarei com ele na angústia; livrá-lo-ei, e o glorificarei.", reference: "Salmos 91:15" },
  { text: "Fartá-lo-ei com longura de dias, e lhe mostrarei a minha salvação.", reference: "Salmos 91:16" },
  { text: "É bom render graças ao Senhor, e cantar louvores ao teu nome, ó Altíssimo.", reference: "Salmos 92:1" },
  { text: "Anunciar de manhã a tua benignidade, e à noite a tua fidelidade.", reference: "Salmos 92:2" },
  { text: "Sobre um instrumento de dez cordas, e sobre o saltério; sobre a harpa com som solene.", reference: "Salmos 92:3" },
  { text: "Pois tu, Senhor, me alegraste pelos teus feitos; exultarei nas obras das tuas mãos.", reference: "Salmos 92:4" },
  { text: "Quão grandes, Senhor, são as tuas obras! Mui profundos são os teus pensamentos.", reference: "Salmos 92:5" },
  { text: "O homem brutal não conhece, nem o insensato entende isso.", reference: "Salmos 92:6" },
  { text: "Quando os ímpios brotam como a erva, e florescem todos os que praticam a iniquidade, é para serem destruídos para sempre.", reference: "Salmos 92:7" },
  { text: "Mas tu, Senhor, és excelso para sempre.", reference: "Salmos 92:8" },
  { text: "Pois eis que os teus inimigos, Senhor, eis que os teus inimigos perecerão; serão dispersos todos os que praticam a iniquidade.", reference: "Salmos 92:9" },
  { text: "Mas tu exaltarás o meu poder, como o do boi selvagem; serei ungido com óleo fresco.", reference: "Salmos 92:10" },
  { text: "E os meus olhos verão o meu desejo sobre os meus inimigos, e os meus ouvidos ouvirão o meu desejo sobre os malvados.", reference: "Salmos 92:11" },
  { text: "O justo florescerá como a palmeira; crescerá como o cedro do Líbano.", reference: "Salmos 92:12" },
  { text: "Plantados na casa do Senhor, florescerão nos átrios do nosso Deus.", reference: "Salmos 92:13" },
  { text: "Na velhice ainda darão fruto; serão viçosos e florescentes.", reference: "Salmos 92:14" },
  { text: "Para anunciar que o Senhor é reto; ele é a minha rocha, e nele não há injustiça.", reference: "Salmos 92:15" },
  { text: "O Senhor reina; está vestido de majestade; o Senhor se revestiu, cingiu-se de fortaleza.", reference: "Salmos 93:1" },
  { text: "O teu trono está firme desde então; tu és eterno.", reference: "Salmos 93:2" },
  { text: "Os rios levantaram, ó Senhor, os rios levantaram o seu ruído; os rios levantam o seu fragor.", reference: "Salmos 93:3" },
  { text: "Mais poderoso que o ruído das grandes águas, mais poderoso que as vagas do mar, poderoso é o Senhor nas alturas.", reference: "Salmos 93:4" },
  { text: "Mui fiéis são os teus testemunhos; a santidade convém à tua casa, Senhor, para sempre.", reference: "Salmos 93:5" },
  { text: "Senhor Deus, a quem a vingança pertence, ó Deus, a quem a vingança pertence, manifesta-te.", reference: "Salmos 94:1" },
  { text: "Exalta-te, tu, que és juiz da terra; dá aos soberbos a retribuição que merecem.", reference: "Salmos 94:2" },
  { text: "Senhor, até quando os ímpios, até quando exultarão os ímpios?", reference: "Salmos 94:3" },
  { text: "Até quando proferirão, e falarão coisas duras, e se gloriarão todos os que praticam a iniquidade?", reference: "Salmos 94:4" },
  { text: "Esmagam o teu povo, Senhor, e afligem a tua herança.", reference: "Salmos 94:5" },
  { text: "Matam a viúva e o estrangeiro, e ao órfão tiram a vida.", reference: "Salmos 94:6" },
  { text: "E dizem: O Senhor não o vê, nem o Deus de Jacó o percebe.", reference: "Salmos 94:7" },
  { text: "Entendei, ó brutais dentre o povo; e vós, insensatos, quando sereis sábios?", reference: "Salmos 94:8" },
  { text: "Aquele que fez o ouvido, não ouvirá? E aquele que formou o olho, não verá?", reference: "Salmos 94:9" },
  { text: "Aquele que instrui as nações, não castigará? E aquele que ensina ao homem o conhecimento?", reference: "Salmos 94:10" },
  { text: "O Senhor conhece os pensamentos do homem, que são vaidade.", reference: "Salmos 94:11" },
  { text: "Bem-aventurado o homem a quem tu, Senhor, castigas, e a quem ensinas a tua lei.", reference: "Salmos 94:12" },
  { text: "Para o fazeres descansar nos dias da adversidade, até que se abra a cova para o ímpio.", reference: "Salmos 94:13" },
  { text: "Porque o Senhor não rejeitará o seu povo, nem desamparará a sua herança.", reference: "Salmos 94:14" },
  { text: "Mas o juízo voltará a ser justo, e segui-lo-ão todos os retos de coração.", reference: "Salmos 94:15" },
  { text: "Quem se levantará por mim contra os malvados? Quem se porá ao meu lado contra os que praticam a iniquidade?", reference: "Salmos 94:16" },
  { text: "Se o Senhor não fora em minha ajuda, a minha alma quase que teria ficado no silêncio.", reference: "Salmos 94:17" },
  { text: "Quando eu disse: O meu pé vacila; a tua benignidade, Senhor, me susteve.", reference: "Salmos 94:18" },
  { text: "Na multidão dos meus pensamentos dentro de mim, as tuas consolações recrearam a minha alma.", reference: "Salmos 94:19" },
  { text: "Porventura o trono de iniqüidade te acompanha, o qual forja o mal por uma lei?", reference: "Salmos 94:20" },
  { text: "Eles se ajuntam contra a alma do justo, e condenam o sangue inocente.", reference: "Salmos 94:21" },
  { text: "Mas o Senhor é a minha defesa, e o meu Deus é a rocha do meu refúgio.", reference: "Salmos 94:22" },
  { text: "E trará sobre eles a sua própria iniquidade, e os destruirá na sua própria malícia; o Senhor nosso Deus os destruirá.", reference: "Salmos 94:23" },
  { text: "Cheguemos diante da sua presença com ações de graças, e alegremo-nos com cânticos de louvor.", reference: "Salmos 95:2" },
  { text: "Anunciai entre as nações a sua glória, entre todos os povos as suas maravilhas.", reference: "1 Crônicas 16:24" },
  { text: "Porque grande é o Senhor, e mui digno de louvor, mais temível do que todos os deuses.", reference: "1 Crônicas 16:25" },
  { text: "Porque todos os deuses dos povos são ídolos, mas o Senhor fez os céus.", reference: "1 Crônicas 16:26" },
  { text: "Louvor e majestade estão diante dele, força e alegria no seu lugar.", reference: "1 Crônicas 16:27" },
  { text: "Tributai ao Senhor, ó famílias dos povos, tributai ao Senhor glória e força.", reference: "1 Crônicas 16:28" },
  { text: "Tributai ao Senhor a glória devida ao seu nome; trazei presentes, e vinde perante ele; adorai ao Senhor na beleza da santidade.", reference: "1 Crônicas 16:29" },
  { text: "Trema diante dele toda a terra; o mundo também está firme, e não se abalará.", reference: "1 Crônicas 16:30" },
  { text: "Alegrem-se os céus, e exulte a terra; e diga-se entre as nações: O Senhor reina.", reference: "1 Crônicas 16:31" },
  { text: "Brame o mar e a sua plenitude; exulte o campo e tudo o que nele há.", reference: "1 Crônicas 16:32" },
  { text: "Então jubilarão todas as árvores do bosque perante o Senhor; porque vem julgar a terra.", reference: "1 Crônicas 16:33" },
  { text: "Louvai ao Senhor, porque é bom; porque a sua benignidade dura para sempre.", reference: "1 Crônicas 16:34" },
  { text: "Bendito seja o Senhor Deus de Israel, de eternidade a eternidade. E todo o povo disse: Amém! E louvou ao Senhor.", reference: "1 Crônicas 16:36" },
  { text: "Por isso não temeremos, ainda que a terra se mude, e ainda que os montes se abalem no coração dos mares.", reference: "Salmos 46:2" },
  { text: "Ainda que as águas tumultuem e espumejem, e na sua fúria os montes se estremecam.", reference: "Salmos 46:3" },
  { text: "Há um rio cujas correntes alegram a cidade de Deus, o santo lugar dos tabernáculos do Altíssimo.", reference: "Salmos 46:4" },
  { text: "Deus está no meio dela; não se abalará; Deus a ajudará ao romper da manhã.", reference: "Salmos 46:5" },
  { text: "Os gentios se tumultuaram, os reinos se moveram; ele levantou a sua voz, e a terra se derreteu.", reference: "Salmos 46:6" },
  { text: "O Senhor dos Exércitos está conosco; o Deus de Jacó é o nosso refúgio.", reference: "Salmos 46:7" },
  { text: "Vinde, contemplai as obras do Senhor; que assolações tem feito na terra.", reference: "Salmos 46:8" },
  { text: "Ele faz cessar as guerras até o fim da terra; quebra o arco e corta a lança; queima os carros no fogo.", reference: "Salmos 46:9" },
  { text: "Aquietai-vos, e sabei que eu sou Deus; serei exaltado entre os gentios, serei exaltado na terra.", reference: "Salmos 46:10" },
  { text: "O Senhor dos Exércitos está conosco; o Deus de Jacó é o nosso refúgio.", reference: "Salmos 46:11" },
  { text: "Formoso de sítio, e alegria de toda a terra, é o monte Sião sobre os lados do norte, a cidade do grande Rei.", reference: "Salmos 48:2" },
  { text: "Deus é conhecido nos seus palácios por um alto refúgio.", reference: "Salmos 48:3" },
  { text: "Porque eis que os reis se ajuntaram; eles passaram juntos.", reference: "Salmos 48:4" },
  { text: "Viram-no, e ficaram maravilhados; ficaram assombrados, e se apressaram em fugir.", reference: "Salmos 48:5" },
  { text: "Ali pasmo lhes tomou, e dor como de parturiente.", reference: "Salmos 48:6" },
  { text: "Tu quebras com um vento oriental os navios de Társis.", reference: "Salmos 48:7" },
  { text: "Como temos ouvido, assim vimos na cidade do Senhor dos Exércitos, na cidade do nosso Deus; Deus a firmará para sempre.", reference: "Salmos 48:8" },
  { text: "Lembramos, ó Deus, a tua benignidade no meio do teu templo.", reference: "Salmos 48:9" },
  { text: "Segundo o teu nome, ó Deus, assim é o teu louvor até aos confins da terra; a tua destra está cheia de justiça.", reference: "Salmos 48:10" },
  { text: "Alegre-se o monte Sião; e folguem as filhas de Judá por causa dos teus juízos.", reference: "Salmos 48:11" },
  { text: "Rodeai Sião, e cercai-a; contai as suas torres.", reference: "Salmos 48:12" },
  { text: "Marcai bem os seus antemuros, considerai os seus palácios, para que o conteis às gerações seguintes.", reference: "Salmos 48:13" },
  { text: "Porque este Deus é Deus nosso eternamente e para sempre; ele nos guiará até a morte.", reference: "Salmos 48:14" },
  { text: "Ouve isto, vós todos os povos; dai ouvidos, vós todos os habitantes do mundo.", reference: "Salmos 49:1" },
  { text: "Tanto filhos de homens plebeus como de gente ilustre, ricos e pobres todos juntos.", reference: "Salmos 49:2" },
  { text: "A minha boca falará sabedoria; e a meditação do meu coração será de entendimento.", reference: "Salmos 49:3" },
  { text: "Inclinarei os meus ouvidos a uma parábola; declararei o meu enigma sobre a harpa.", reference: "Salmos 49:4" },
  { text: "Por que temerei nos dias maus, quando me cercar a iniquidade dos meus perseguidores?", reference: "Salmos 49:5" },
  { text: "Aqueles que confiam nas suas posses, e se gloriam na multidão das suas riquezas.", reference: "Salmos 49:6" },
  { text: "Nenhum deles pode de modo algum redimir o irmão, nem dar a Deus o preço da sua redenção.", reference: "Salmos 49:7" },
  { text: "Porque a redenção da sua vida é caríssima, e nunca será ela suficiente.", reference: "Salmos 49:8" },
  { text: "Para que vivesse para sempre, e nunca mais visse a cova.", reference: "Salmos 49:9" },
  { text: "Bem-aventurado o homem que não anda segundo o conselho dos ímpios, nem se detém no caminho dos pecadores, nem se assenta na roda dos escarnecedores.", reference: "Salmos 1:1" },
  { text: "O temor do Senhor é o princípio do conhecimento; os loucos desprezam a sabedoria e a instrução.", reference: "Provérbios 1:7" },
  { text: "Quando passares pelas águas estarei contigo, e quando pelos rios, eles não te submergirão; quando passares pelo fogo, não te queimarás, nem a chama arderá em ti.", reference: "Isaías 43:2" },
  { text: "Ensinando-os a guardar todas as coisas que eu vos tenho mandado; e eis que eu estou convosco todos os dias, até a consumação dos séculos. Amém.", reference: "Mateus 28:20" },
  { text: "E não sede conformados com este mundo, mas sede transformados pela renovação do vosso entendimento, para que experimenteis qual seja a boa, agradável, e perfeita vontade de Deus.", reference: "Romanos 12:2" },
  { text: "Assim que, se alguém está em Cristo, nova criatura é; as coisas velhas já passaram; eis que tudo se fez novo.", reference: "2 Coríntios 5:17" },
  { text: "E não nos cansemos de fazer bem, porque a seu tempo ceifaremos, se não houvermos desfalecido.", reference: "Gálatas 6:9" },
  { text: "No demais, irmãos meus, fortalecei-vos no Senhor e na força do seu poder.", reference: "Efésios 6:10" },
  { text: "Tendo por certo isto mesmo, que aquele que em vós começou a boa obra a aperfeiçoará até ao dia de Jesus Cristo;", reference: "Filipenses 1:6" },
  { text: "E tudo quanto fizerdes, fazei-o de todo o coração, como ao Senhor, e não aos homens,", reference: "Colossenses 3:23" },
  { text: "Lançando sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós.", reference: "1 Pedro 5:7" },
  { text: "Nós o amamos a ele porque ele nos amou primeiro.", reference: "1 João 4:19" },
  { text: "E Deus limpará de seus olhos toda a lágrima; e não haverá mais morte, nem pranto, nem clamor, nem dor; porque já as primeiras coisas são passadas.", reference: "Apocalipse 21:4" },
  { text: "Levantarei os meus olhos para os montes, de onde vem o meu socorro.", reference: "Salmos 121:1" },
  { text: "O meu socorro vem do Senhor que fez o céu e a terra.", reference: "Salmos 121:2" },
  { text: "Confia ao Senhor as tuas obras, e teus pensamentos serão estabelecidos.", reference: "Provérbios 16:3" },
  { text: "Provai, e vede que o Senhor é bom; bem-aventurado o homem que nele confia.", reference: "Salmos 34:8" },
  { text: "Tu conservarás em paz aquele cuja mente está firme em ti; porque ele confia em ti.", reference: "Isaías 26:3" },
  { text: "Assim resplandeça a vossa luz diante dos homens, para que vejam as vossas boas obras e glorifiquem a vosso Pai, que está nos céus.", reference: "Mateus 5:16" },
  { text: "Falou-lhes, pois, Jesus outra vez, dizendo: Eu sou a luz do mundo; quem me segue não andará em trevas, mas terá a luz da vida.", reference: "João 8:12" },
  { text: "Mas recebereis a virtude do Espírito Santo, que há de vir sobre vós; e ser-me-eis testemunhas, tanto em Jerusalém como em toda a Judéia e Samaria, e até aos confins da terra.", reference: "Atos 1:8" },
  { text: "Ora o Deus de esperança vos encha de todo o gozo e paz em crença, para que abundeis em esperança pela virtude do Espírito Santo.", reference: "Romanos 15:13" },
  { text: "Regozijai-vos sempre.", reference: "1 Tessalonicenses 5:16" },
  { text: "E, se algum de vós tem falta de sabedoria, peça-a a Deus, que a todos dá liberalmente, e o não lança em rosto, e ser-lhe-á dada.", reference: "Tiago 1:5" },
  { text: "Porque a palavra de Deus é viva e eficaz, e mais penetrante do que espada alguma de dois gumes, e penetra até à divisão da alma e do espírito, e das juntas e medulas, e é apta para discernir os pensamentos e intenções do coração.", reference: "Hebreus 4:12" },
  { text: "Porque Deus não nos deu o espírito de temor, mas de fortaleza, e de amor, e de moderação.", reference: "2 Timóteo 1:7" },
  { text: "Os céus declaram a glória de Deus e o firmamento anuncia a obra das suas mãos.", reference: "Salmos 19:1" },
  { text: "Torre forte é o nome do Senhor; a ela correrá o justo, e estará em alto refúgio.", reference: "Provérbios 18:10" },
  { text: "Disse-lhe Jesus: Eu sou a ressurreição e a vida; quem crê em mim, ainda que esteja morto, viverá;", reference: "João 11:25" },
  { text: "Mas ele foi ferido por causa das nossas transgressões, e moído por causa das nossas iniqüidades; o castigo que nos traz a paz estava sobre ele, e pelas suas pisaduras fomos sarados.", reference: "Isaías 53:5" },
  { text: "Antes tem o seu prazer na lei do Senhor, e na sua lei medita de dia e de noite.", reference: "Salmos 1:2" },
  { text: "Pois será como a árvore plantada junto a ribeiros de águas, a qual dá o seu fruto no seu tempo; as suas folhas não cairão, e tudo quanto fizer prosperará.", reference: "Salmos 1:3" },
  { text: "Não são assim os ímpios; mas são como a moinha que o vento espalha.", reference: "Salmos 1:4" },
  { text: "Por isso os ímpios não subsistirão no juízo, nem os pecadores na congregação dos justos.", reference: "Salmos 1:5" },
  { text: "Porque o Senhor conhece o caminho dos justos; porém o caminho dos ímpios perecerá.", reference: "Salmos 1:6" },
  { text: "Por que se amotinam os gentios, e os povos imaginam coisas vàs?", reference: "Salmos 2:1" },
  { text: "Os reis da terra se levantam e os governos consultam juntamente contra o Senhor e contra o seu ungido, dizendo:", reference: "Salmos 2:2" },
  { text: "Rompamos as suas ataduras, e sacudamos de nós as suas cordas.", reference: "Salmos 2:3" },
  { text: "Aquele que habita nos céus se rirá; o Senhor zombará deles.", reference: "Salmos 2:4" },
];

// Parse a reference like "Jeremias 29:11" into navigation data
export const parseReference = async (reference: string): Promise<{ bookAbbrev: string; chapter: number; verse: number } | null> => {
  const bible = await fetchBibleData();
  // Match "BookName Chapter:Verse" or "BookName Chapter:Verse-Verse"
  const match = reference.match(/^(.+?)\s+(\d+):(\d+)/);
  if (!match) return null;
  
  const [, bookName, chapterStr, verseStr] = match;
  const normalizedName = bookName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  const book = bible.find(b => {
    const bn = b.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return bn === normalizedName || bn.startsWith(normalizedName) || normalizedName.startsWith(bn);
  });
  
  if (!book) return null;
  return { bookAbbrev: book.abbrev, chapter: parseInt(chapterStr), verse: parseInt(verseStr) };
};

// Get daily verse based on day of year (deterministic)
export const getDailyVerse = (): { text: string; reference: string } => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return DAILY_VERSES[dayOfYear % DAILY_VERSES.length];
};

// Get next chapter reference
export const getNextChapter = async (currentAbbrev: string, currentChapter: number): Promise<{ abbrev: string; chapter: number } | null> => {
  const bible = await fetchBibleData();
  const bookIndex = bible.findIndex(b => b.abbrev === currentAbbrev);
  
  if (bookIndex === -1) return null;
  
  const currentBook = bible[bookIndex];
  
  // Check if there's another chapter in the current book
  if (currentChapter < currentBook.chapters.length) {
    return { abbrev: currentAbbrev, chapter: currentChapter + 1 };
  }
  
  // Check if there's a next book
  if (bookIndex < bible.length - 1) {
    return { abbrev: bible[bookIndex + 1].abbrev, chapter: 1 };
  }
  
  return null;
};

// Get previous chapter reference
export const getPreviousChapter = async (currentAbbrev: string, currentChapter: number): Promise<{ abbrev: string; chapter: number } | null> => {
  const bible = await fetchBibleData();
  const bookIndex = bible.findIndex(b => b.abbrev === currentAbbrev);
  
  if (bookIndex === -1) return null;
  
  // Check if there's a previous chapter in the current book
  if (currentChapter > 1) {
    return { abbrev: currentAbbrev, chapter: currentChapter - 1 };
  }
  
  // Check if there's a previous book
  if (bookIndex > 0) {
    const previousBook = bible[bookIndex - 1];
    return { abbrev: previousBook.abbrev, chapter: previousBook.chapters.length };
  }
  
  return null;
};
