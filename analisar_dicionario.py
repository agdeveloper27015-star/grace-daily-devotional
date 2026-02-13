#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Análise detalhada do dicionário
"""

import json
from collections import defaultdict
from pathlib import Path

ARQUIVO_JSON = Path("C:/Users/anton/OneDrive/Área de Trabalho/grace-daily-devotional/public/dicionario_completo.json")

def main():
    print("Carregando dicionário...")
    with open(ARQUIVO_JSON, 'r', encoding='utf-8') as f:
        dados = json.load(f)
    
    print(f"Total de entradas: {len(dados)}")
    print("\nPrimeiras 20 chaves:")
    for i, chave in enumerate(list(dados.keys())[:20]):
        print(f"  {i+1}. {chave}")
    
    print("\nÚltimas 20 chaves:")
    for i, chave in enumerate(list(dados.keys())[-20:]):
        print(f"  {i+1}. {chave}")
    
    # Analisar estrutura
    estrutura = defaultdict(lambda: defaultdict(list))
    
    for chave in dados.keys():
        partes = chave.split('_')
        if len(partes) >= 4:
            livro = partes[0]
            try:
                capitulo = int(partes[1])
                estrutura[livro][capitulo].append(chave)
            except ValueError:
                pass
    
    # Estatísticas
    contagens = []
    for livro, caps in estrutura.items():
        for cap, entradas in caps.items():
            contagens.append((livro, cap, len(entradas)))
    
    # Mostrar distribuição
    print("\nDistribuição de entradas por capítulo:")
    distribuicao = defaultdict(int)
    for livro, cap, count in contagens:
        distribuicao[count] += 1
    
    for num in sorted(distribuicao.keys()):
        print(f"  {num} entradas: {distribuicao[num]} capítulos")
    
    # Capítulos com menos de 4 entradas
    print("\nCapítulos com menos de 4 entradas:")
    incompletos = [(l, c, n) for l, c, n in contagens if n < 4]
    incompletos.sort()
    
    for livro, cap, count in incompletos:
        print(f"  {livro} {cap}: {count} entradas")
    
    if not incompletos:
        print("  Nenhum capítulo incompleto encontrado!")
        
    # Mostrar alguns capítulos com exatamente 4 entradas
    print("\nExemplos de capítulos com exatamente 4 entradas:")
    exemplos = [(l, c, n) for l, c, n in contagens if n == 4][:10]
    for livro, cap, count in exemplos:
        print(f"  {livro} {cap}: {count} entradas")
        # Mostrar as chaves
        for chave in estrutura[livro][cap]:
            print(f"    - {chave}")

if __name__ == "__main__":
    main()
