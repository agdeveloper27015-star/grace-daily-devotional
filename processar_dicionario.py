#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para processar o dicionario_completo.json
- Contar entradas
- Identificar capítulos com menos de 4 entradas
- Gerar palavras teológicas faltantes
"""

import json
import re
from collections import defaultdict
from pathlib import Path

# Caminho do arquivo
ARQUIVO_JSON = Path("C:/Users/anton/OneDrive/Área de Trabalho/grace-daily-devotional/public/dicionario_completo.json")
ARQUIVO_SAIDA = Path("C:/Users/anton/OneDrive/Área de Trabalho/grace-daily-devotional/public/dicionario_completo.json")

def carregar_dicionario():
    """Carrega o dicionário JSON"""
    print("Carregando dicionario_completo.json...")
    with open(ARQUIVO_JSON, 'r', encoding='utf-8') as f:
        return json.load(f)

def contar_entradas(dados):
    """Conta o total de entradas"""
    return len(dados)

def analisar_estrutura(dados):
    """
    Analisa a estrutura das chaves.
    Formato esperado: livroid_capitulo_versiculo_palavra
    """
    estrutura = defaultdict(lambda: defaultdict(list))  # livro -> capítulo -> lista de entradas
    
    for chave in dados.keys():
        partes = chave.split('_')
        if len(partes) >= 4:
            livro = partes[0]
            try:
                capitulo = int(partes[1])
                versiculo = partes[2]
                palavra = '_'.join(partes[3:])  # Palavra pode conter underscore
                
                estrutura[livro][capitulo].append({
                    'chave': chave,
                    'versiculo': versiculo,
                    'palavra': palavra,
                    'dados': dados[chave]
                })
            except ValueError:
                # Ignorar chaves que não seguem o padrão
                pass
    
    return estrutura

def identificar_capitulos_incompletos(estrutura, min_entradas=4):
    """
    Identifica capítulos com menos entradas que o mínimo.
    Retorna: dict {livro: {capitulo: num_entradas}}
    """
    incompletos = defaultdict(dict)
    
    for livro, capitulos in estrutura.items():
        for capitulo, entradas in capitulos.items():
            if len(entradas) < min_entradas:
                incompletos[livro][capitulo] = len(entradas)
    
    return incompletos

def determinar_testamento(livro):
    """
    Determina se o livro é do Antigo ou Novo Testamento.
    Retorna 'AT' ou 'NT'
    """
    # Lista de livros do Novo Testamento (abreviações comuns)
    nt_livros = [
        'mateus', 'marcos', 'lucas', 'joao', 'atos', 'romanos',
        '1corintios', '2corintios', 'galatas', 'efesios', 'filipenses',
        'colossenses', '1tessalonicenses', '2tessalonicenses', '1timoteo',
        '2timoteo', 'tito', 'filemom', 'hebreus', 'tiago', '1pedro',
        '2pedro', '1joao', '2joao', '3joao', 'judas', 'apocalipse'
    ]
    
    return 'NT' if livro.lower() in nt_livros else 'AT'

def gerar_palavra_teorologica(livro, capitulo, versiculo, palavra_pt, strong, palavra_original, transliteracao, 
                               significado_raiz, tema, descricao_livro):
    """
    Gera uma entrada de palavra teológica no formato do dicionário.
    """
    return {
        "palavra_pt": palavra_pt,
        "palavra_original": palavra_original,
        "transliteracao": transliteracao,
        "strong": strong,
        "significado_raiz": significado_raiz,
        "significado_contextual": f"Em {descricao_livro}, esta palavra expressa {significado_raiz.lower()} no contexto de {tema}, revelando um aspecto profundo do caráter de Deus e Seu relacionamento com o ser humano.",
        "explicacao_detalhada": f"O termo {transliteracao} ({strong}) carrega um significado rico que vai além de uma simples tradução. Em {descricao_livro}, o uso desta palavra revela a profundidade da comunicação divina com seu povo. No contexto do capítulo {capitulo}, versículo {versiculo}, o autor emprega este termo para transmitir uma verdade espiritual que ressoa através de toda a Escritura.",
        "por_que_esta_palavra": f"A palavra '{palavra_pt}' ({transliteracao}) é fundamental nesta passagem porque ilumina o tema de {tema} que permeia este trecho. Compreender seu significado original enriquece nossa leitura e revela nuances que se perdem na tradução.",
        "conexao_teologica": f"Esta palavra conecta-se ao tema bíblico mais amplo de {tema}. Em {descricao_livro}, vemos como Deus progressivamente revela Seu plano redentor, e o uso de {transliteracao} aqui contribui para essa revelação progressiva que culmina em Cristo.",
        "referencias_relacionadas": [
            {"referencia": "Salmos 119:105", "relevancia": "A Palavra como guia"},
            {"referencia": "Romanos 8:28", "relevancia": "Todas as coisas cooperam para o bem"},
            {"referencia": "Filipenses 4:13", "relevancia": "Tudo posso naquele que me fortalece"}
        ]
    }

# Banco de palavras teológicas para AT (Hebraico) - Strong reais
PALAVRAS_AT = [
    # (palavra_pt, strong, palavra_hebraica, transliteracao, significado_raiz, tema)
    ("amor", "H160", "אַהֲבָה", "ahavah", "Amor, afeição", "amor"),
    ("paz", "H7965", "שָׁלוֹם", "shalom", "Paz, integridade, prosperidade", "paz"),
    ("graça", "H2580", "חֵן", "chen", "Graça, favor, beleza", "graça"),
    ("fé", "H530", "אֱמוּנָה", "emunah", "Fé, fidelidade, firmeza", "fé"),
    ("justiça", "H6666", "צְדָקָה", "tzedaqah", "Justiça, retidão", "justiça"),
    ("misericórdia", "H2617", "חֶסֶד", "chesed", "Misericórdia, bondade, lealdade", "misericórdia"),
    ("verdade", "H571", "אֱמֶת", "emet", "Verdade, firmeza, confiança", "verdade"),
    ("sabedoria", "H2451", "חָכְמָה", "chokmah", "Sabedoria, conhecimento", "sabedoria"),
    ("luz", "H216", "אוֹר", "or", "Luz, brilho, luminosidade", "luz"),
    ("vida", "H2416", "חַיִּים", "chayyim", "Vida, vivente, animado", "vida"),
    ("santidade", "H6944", "קֹדֶשׁ", "qodesh", "Santidade, separação", "santidade"),
    ("glória", "H3519", "כָּבוֹד", "kavod", "Glória, peso, honra", "glória"),
    ("força", "H3581", "כֹּחַ", "koach", "Força, poder, capacidade", "força"),
    ("esperança", "H8615", "תִּקְוָה", "tiqvah", "Esperança, expectativa", "esperança"),
    ("salvação", "H3444", "יְשׁוּעָה", "yeshuah", "Salvação, libertação", "salvação"),
    ("perdão", "H5545", "סָלַח", "salach", "Perdoar, absolver", "perdão"),
    ("bendito", "H1288", "בָּרַךְ", "barak", "Bendizer, ajoelhar", "bênção"),
    ("decreto", "H2706", "חֹק", "choq", "Decreto, estatuto, lei", "lei"),
    ("maravilha", "H6381", "פָּלָא", "pala", "Maravilha, algo extraordinário", "maravilha"),
    ("testemunho", "H5713", "עֵדוּת", "edut", "Testemunho, estatuto", "testemunho"),
    ("louvor", "H8416", "תְּהִלָּה", "tehillah", "Louvor, adoração", "louvor"),
    ("refúgio", "H4268", "מַחֲסֶה", "machaseh", "Refúgio, abrigo", "proteção"),
    ("caminho", "H1870", "דֶּרֶךְ", "derech", "Caminho, estrada, maneira", "caminho"),
    ("palavra", "H1697", "דָּבָר", "davar", "Palavra, assunto, coisa", "palavra"),
    ("criação", "H1254", "בָּרָא", "bara", "Criar, fazer", "criação"),
    ("espírito", "H7307", "רוּחַ", "ruach", "Espírito, vento, sopro", "espírito"),
    ("cordeiro", "H7716", "שֶׂה", "seh", "Cordeiro, ovelha", "sacrifício"),
    ("altar", "H4196", "מִזְבֵּחַ", "mizbeach", "Altar, lugar de sacrifício", "adoração"),
    ("sangue", "H1818", "דָּם", "dam", "Sangue, vida", "expiação"),
    ("aliança", "H1285", "בְּרִית", "berit", "Aliança, pacto", "aliança"),
]

# Banco de palavras teológicas para NT (Grego) - Strong reais
PALAVRAS_NT = [
    # (palavra_pt, strong, palavra_grega, transliteracao, significado_raiz, tema)
    ("amor", "G26", "ἀγάπη", "agape", "Amor benevolente, boa vontade", "amor"),
    ("paz", "G1515", "εἰρήνη", "eirene", "Paz, harmonia, tranquilidade", "paz"),
    ("graça", "G5485", "χάρις", "charis", "Graça, favor imerecido", "graça"),
    ("fé", "G4102", "πίστις", "pistis", "Fé, confiança, fidelidade", "fé"),
    ("justiça", "G1343", "δικαιοσύνη", "dikaiosyne", "Justiça, retidão", "justiça"),
    ("misericórdia", "G1656", "ἔλεος", "eleos", "Misericórdia, compaixão", "misericórdia"),
    ("verdade", "G225", "ἀλήθεια", "aletheia", "Verdade, realidade", "verdade"),
    ("sabedoria", "G4678", "σοφία", "sophia", "Sabedoria, conhecimento", "sabedoria"),
    ("luz", "G5457", "φῶς", "phos", "Luz, brilho, iluminação", "luz"),
    ("vida", "G2222", "ζωή", "zoe", "Vida, existência", "vida"),
    ("santificação", "G38", "ἁγιασμός", "hagiasmos", "Santificação, consagração", "santidade"),
    ("glória", "G1391", "δόξα", "doxa", "Glória, esplendor", "glória"),
    ("poder", "G1411", "δύναμις", "dynamis", "Poder, capacidade, milagre", "poder"),
    ("esperança", "G1680", "ἐλπίς", "elpis", "Esperança, expectativa confiante", "esperança"),
    ("salvação", "G4991", "σωτηρία", "soteria", "Salvação, libertação", "salvação"),
    ("perdão", "G859", "ἄφεσις", "aphesis", "Soltar, perdão, remissão", "perdão"),
    ("bendito", "G2127", "εὐλογέω", "eulogeo", "Bendizer, falar bem", "bênção"),
    ("doutrina", "G1319", "διδασκαλία", "didaskalia", "Doutrina, ensino", "ensino"),
    ("maravilha", "G5059", "τέρας", "teras", "Maravilha, portento", "maravilha"),
    ("testemunho", "G3141", "μαρτυρία", "martyria", "Testemunho, evidência", "testemunho"),
    ("louvor", "G1868", "ἔπαινος", "epainos", "Louvor, aprovação", "louvor"),
    ("refúgio", "G2702", "καταφεύγω", "katapheugo", "Refugiar-se, buscar proteção", "proteção"),
    ("caminho", "G3598", "ὁδός", "hodos", "Caminho, estrada, modo", "caminho"),
    ("palavra", "G3056", "λόγος", "logos", "Palavra, discurso, razão", "palavra"),
    ("criação", "G2937", "κτίσις", "ktisis", "Criação, criatura", "criação"),
    ("espírito", "G4151", "πνεῦμα", "pneuma", "Espírito, vento, sopro", "espírito"),
    ("cordeiro", "G286", "ἀμνός", "amnos", "Cordeiro", "sacrifício"),
    ("templo", "G3485", "ναός", "naos", "Templo, santuário interior", "adoração"),
    ("sangue", "G129", "αἷμα", "haima", "Sangue", "expiação"),
    ("aliança", "G1242", "διαθήκη", "diatheke", "Aliança, testamento", "aliança"),
]

# Descrições dos livros
DESCRICOES = {
    "genesis": "Gênesis, o livro das origens",
    "exodo": "Êxodo, a narrativa da libertação do Egito",
    "levitico": "Levítico, o livro da santidade",
    "numeros": "Números, as wanderings no deserto",
    "deuteronomio": "Deuteronômio, a renovação da aliança",
    "josue": "Josué, a conquista da terra prometida",
    "juizes": "Juízes, o ciclo de apostasia",
    "rute": "Rute, a história de redenção",
    "1samuel": "1 Samuel, a transição para a monarquia",
    "2samuel": "2 Samuel, o reinado de Davi",
    "1reis": "1 Reis, a glória e divisão do reino",
    "2reis": "2 Reis, a queda dos reinos",
    "1cronicas": "1 Crônicas, que reconta a história de Israel focando na adoração",
    "2cronicas": "2 Crônicas, o templo e a adoração",
    "esdras": "Esdras, o retorno do exílio",
    "neemias": "Neemias, a reconstrução dos muros",
    "ester": "Ester, a providência divina",
    "jo": "Jó, o problema do sofrimento",
    "salmos": "Salmos, o livro de orações e louvor",
    "proverbios": "Provérbios, a sabedoria prática",
    "eclesiastes": "Eclesiastes, a busca pelo sentido da vida",
    "cantares": "Cantares, a celebração do amor",
    "isaias": "Isaías, o evangelho do Antigo Testamento",
    "jeremias": "Jeremias, o profeta do lamento",
    "lamentacoes": "Lamentações, o luto pela queda de Jerusalém",
    "ezequiel": "Ezequiel, a glória de Deus no exílio",
    "daniel": "Daniel, a soberania de Deus nas nações",
    "oseias": "Oséias, o amor fiel de Deus",
    "joel": "Joel, o dia do Senhor",
    "amos": "Amós, a justiça social de Deus",
    "obadias": "Obadias, o juízo sobre Edom",
    "jonas": "Jonas, a misericórdia divina",
    "miqueias": "Miqueias, o juízo e a esperança",
    "naum": "Naum, a queda de Nínive",
    "habacuc": "Habacuque, a fé diante do mistério",
    "sofonias": "Sofonias, o dia da ira do Senhor",
    "ageu": "Ageu, a reconstrução do templo",
    "zacarias": "Zacarias, o Messias e Seu reino",
    "malaquias": "Malaquias, a preparação para o Messias",
    "mateus": "Mateus, o evangelho do Reino",
    "marcos": "Marcos, o evangelho da ação",
    "lucas": "Lucas, o evangelho da compaixão",
    "joao": "João, o evangelho da divindade de Cristo",
    "atos": "Atos, a expansão da igreja",
    "romanos": "Romanos, a justificação pela fé",
    "1corintios": "1 Coríntios, a carta sobre a vida em comunidade",
    "2corintios": "2 Coríntios, o ministério da reconciliação",
    "galatas": "Gálatas, a liberdade na graça",
    "efesios": "Efésios, a posição do crente em Cristo",
    "filipenses": "Filipenses, a alegria em Cristo",
    "colossenses": "Colossenses, a supremacia de Cristo",
    "1tessalonicenses": "1 Tessalonicenses, a esperança da volta de Cristo",
    "2tessalonicenses": "2 Tessalonicenses, o dia do Senhor",
    "1timoteo": "1 Timóteo, a conduta na igreja",
    "2timoteo": "2 Timóteo, a fidelidade ao ministério",
    "tito": "Tito, a organização da igreja",
    "filemom": "Filemom, a intercessão cristã",
    "hebreus": "Hebreus, a superioridade de Cristo",
    "tiago": "Tiago, a fé que se manifesta em obras",
    "1pedro": "1 Pedro, a esperança na aflição",
    "2pedro": "2 Pedro, o crescimento no conhecimento",
    "1joao": "1 João, a comunhão com Deus",
    "2joao": "2 João, a verdade e o amor",
    "3joao": "3 João, a hospitalidade cristã",
    "judas": "Judas, a contenda pela fé",
    "apocalipse": "Apocalipse, a consumação de todas as coisas",
}

def main():
    print("=" * 60)
    print("PROCESSAMENTO DO DICIONÁRIO BÍBLICO")
    print("=" * 60)
    
    # Carregar dados
    dados = carregar_dicionario()
    total_entradas = contar_entradas(dados)
    print(f"\nTotal de entradas no dicionário: {total_entradas}")
    
    # Analisar estrutura
    estrutura = analisar_estrutura(dados)
    print(f"\nTotal de livros encontrados: {len(estrutura)}")
    
    # Contar capítulos
    total_capitulos = sum(len(caps) for caps in estrutura.values())
    print(f"Total de capítulos encontrados: {total_capitulos}")
    
    # Identificar capítulos incompletos
    incompletos = identificar_capitulos_incompletos(estrutura)
    
    print(f"\n{'='*60}")
    print(f"CAPÍTULOS COM MENOS DE 4 ENTRADAS")
    print(f"{'='*60}")
    
    total_incompletos = 0
    for livro in sorted(incompletos.keys()):
        print(f"\n{livro.upper()}:")
        for capitulo in sorted(incompletos[livro].keys()):
            num_entradas = incompletos[livro][capitulo]
            faltam = 4 - num_entradas
            print(f"  Capítulo {capitulo}: {num_entradas} entradas (faltam {faltam})")
            total_incompletos += 1
    
    print(f"\n{'='*60}")
    print(f"Total de capítulos incompletos: {total_incompletos}")
    print(f"{'='*60}")
    
    return dados, estrutura, incompletos

if __name__ == "__main__":
    main()
