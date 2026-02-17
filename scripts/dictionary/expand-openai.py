#!/usr/bin/env python3
"""
Expand dictionary using OpenAI API (gpt-4o-mini).
Memory-efficient: loads JSON once with Python (much less overhead than Node).
Saves progress incrementally.
"""

import json
import os
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path
from collections import defaultdict

PROJECT_DIR = Path(__file__).parent.parent.parent
DICT_PATH = PROJECT_DIR / "public" / "dicionario_completo.json"
PROGRESS_PATH = Path(__file__).parent / "openai-progress.json"
LOG_PATH = Path(__file__).parent / "expand-openai-run.log"

OPENAI_KEY = os.environ.get("OPENAI_API_KEY", "")
MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
BATCH_SIZE = int(os.environ.get("BATCH_SIZE", "10"))
MAX_RETRIES = 6
SAVE_EVERY = 10  # batches

FIELDS = [
    "significado_contextual",
    "explicacao_detalhada",
    "por_que_esta_palavra",
    "conexao_teologica",
    "referencias_relacionadas",
]

def log(msg):
    ts = time.strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line, flush=True)
    with open(LOG_PATH, "a") as f:
        f.write(line + "\n")

def load_progress():
    if PROGRESS_PATH.exists():
        with open(PROGRESS_PATH) as f:
            return json.load(f)
    return {"completedBooks": [], "stats": {"processed": 0, "errors": 0, "skipped": 0}}

def save_progress(p):
    p["updatedAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    with open(PROGRESS_PATH, "w") as f:
        json.dump(p, f, ensure_ascii=False, indent=2)

def save_dict(data):
    tmp = str(DICT_PATH) + ".tmp"
    with open(tmp, "w") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    os.replace(tmp, str(DICT_PATH))

def call_openai(prompt):
    """Call OpenAI API with retry."""
    for attempt in range(MAX_RETRIES + 1):
        try:
            body = json.dumps({
                "model": MODEL,
                "response_format": {"type": "json_object"},
                "messages": [
                    {"role": "system", "content": "Você gera JSON válido para um dicionário bíblico em português do Brasil. Responda somente JSON."},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.2,
            }).encode()
            
            req = urllib.request.Request(
                "https://api.openai.com/v1/chat/completions",
                data=body,
                headers={
                    "Authorization": f"Bearer {OPENAI_KEY}",
                    "Content-Type": "application/json",
                },
            )
            
            with urllib.request.urlopen(req, timeout=120) as resp:
                data = json.loads(resp.read())
                content = data["choices"][0]["message"]["content"]
                return json.loads(content)
                
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait = min(120, 2 ** attempt * 3)
                log(f"  ⏳ Rate limited, retry in {wait}s ({attempt+1}/{MAX_RETRIES})")
                time.sleep(wait)
                continue
            log(f"  ❌ HTTP {e.code}: {e.read().decode()[:200]}")
            return None
        except Exception as e:
            log(f"  ❌ Error: {str(e)[:200]}")
            if attempt < MAX_RETRIES:
                time.sleep(2 ** attempt)
                continue
            return None
    return None

def get_book_key(entry_key):
    parts = entry_key.split("_")
    for i, p in enumerate(parts):
        if p.isdigit():
            return "_".join(parts[:i])
    return parts[0]

def build_prompt(entries):
    payload = {}
    for key, entry in entries:
        payload[key] = {
            "palavra_pt": entry.get("palavra_pt", ""),
            "palavra_original": entry.get("palavra_original", ""),
            "transliteracao": entry.get("transliteracao", ""),
            "strong": entry.get("strong", ""),
            "significado_raiz": entry.get("significado_raiz", ""),
        }
    return "\n".join([
        "Para cada chave, preencha:",
        "significado_contextual, explicacao_detalhada, por_que_esta_palavra, conexao_teologica, referencias_relacionadas.",
        "referencias_relacionadas deve ser string[] com 2-5 referências bíblicas reais em português.",
        "Seja específico ao contexto do versículo. Escreva em português brasileiro.",
        "Dados:",
        json.dumps(payload, ensure_ascii=False),
    ])

def main():
    if not OPENAI_KEY:
        print("OPENAI_API_KEY required")
        sys.exit(1)
    
    log("=" * 60)
    log(f"Expand Dictionary via OpenAI ({MODEL})")
    log(f"Batch size: {BATCH_SIZE}")
    log("=" * 60)
    
    # Load dictionary (Python handles 91MB fine)
    log("Loading dictionary...")
    with open(DICT_PATH) as f:
        dictionary = json.load(f)
    log(f"Loaded {len(dictionary)} entries")
    
    # Group by book
    book_map = defaultdict(list)
    for key in dictionary:
        book = get_book_key(key)
        book_map[book].append(key)
    books = sorted(book_map.keys())
    log(f"{len(books)} books")
    
    # Load progress
    progress = load_progress()
    force_all = "--force-all" in sys.argv
    if "--reset" in sys.argv:
        progress = {"completedBooks": [], "stats": {"processed": 0, "errors": 0, "skipped": 0}}
    
    stats = progress["stats"]
    total_changed = 0
    batches_since_save = 0
    
    for book in books:
        if not force_all and book in progress["completedBooks"]:
            log(f"⏭ {book}: already done")
            continue
        
        keys = book_map[book]
        log(f"📖 {book}: {len(keys)} entries")
        
        for i in range(0, len(keys), BATCH_SIZE):
            batch_keys = keys[i:i+BATCH_SIZE]
            entries = [(k, dictionary[k]) for k in batch_keys]
            prompt = build_prompt(entries)
            
            result = call_openai(prompt)
            
            if result:
                batch_changed = 0
                for key, _ in entries:
                    if key in result:
                        for field in FIELDS:
                            if field in result[key] and result[key][field]:
                                dictionary[key][field] = result[key][field]
                        batch_changed += 1
                        stats["processed"] += 1
                    else:
                        stats["skipped"] += 1
                total_changed += batch_changed
            else:
                stats["errors"] += 1
            
            batches_since_save += 1
            if batches_since_save >= SAVE_EVERY:
                log(f"  💾 Saving... ({stats['processed']} processed, {stats['errors']} errors, {total_changed} changed)")
                save_dict(dictionary)
                save_progress(progress)
                batches_since_save = 0
            
            time.sleep(0.3)
        
        progress["completedBooks"].append(book)
        log(f"  ✅ {book} done")
        save_dict(dictionary)
        save_progress(progress)
        batches_since_save = 0
    
    log("=" * 60)
    log(f"COMPLETE! processed={stats['processed']} errors={stats['errors']} changed={total_changed}")
    log("=" * 60)

if __name__ == "__main__":
    main()
