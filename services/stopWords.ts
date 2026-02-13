export const PORTUGUESE_STOP_WORDS = new Set([
  // ============================================================
  // 1. Articles
  // ============================================================
  "o", "a", "os", "as", "um", "uma", "uns", "umas",

  // ============================================================
  // 2. Prepositions
  // ============================================================
  "de", "em", "por", "para", "com", "sem", "sob", "sobre",
  "entre", "até", "após", "desde", "durante", "perante",
  "contra", "ante", "mediante", "conforme", "segundo",
  "exceto", "salvo", "afora", "fora", "senão",

  // ============================================================
  // 3. ALL contractions (preposition + article/pronoun)
  // ============================================================
  // de + articles
  "do", "da", "dos", "das",
  // em + articles
  "no", "na", "nos", "nas",
  // a + articles
  "ao", "à", "aos", "às",
  // por + articles
  "pelo", "pela", "pelos", "pelas",
  // em + um/uma
  "num", "numa", "nuns", "numas",
  // em + demonstratives (este/esse/aquele)
  "neste", "nesta", "nestes", "nestas",
  "nesse", "nessa", "nesses", "nessas",
  "naquele", "naquela", "naqueles", "naquelas", "naquilo",
  // de + demonstratives
  "deste", "desta", "destes", "destas",
  "desse", "dessa", "desses", "dessas",
  "daquele", "daquela", "daqueles", "daquelas", "daquilo",
  "disto", "disso",
  // em + isto/isso
  "nisto", "nisso",
  // de + ele/ela
  "dele", "dela", "deles", "delas",
  // em + ele/ela
  "nele", "nela", "neles", "nelas",
  // a + aquele/aquela/aquilo
  "àquele", "àquela", "àqueles", "àquelas", "àquilo",

  // ============================================================
  // 4. Conjunctions
  // ============================================================
  "e", "ou", "mas", "nem", "que", "se", "como", "quando",
  "porque", "pois", "porém", "contudo", "todavia", "entretanto",
  "logo", "portanto", "embora", "conquanto", "caso", "onde",
  "aonde", "donde", "enquanto", "senão", "porquanto", "conforme",
  "consoante", "quer", "ora", "já", "pra", "pro",

  // ============================================================
  // 5. Personal pronouns (all forms)
  // ============================================================
  // Subject
  "eu", "tu", "ele", "ela", "nós", "vós", "eles", "elas",
  // Object / reflexive
  "me", "te", "se", "lhe", "lhes",
  // Oblique tonic
  "mim", "ti", "si",
  // Prepositional forms
  "comigo", "contigo", "consigo", "conosco", "convosco",
  // Treatment
  "você", "vocês",
  // Clitic
  "nos", "vos",
  // Combined clitics
  "mo", "to", "lho",

  // ============================================================
  // 6. Possessive pronouns
  // ============================================================
  "meu", "minha", "meus", "minhas",
  "teu", "tua", "teus", "tuas",
  "seu", "sua", "seus", "suas",
  "nosso", "nossa", "nossos", "nossas",
  "vosso", "vossa", "vossos", "vossas",

  // ============================================================
  // 7. Demonstrative pronouns
  // ============================================================
  "este", "esta", "estes", "estas",
  "esse", "essa", "esses", "essas",
  "aquele", "aquela", "aqueles", "aquelas",
  "isto", "isso", "aquilo",

  // ============================================================
  // 8. Indefinite pronouns
  // ============================================================
  "todo", "toda", "todos", "todas", "tudo", "nada",
  "alguém", "ninguém", "algo", "cada",
  "qualquer", "quaisquer",
  "outro", "outra", "outros", "outras",
  "mesmo", "mesma", "mesmos", "mesmas",
  "certo", "certa", "certos", "certas",
  "algum", "alguma", "alguns", "algumas",
  "nenhum", "nenhuma", "nenhuns", "nenhumas",
  "ambos", "ambas",
  "tal", "tais",
  "demais", "outrem", "tanto", "tanta", "tantos", "tantas",
  "vários", "várias", "pouco", "pouca", "poucos", "poucas",
  "muito", "muita", "muitos", "muitas",

  // ============================================================
  // 9. Relative / Interrogative pronouns
  // ============================================================
  "quem", "cujo", "cuja", "cujos", "cujas",
  "qual", "quais",
  "quanto", "quanta", "quantos", "quantas",

  // ============================================================
  // 10. Adverbs
  // ============================================================
  "não", "mais", "muito", "também", "só", "ainda",
  "aqui", "ali", "lá", "aí", "cá",
  "onde", "sempre", "nunca", "jamais",
  "agora", "então", "assim", "bem", "mal",
  "depois", "antes", "hoje", "ontem", "amanhã",
  "logo", "talvez", "apenas", "somente",
  "bastante", "menos", "tão", "quase",
  "sim", "acima", "abaixo", "dentro", "fora",
  "perto", "longe", "além", "aquém",
  "meio", "meia", "já", "ainda",
  "deveras", "assaz", "demais", "inclusive",
  "realmente", "certamente", "possivelmente",
  "provavelmente", "exatamente", "justamente",
  "principalmente", "especialmente", "sobretudo",
  "aproximadamente", "praticamente",
  "depressa", "devagar", "adiante", "diante",
  "atrás", "detrás", "tampouco", "sequer",
  "porventura", "decerto", "entretanto",
  "outrossim", "alhures", "algures",

  // ============================================================
  // 11. ALL conjugations of SER
  // ============================================================
  "ser",
  // Gerund / Participle
  "sendo", "sido",
  // Present indicative
  "sou", "és", "é", "somos", "sois", "são",
  // Imperfect indicative
  "era", "eras", "éramos", "éreis", "eram",
  // Preterite indicative
  "fui", "foste", "foi", "fomos", "fostes", "foram",
  // Pluperfect indicative
  "fora", "foras", "fôramos", "fôreis",
  // Future indicative
  "serei", "serás", "será", "seremos", "sereis", "serão",
  // Conditional
  "seria", "serias", "seríamos", "seríeis", "seriam",
  // Present subjunctive
  "seja", "sejas", "sejamos", "sejais", "sejam",
  // Imperfect subjunctive
  "fosse", "fosses", "fôssemos", "fôsseis", "fossem",
  // Future subjunctive
  "for", "fores", "formos", "fordes", "forem",

  // ============================================================
  // 12. ALL conjugations of ESTAR
  // ============================================================
  "estar",
  // Gerund / Participle
  "estando", "estado",
  // Present indicative
  "estou", "estás", "está", "estamos", "estais", "estão",
  // Imperfect indicative
  "estava", "estavas", "estávamos", "estáveis", "estavam",
  // Preterite indicative
  "estive", "estiveste", "esteve", "estivemos", "estivestes", "estiveram",
  // Pluperfect indicative
  "estivera", "estiveras", "estivéramos",
  // Future indicative
  "estarei", "estarás", "estará", "estaremos", "estareis", "estarão",
  // Conditional
  "estaria", "estarias", "estaríamos", "estaríeis", "estariam",
  // Present subjunctive
  "esteja", "estejas", "estejamos", "estejais", "estejam",
  // Imperfect subjunctive
  "estivesse", "estivesses", "estivéssemos", "estivésseis", "estivessem",
  // Future subjunctive
  "estiver", "estiveres", "estivermos", "estiverdes", "estiverem",

  // ============================================================
  // 13. ALL conjugations of TER
  // ============================================================
  "ter",
  // Gerund / Participle
  "tendo", "tido",
  // Present indicative
  "tenho", "tens", "tem", "temos", "tendes", "têm",
  // Imperfect indicative
  "tinha", "tinhas", "tínhamos", "tínheis", "tinham",
  // Preterite indicative
  "tive", "tiveste", "teve", "tivemos", "tivestes", "tiveram",
  // Pluperfect indicative
  "tivera", "tiveras", "tivéramos",
  // Future indicative
  "terei", "terás", "terá", "teremos", "tereis", "terão",
  // Conditional
  "teria", "terias", "teríamos", "teríeis", "teriam",
  // Present subjunctive
  "tenha", "tenhas", "tenhamos", "tenhais", "tenham",
  // Imperfect subjunctive
  "tivesse", "tivesses", "tivéssemos", "tivésseis", "tivessem",
  // Future subjunctive
  "tiver", "tiveres", "tivermos", "tiverdes", "tiverem",

  // ============================================================
  // 14. ALL conjugations of HAVER
  // ============================================================
  "haver",
  // Gerund / Participle
  "havendo", "havido",
  // Present indicative
  "hei", "hás", "há", "havemos", "haveis", "hão",
  // Imperfect indicative
  "havia", "havias", "havíamos", "havíeis", "haviam",
  // Preterite indicative
  "houve", "houveste", "houvemos", "houvestes", "houveram",
  // Pluperfect indicative
  "houvera", "houveras", "houvéramos",
  // Future indicative
  "haverei", "haverás", "haverá", "haveremos", "havereis", "haverão",
  // Conditional
  "haveria", "haverias", "haveríamos", "haveríeis", "haveriam",
  // Present subjunctive
  "haja", "hajas", "hajamos", "hajais", "hajam",
  // Imperfect subjunctive
  "houvesse", "houvesses", "houvéssemos", "houvésseis", "houvessem",
  // Future subjunctive
  "houver", "houveres", "houvermos", "houverdes", "houverem",

  // ============================================================
  // 15. ALL conjugations of IR
  // ============================================================
  "ir",
  // Gerund / Participle
  "indo", "ido",
  // Present indicative
  "vou", "vais", "vai", "vamos", "ides", "vão",
  // Imperfect indicative
  "ia", "ias", "íamos", "íeis", "iam",
  // Preterite indicative (same as ser)
  // "fui", "foste", "foi", "fomos", "fostes", "foram" — already listed under SER
  // Future indicative
  "irei", "irás", "irá", "iremos", "ireis", "irão",
  // Conditional
  "iria", "irias", "iríamos", "iríeis", "iriam",
  // Present subjunctive
  "vá", "vás", "vade", "ide",
  // Imperfect subjunctive (same as ser: fosse, fossem — already listed)
  // Future subjunctive (same as ser: for, forem — already listed)

  // ============================================================
  // 16. Common verbs — FAZER
  // ============================================================
  "fazer",
  "fazendo", "feito",
  "faço", "fazes", "faz", "fazemos", "fazeis", "fazem",
  "fazia", "fazias", "fazíamos", "faziam",
  "fiz", "fizeste", "fez", "fizemos", "fizestes", "fizeram",
  "fizera", "fizéramos",
  "farei", "farás", "fará", "faremos", "fareis", "farão",
  "faria", "farias", "faríamos", "fariam",
  "faça", "faças", "façamos", "façam",
  "fizesse", "fizesses", "fizéssemos", "fizessem",
  "fizer", "fizeres", "fizermos", "fizerdes", "fizerem",

  // ============================================================
  // 16. Common verbs — DAR
  // ============================================================
  "dar",
  "dando", "dado",
  "dou", "dás", "dá", "damos", "dais", "dão",
  "dava", "davas", "dávamos", "davam",
  "dei", "deste", "deu", "demos", "destes", "deram",
  "dera", "déramos",
  "darei", "darás", "dará", "daremos", "darão",
  "daria", "darias", "daríamos", "dariam",
  "dê", "dês", "demos", "deem",
  "desse", "desses", "déssemos", "dessem",
  "der", "deres", "dermos", "derem",

  // ============================================================
  // 16. Common verbs — DIZER
  // ============================================================
  "dizer",
  "dizendo", "dito",
  "digo", "dizes", "diz", "dizemos", "dizeis", "dizem",
  "dizia", "dizias", "dizíamos", "diziam",
  "disse", "disseste", "dissemos", "dissestes", "disseram",
  "dissera", "disséramos",
  "direi", "dirás", "dirá", "diremos", "dirão",
  "diria", "dirias", "diríamos", "diriam",
  "diga", "digas", "digamos", "digam",
  "dissesse", "dissesses", "disséssemos", "dissessem",
  "disser", "disseres", "dissermos", "disserem",

  // ============================================================
  // 16. Common verbs — VER
  // ============================================================
  "ver",
  "vendo", "visto",
  "vejo", "vês", "vê", "vemos", "vedes", "veem",
  "via", "vias", "víamos", "viam",
  "vi", "viste", "viu", "vimos", "vistes", "viram",
  "vira", "víramos",
  "verei", "verás", "verá", "veremos", "verão",
  "veria", "verias", "veríamos", "veriam",
  "veja", "vejas", "vejamos", "vejam",
  "visse", "visses", "víssemos", "vissem",
  "vir", "vires", "virmos", "virem",

  // ============================================================
  // 16. Common verbs — VIR
  // ============================================================
  // "vir" already listed (overlap with ver future subjunctive)
  "vindo",
  "venho", "vens", "vem", "vimos", "vindes", "vêm",
  "vinha", "vinhas", "vínhamos", "vinham",
  "vim", "vieste", "veio", "viemos", "viestes", "vieram",
  "viera", "viéramos",
  "virei", "virás", "virá", "viremos", "virão",
  "viria", "virias", "viríamos", "viriam",
  "venha", "venhas", "venhamos", "venham",
  "viesse", "viesses", "viéssemos", "viessem",
  "vier", "vieres", "viermos", "vierem",

  // ============================================================
  // 16. Common verbs — SABER
  // ============================================================
  "saber",
  "sabendo", "sabido",
  "sei", "sabes", "sabe", "sabemos", "sabeis", "sabem",
  "sabia", "sabias", "sabíamos", "sabiam",
  "soube", "soubeste", "soubemos", "souberam",
  "soubera", "soubéramos",
  "saberei", "saberás", "saberá", "saberemos", "saberão",
  "saberia", "saberias", "saberíamos", "saberiam",
  "saiba", "saibas", "saibamos", "saibam",
  "soubesse", "soubesses", "soubéssemos", "soubessem",
  "souber", "souberes", "soubermos", "souberem",

  // ============================================================
  // 16. Common verbs — QUERER
  // ============================================================
  "querer",
  "querendo", "querido",
  "quero", "queres", "quer", "queremos", "quereis", "querem",
  "queria", "querias", "queríamos", "queriam",
  "quis", "quiseste", "quisemos", "quiseram",
  "quisera", "quiséramos",
  "quererei", "quererás", "quererá", "quereremos", "quererão",
  "quereria", "quererias", "quereríamos", "quereriam",
  "queira", "queiras", "queiramos", "queiram",
  "quisesse", "quisesses", "quiséssemos", "quisessem",
  "quiser", "quiseres", "quisermos", "quiserem",

  // ============================================================
  // 16. Common verbs — PODER
  // ============================================================
  "poder",
  "podendo", "podido",
  "posso", "podes", "pode", "podemos", "podeis", "podem",
  "podia", "podias", "podíamos", "podiam",
  "pude", "pudeste", "pôde", "pudemos", "puderam",
  "pudera", "pudéramos",
  "poderei", "poderás", "poderá", "poderemos", "poderão",
  "poderia", "poderias", "poderíamos", "poderiam",
  "possa", "possas", "possamos", "possam",
  "pudesse", "pudesses", "pudéssemos", "pudessem",
  "puder", "puderes", "pudermos", "puderem",

  // ============================================================
  // 16. Common verbs — DEVER
  // ============================================================
  "dever",
  "devendo", "devido",
  "devo", "deves", "deve", "devemos", "deveis", "devem",
  "devia", "devias", "devíamos", "deviam",
  "deveu", "devemos",
  "deverei", "deverás", "deverá", "deveremos", "deverão",
  "deveria", "deverias", "deveríamos", "deveriam",
  "deva", "devas", "devamos", "devam",
  "devesse", "devesses", "devêssemos", "devessem",
  "dever", "deveres", "devermos", "deverem",

  // ============================================================
  // 16. Common verbs — PÔR / COLOCAR
  // ============================================================
  "pôr",
  "pondo", "posto",
  "ponho", "pões", "põe", "pomos", "pondes", "põem",
  "punha", "punhas", "púnhamos", "punham",
  "pus", "puseste", "pôs", "pusemos", "puseram",
  "pusera", "puséramos",
  "porei", "porás", "porá", "poremos", "porão",
  "poria", "porias", "poríamos", "poriam",
  "ponha", "ponhas", "ponhamos", "ponham",
  "pusesse", "pusesses", "puséssemos", "pusessem",
  "puser", "puseres", "pusermos", "puserem",

  // ============================================================
  // 16. Common verbs — FICAR
  // ============================================================
  "ficar",
  "ficando", "ficado",
  "fico", "ficas", "fica", "ficamos", "ficam",
  "ficava", "ficavam",
  "fiquei", "ficou", "ficaram",
  "ficarei", "ficará", "ficaremos", "ficarão",
  "ficaria", "ficariam",
  "fique", "fiquem",

  // ============================================================
  // 16. Common verbs — TOMAR
  // ============================================================
  "tomar",
  "tomando", "tomado",
  "tomo", "tomas", "toma", "tomamos", "tomam",
  "tomava", "tomavam",
  "tomei", "tomou", "tomaram",
  "tomarei", "tomará", "tomarão",
  "tomaria", "tomariam",
  "tome", "tomem",

  // ============================================================
  // 17. Numbers
  // ============================================================
  "zero", "um", "dois", "duas", "três", "quatro", "cinco",
  "seis", "sete", "oito", "nove", "dez",
  "onze", "doze", "treze", "catorze", "quatorze", "quinze",
  "dezesseis", "dezessete", "dezoito", "dezenove",
  "vinte", "trinta", "quarenta", "cinquenta",
  "sessenta", "setenta", "oitenta", "noventa",
  "cem", "cento", "mil",
  "primeiro", "primeira", "segundo", "segunda",
  "terceiro", "terceira",

  // ============================================================
  // 18. Biblical function words (connectors, discourse markers)
  // ============================================================
  "disse", "dizendo", "dito",
  "eis", "ora", "outrossim",
  "pois", "porquanto", "porventura",
  "dera", "respondeu", "respondendo",
  "falou", "falando",
  "mandou", "mandando",
  "chamou", "chamando",
  "veio", "vindo",
  "tomou", "tomando",
  "levantou",
  "trouxe", "trazendo",
  "posto", "pondo",
  "dando", "dado",

  // ============================================================
  // 19. Additional function words and filler
  // ============================================================
  // Misc. connectors / particles
  "quer", "pra", "pro", "pros", "pras",
  "né", "lá", "cá", "dum", "duma", "duns", "dumas",
  "etc", "enfim", "afinal", "aliás", "ademais",
  "contanto", "porquê", "senão",
  "entanto", "meanwhile",

  // More adverbial expressions
  "tampouco", "sequer", "inclusive", "decerto",
  "realmente", "certamente", "simplesmente",
  "completamente", "totalmente", "parcialmente",
  "anteriormente", "posteriormente", "finalmente",
  "inicialmente", "atualmente", "eventualmente",
  "frequentemente", "raramente", "geralmente",
  "normalmente", "habitualmente",
]);
