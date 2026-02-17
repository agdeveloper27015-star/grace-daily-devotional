#!/usr/bin/env python3
"""
Popula o dicionário Strong's com conteúdo real usando Gemini CLI.
Processa por versículo, salvando progresso incrementalmente.
"""

import json
import subprocess
import os
import sys
import time
from collections import defaultdict
from pathlib import Path

# Paths
PROJECT_DIR = Path(__file__).parent.parent
DICT_PATH = PROJECT_DIR / "public" / "dicionario_completo.json"
PROGRESS_PATH = PROJECT_DIR / "scripts" / "dict_progress.json"
SPEC_PATH = PROJECT_DIR / "DICIONARIO_SPEC.md"
LOG_PATH = PROJECT_DIR / "scripts" / "dict_populate.log"

# Strong numbers to skip (articles, prepositions, particles, conjunctions)
SKIP_STRONGS = {
    # Hebrew
    "H853",   # אֵת (et) - direct object marker
    "H834",   # אֲשֶׁר (asher) - that, which, who
    "H5921",  # עַל (al) - upon, above
    "H413",   # אֵל (el) - to, toward
    "H3588",  # כִּי (ki) - because, that
    "H3808",  # לֹא (lo) - not
    "H518",   # אִם (im) - if
    "H3651",  # כֵּן (ken) - so, thus
    "H3807",  # כַּ (ka) - as, like
    "H2088",  # זֶה (zeh) - this
    "H1931",  # הוּא (hu) - he, she, it
    "H3605",  # כֹּל (kol) - all, every (keep - theologically rich)
    # Greek
    "G3588",  # ὁ (ho) - the (article)
    "G1722",  # ἐν (en) - in
    "G1519",  # εἰς (eis) - into
    "G2532",  # καί (kai) - and
    "G3756",  # οὐ (ou) - not
    "G1161",  # δέ (de) - but, and
    "G3361",  # μή (me) - not
    "G1063",  # γάρ (gar) - for
    "G3754",  # ὅτι (hoti) - that, because
    "G2443",  # ἵνα (hina) - in order that
    "G4314",  # πρός (pros) - toward
    "G1537",  # ἐκ (ek) - out of
    "G3326",  # μετά (meta) - with, after
    "G575",   # ἀπό (apo) - from
    "G1909",  # ἐπί (epi) - upon
    "G4012",  # περί (peri) - concerning
    "G2596",  # κατά (kata) - according to
    "G1223",  # διά (dia) - through
    "G5259",  # ὑπό (hypo) - by, under
    "G3739",  # ὅς (hos) - who, which
    "G846",   # αὐτός (autos) - he, she, it
    "G1473",  # ἐγώ (ego) - I
    "G4771",  # σύ (sy) - you
    "G3778",  # οὗτος (houtos) - this
    "G1565",  # ἐκεῖνος (ekeinos) - that
}

# Keep H3605 (kol) - it's theologically important
SKIP_STRONGS.discard("H3605")

BATCH_SIZE = 8  # words per Gemini request
SAVE_EVERY = 30  # save after this many verses
GEMINI_TIMEOUT = 120  # seconds

def log(msg):
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{timestamp}] {msg}"
    print(line)
    with open(LOG_PATH, "a") as f:
        f.write(line + "\n")

def load_dict():
    with open(DICT_PATH, "r") as f:
        return json.load(f)

def save_dict(data):
    # Write to temp first, then rename (atomic)
    tmp = str(DICT_PATH) + ".tmp"
    with open(tmp, "w") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    os.replace(tmp, str(DICT_PATH))

def load_progress():
    if PROGRESS_PATH.exists():
        with open(PROGRESS_PATH, "r") as f:
            return json.load(f)
    return {"completed_verses": [], "stats": {"processed": 0, "skipped": 0, "errors": 0}}

def save_progress(progress):
    with open(PROGRESS_PATH, "w") as f:
        json.dump(progress, f, ensure_ascii=False, indent=2)

def verse_key_to_ref(verse_key):
    """Convert genesis_1_1 to Gênesis 1:1"""
    book_map = {
        "genesis": "Gênesis", "exodo": "Êxodo", "levitico": "Levítico",
        "numeros": "Números", "deuteronomio": "Deuteronômio", "josue": "Josué",
        "juizes": "Juízes", "rute": "Rute", "1samuel": "1 Samuel", "2samuel": "2 Samuel",
        "1reis": "1 Reis", "2reis": "2 Reis", "1cronicas": "1 Crônicas",
        "2cronicas": "2 Crônicas", "esdras": "Esdras", "neemias": "Neemias",
        "ester": "Ester", "jo": "Jó", "salmos": "Salmos", "proverbios": "Provérbios",
        "eclesiastes": "Eclesiastes", "cantares": "Cantares", "isaias": "Isaías",
        "jeremias": "Jeremias", "lamentacoes": "Lamentações", "ezequiel": "Ezequiel",
        "daniel": "Daniel", "oseias": "Oseias", "joel": "Joel", "amos": "Amós",
        "obadias": "Obadias", "jonas": "Jonas", "miqueias": "Miqueias",
        "naum": "Naum", "habacuque": "Habacuque", "sofonias": "Sofonias",
        "ageu": "Ageu", "zacarias": "Zacarias", "malaquias": "Malaquias",
        "mateus": "Mateus", "marcos": "Marcos", "lucas": "Lucas", "joao": "João",
        "atos": "Atos", "romanos": "Romanos", "1corintios": "1 Coríntios",
        "2corintios": "2 Coríntios", "galatas": "Gálatas", "efesios": "Efésios",
        "filipenses": "Filipenses", "colossenses": "Colossenses",
        "1tessalonicenses": "1 Tessalonicenses", "2tessalonicenses": "2 Tessalonicenses",
        "1timoteo": "1 Timóteo", "2timoteo": "2 Timóteo", "tito": "Tito",
        "filemom": "Filemom", "hebreus": "Hebreus", "tiago": "Tiago",
        "1pedro": "1 Pedro", "2pedro": "2 Pedro", "1joao": "1 João",
        "2joao": "2 João", "3joao": "3 João", "judas": "Judas",
        "apocalipse": "Apocalipse"
    }
    parts = verse_key.split("_")
    # Find where the numbers start
    book_parts = []
    num_parts = []
    for p in parts:
        if p.isdigit() and len(book_parts) > 0:
            num_parts.append(p)
        else:
            if num_parts:  # already in numbers, this shouldn't happen
                book_parts.append(p)
            else:
                book_parts.append(p)
    
    book = "_".join(book_parts[:-len(num_parts)] if num_parts else book_parts)
    # Try to extract chapter and verse from the end
    # Format: book_chapter_verse
    try:
        # Re-parse: find last two numeric segments
        all_parts = verse_key.split("_")
        nums = []
        book_segs = []
        for i, p in enumerate(all_parts):
            if p.isdigit():
                nums.append((i, p))
            else:
                book_segs.append(p)
        
        if len(nums) >= 2:
            chapter = nums[0][1]
            verse = nums[1][1]
            book_name = "_".join(all_parts[:nums[0][0]])
            book_pt = book_map.get(book_name, book_name.title())
            return f"{book_pt} {chapter}:{verse}"
    except:
        pass
    
    return verse_key

def call_gemini(prompt):
    """Call Gemini CLI with a prompt and return the response."""
    try:
        result = subprocess.run(
            ["gemini", "-p", prompt],
            capture_output=True,
            text=True,
            timeout=GEMINI_TIMEOUT,
            cwd=str(PROJECT_DIR)
        )
        if result.returncode != 0:
            log(f"  Gemini error: {result.stderr[:200]}")
            return None
        return result.stdout.strip()
    except subprocess.TimeoutExpired:
        log("  Gemini timeout")
        return None
    except Exception as e:
        log(f"  Gemini exception: {e}")
        return None

def build_prompt(verse_ref, words):
    """Build prompt for Gemini to fill in dictionary entries."""
    words_list = ""
    for key, entry in words:
        words_list += f"""
- ID: {key}
  palavra_pt: {entry.get('palavra_pt', '')}
  palavra_original: {entry.get('palavra_original', '')}
  transliteracao: {entry.get('transliteracao', '')}
  strong: {entry.get('strong', '')}
  significado_raiz: {entry.get('significado_raiz', '')}
"""

    prompt = f"""Você é um especialista em línguas bíblicas (hebraico, aramaico e grego) e teologia bíblica.

TAREFA: Preencher os campos do dicionário bíblico para as palavras de {verse_ref}.

PALAVRAS PARA PROCESSAR:
{words_list}

Para CADA palavra acima, retorne um JSON com os campos preenchidos. Siga estas regras RIGOROSAMENTE:

1. **significado_contextual**: O que a palavra significa NESTE versículo específico ({verse_ref}). 1-2 frases. Não repetir o significado_raiz.
2. **explicacao_detalhada**: Explicação aprofundada: raiz etimológica, forma gramatical, uso bíblico. 2-4 frases. Tom didático e acessível.
3. **por_que_esta_palavra**: Por que o autor bíblico ESCOLHEU esta palavra específica (e não outra). Qual a intenção, contraste ou nuance. 1-3 frases. SEJA ESPECÍFICO ao contexto de {verse_ref}.
4. **conexao_teologica**: Conexão com outros textos bíblicos, especialmente AT↔NT. 1-3 frases. Cite referências.
5. **referencias_relacionadas**: 2-5 versículos relacionados em português (ex: "Gênesis 1:1").

REGRAS:
- Escreva em português brasileiro
- Seja específico ao contexto de {verse_ref} — não use frases genéricas
- Nunca use a frase "para comunicar a ideia central"
- Cada campo deve trazer informação NOVA e ÚNICA
- Se a palavra é comum/simples neste contexto, seja breve mas ainda específico

Responda APENAS com JSON válido, no formato:
```json
{{
  "ID_DA_PALAVRA": {{
    "significado_contextual": "...",
    "explicacao_detalhada": "...",
    "por_que_esta_palavra": "...",
    "conexao_teologica": "...",
    "referencias_relacionadas": ["..."]
  }}
}}
```

Sem texto extra, sem explicações fora do JSON."""

    return prompt

def parse_gemini_response(response):
    """Extract JSON from Gemini response."""
    if not response:
        return None
    
    # Try to find JSON block
    json_str = response
    
    # Remove markdown code blocks if present
    if "```json" in json_str:
        json_str = json_str.split("```json")[1]
        if "```" in json_str:
            json_str = json_str.split("```")[0]
    elif "```" in json_str:
        parts = json_str.split("```")
        if len(parts) >= 3:
            json_str = parts[1]
        elif len(parts) >= 2:
            json_str = parts[1]
    
    json_str = json_str.strip()
    
    try:
        return json.loads(json_str)
    except json.JSONDecodeError:
        # Try to fix common issues
        try:
            # Sometimes there's trailing content
            # Find the last }
            last_brace = json_str.rfind("}")
            if last_brace > 0:
                json_str = json_str[:last_brace + 1]
                return json.loads(json_str)
        except:
            pass
        return None

def group_by_verse(data):
    """Group dictionary entries by verse."""
    verses = defaultdict(list)
    for key, entry in data.items():
        # Extract verse key (everything before the last _word part)
        parts = key.split("_")
        # Find the pattern: book_chapter_verse_word
        # We need to find where chapter starts (first digit after book name)
        book_end = 0
        for i, p in enumerate(parts):
            if p.isdigit():
                book_end = i
                break
        
        if book_end > 0 and book_end + 2 <= len(parts):
            verse_key = "_".join(parts[:book_end + 2])  # book + chapter + verse
            verses[verse_key].append((key, entry))
        else:
            # Fallback: use all but last part
            verse_key = "_".join(parts[:-1])
            verses[verse_key].append((key, entry))
    
    return verses

def main():
    log("=" * 60)
    log("Início da população do dicionário")
    log("=" * 60)
    
    # Load data
    data = load_dict()
    progress = load_progress()
    completed = set(progress.get("completed_verses", []))
    stats = progress.get("stats", {"processed": 0, "skipped": 0, "errors": 0})
    
    log(f"Total entradas: {len(data)}")
    log(f"Versículos já completados: {len(completed)}")
    
    # Group by verse
    verses = group_by_verse(data)
    log(f"Total versículos: {len(verses)}")
    
    # Filter out completed and sort
    pending = [(vk, entries) for vk, entries in verses.items() if vk not in completed]
    log(f"Versículos pendentes: {len(pending)}")
    
    saves_since_last = 0
    
    for idx, (verse_key, entries) in enumerate(pending):
        # Filter out articles/prepositions
        words = [(k, e) for k, e in entries if e.get("strong") not in SKIP_STRONGS]
        
        if not words:
            completed.add(verse_key)
            stats["skipped"] += 1
            continue
        
        verse_ref = verse_key_to_ref(verse_key)
        log(f"[{idx+1}/{len(pending)}] {verse_ref} ({len(words)} palavras)")
        
        # Process in batches
        for batch_start in range(0, len(words), BATCH_SIZE):
            batch = words[batch_start:batch_start + BATCH_SIZE]
            prompt = build_prompt(verse_ref, batch)
            
            # Call Gemini
            response = call_gemini(prompt)
            parsed = parse_gemini_response(response)
            
            if parsed:
                # Update dictionary entries
                for key, _ in batch:
                    if key in parsed:
                        entry_update = parsed[key]
                        for field in ["significado_contextual", "explicacao_detalhada", 
                                     "por_que_esta_palavra", "conexao_teologica", 
                                     "referencias_relacionadas"]:
                            if field in entry_update and entry_update[field]:
                                data[key][field] = entry_update[field]
                        stats["processed"] += 1
                    else:
                        log(f"  WARN: {key} not in Gemini response")
            else:
                stats["errors"] += 1
                log(f"  ERROR: Failed to parse Gemini response for {verse_ref}")
                # Don't mark as completed so we retry
                continue
            
            # Small delay to avoid rate limiting
            time.sleep(0.5)
        
        completed.add(verse_key)
        saves_since_last += 1
        
        # Save periodically
        if saves_since_last >= SAVE_EVERY:
            log(f"  Salvando progresso... ({stats['processed']} processadas, {stats['errors']} erros)")
            save_dict(data)
            progress["completed_verses"] = list(completed)
            progress["stats"] = stats
            save_progress(progress)
            saves_since_last = 0
    
    # Final save
    log("Salvamento final...")
    save_dict(data)
    progress["completed_verses"] = list(completed)
    progress["stats"] = stats
    save_progress(progress)
    
    log("=" * 60)
    log(f"CONCLUÍDO!")
    log(f"  Processadas: {stats['processed']}")
    log(f"  Puladas: {stats['skipped']}")
    log(f"  Erros: {stats['errors']}")
    log("=" * 60)

if __name__ == "__main__":
    main()
