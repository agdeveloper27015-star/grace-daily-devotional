#!/usr/bin/env python3
"""
Dictionary expander using curl (no urllib hangs).
Sequential but reliable. ~5-8 entries/sec with batch 10.
"""

import json
import os
import sys
import time
import subprocess
from pathlib import Path
from collections import defaultdict

PROJECT_DIR = Path(__file__).parent.parent.parent
DICT_PATH = PROJECT_DIR / "public" / "dicionario_completo.json"
PROGRESS_PATH = Path(__file__).parent / "openai-progress.json"
LOG_PATH = Path(__file__).parent / "expand-curl.log"

OPENAI_KEY = os.environ.get("OPENAI_API_KEY", "")
MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
BATCH_SIZE = int(os.environ.get("BATCH_SIZE", "10"))
MAX_RETRIES = 4

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
        json.dump(p, f, ensure_ascii=False)

def save_dict(data):
    tmp = str(DICT_PATH) + ".tmp"
    with open(tmp, "w") as f:
        json.dump(data, f, ensure_ascii=False)
    os.replace(tmp, str(DICT_PATH))

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

def call_openai(entries):
    prompt = build_prompt(entries)
    body = json.dumps({
        "model": MODEL,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": "Você gera JSON válido para um dicionário bíblico em português do Brasil. Responda somente JSON."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.2,
    })

    for attempt in range(MAX_RETRIES + 1):
        try:
            result = subprocess.run(
                ["curl", "-s", "--max-time", "60",
                 "-H", f"Authorization: Bearer {OPENAI_KEY}",
                 "-H", "Content-Type: application/json",
                 "-d", body,
                 "https://api.openai.com/v1/chat/completions"],
                capture_output=True, text=True, timeout=70
            )
            if result.returncode != 0:
                log(f"  ❌ curl failed: {result.stderr[:100]}")
                if attempt < MAX_RETRIES:
                    time.sleep(2 ** attempt)
                    continue
                return None

            data = json.loads(result.stdout)
            if "error" in data:
                msg = data["error"].get("message", "")
                if "rate" in msg.lower() or data["error"].get("code") == "rate_limit_exceeded":
                    wait = min(30, 2 ** attempt * 2)
                    log(f"  ⏳ Rate limit, {wait}s...")
                    time.sleep(wait)
                    continue
                log(f"  ❌ API error: {msg[:100]}")
                return None

            content = data["choices"][0]["message"]["content"]
            return json.loads(content)
        except subprocess.TimeoutExpired:
            log(f"  ⏳ Timeout, retry {attempt+1}")
            continue
        except (json.JSONDecodeError, KeyError, IndexError) as e:
            log(f"  ❌ Parse error: {e}")
            return None
        except Exception as e:
            log(f"  ❌ {str(e)[:100]}")
            if attempt < MAX_RETRIES:
                time.sleep(2 ** attempt)
                continue
            return None
    return None

def main():
    if not OPENAI_KEY:
        print("OPENAI_API_KEY required"); sys.exit(1)

    open(LOG_PATH, "w").close()
    log("=" * 60)
    log(f"Expand Dictionary (curl) — {MODEL}, batch {BATCH_SIZE}")
    log("=" * 60)

    log("Loading dictionary...")
    with open(DICT_PATH) as f:
        dictionary = json.load(f)
    log(f"Loaded {len(dictionary)} entries")

    book_map = defaultdict(list)
    for key in dictionary:
        book = get_book_key(key)
        book_map[book].append(key)
    books = sorted(book_map.keys())
    log(f"{len(books)} books")

    progress = load_progress()
    if "--reset" in sys.argv:
        progress = {"completedBooks": [], "stats": {"processed": 0, "errors": 0, "skipped": 0}}
    stats = progress["stats"]
    total_changed = 0
    start_time = time.time()
    save_counter = 0

    for bi, book in enumerate(books):
        if book in progress["completedBooks"]:
            continue

        keys = book_map[book]
        log(f"📖 [{bi+1}/{len(books)}] {book}: {len(keys)} entries")
        book_changed = 0

        for i in range(0, len(keys), BATCH_SIZE):
            batch_keys = keys[i:i+BATCH_SIZE]
            entries = [(k, dictionary[k]) for k in batch_keys]

            result = call_openai(entries)
            if result:
                for key, _ in entries:
                    if key in result:
                        for field in FIELDS:
                            if field in result[key] and result[key][field]:
                                dictionary[key][field] = result[key][field]
                        book_changed += 1
                        stats["processed"] += 1
                    else:
                        stats["skipped"] += 1
            else:
                stats["errors"] += 1

            save_counter += 1
            if save_counter % 20 == 0:
                elapsed = time.time() - start_time
                rate = stats["processed"] / elapsed if elapsed > 0 else 0
                remaining = sum(len(book_map[b]) for b in books if b not in progress["completedBooks"]) - book_changed
                eta_h = remaining / rate / 3600 if rate > 0 else 0
                log(f"  📊 {stats['processed']}/{len(dictionary)} | {rate:.1f}/s | ~{eta_h:.1f}h | err:{stats['errors']}")
                save_dict(dictionary)
                save_progress(progress)

        total_changed += book_changed
        progress["completedBooks"].append(book)
        log(f"  ✅ {book}: +{book_changed}")
        save_dict(dictionary)
        save_progress(progress)

    log("=" * 60)
    log(f"DONE! {stats['processed']} processed, {stats['errors']} errors, {total_changed} changed")
    log(f"Time: {(time.time()-start_time)/60:.1f} min")
    log("=" * 60)

if __name__ == "__main__":
    main()
