#!/usr/bin/env python3
"""
Fast dictionary expander — ThreadPool with chunked processing.
Processes WORKERS batches at a time, saves after each chunk.
"""

import json
import os
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed

PROJECT_DIR = Path(__file__).parent.parent.parent
DICT_PATH = PROJECT_DIR / "public" / "dicionario_completo.json"
PROGRESS_PATH = Path(__file__).parent / "openai-progress.json"
LOG_PATH = Path(__file__).parent / "expand-openai-run.log"

OPENAI_KEY = os.environ.get("OPENAI_API_KEY", "")
MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
BATCH_SIZE = int(os.environ.get("BATCH_SIZE", "10"))
WORKERS = int(os.environ.get("WORKERS", "5"))
MAX_RETRIES = 4
SAVE_INTERVAL = 30  # save every N batches completed

FIELDS = [
    "significado_contextual",
    "explicacao_detalhada",
    "por_que_esta_palavra",
    "conexao_teologica",
    "referencias_relacionadas",
]

_log_lock = __import__('threading').Lock()

def log(msg):
    ts = time.strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    with _log_lock:
        print(line, flush=True)
        with open(LOG_PATH, "a") as f:
            f.write(line + "\n")

def load_progress():
    if PROGRESS_PATH.exists():
        with open(PROGRESS_PATH) as f:
            return json.load(f)
    return {"completedBooks": [], "completedKeys": {}, "stats": {"processed": 0, "errors": 0, "skipped": 0}}

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
    """Worker: process one batch, return (keys, result_dict or None)."""
    keys = [k for k, _ in entries]
    prompt = build_prompt(entries)
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
            with urllib.request.urlopen(req, timeout=90) as resp:
                data = json.loads(resp.read())
                content = data["choices"][0]["message"]["content"]
                return (keys, json.loads(content))
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait = min(30, 2 ** attempt * 2)
                time.sleep(wait)
                continue
            log(f"  ❌ HTTP {e.code}")
            return (keys, None)
        except Exception as e:
            if attempt < MAX_RETRIES:
                time.sleep(min(10, 2 ** attempt))
                continue
            log(f"  ❌ {str(e)[:100]}")
            return (keys, None)
    return (keys, None)

def main():
    if not OPENAI_KEY:
        print("OPENAI_API_KEY required"); sys.exit(1)

    # Clear log for clean run
    open(LOG_PATH, "w").close()

    log("=" * 60)
    log(f"Fast Expand (threads) — {MODEL}")
    log(f"Batch: {BATCH_SIZE}, Workers: {WORKERS}")
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
    batches_done = 0

    for bi, book in enumerate(books):
        if book in progress["completedBooks"]:
            continue

        keys = book_map[book]
        # Build all batches for this book
        all_batches = []
        for i in range(0, len(keys), BATCH_SIZE):
            batch_keys = keys[i:i+BATCH_SIZE]
            all_batches.append([(k, dictionary[k]) for k in batch_keys])

        log(f"📖 [{bi+1}/{len(books)}] {book}: {len(keys)} entries")
        book_changed = 0

        # Process in chunks of WORKERS*2 batches at a time
        chunk_size = WORKERS * 3
        for ci in range(0, len(all_batches), chunk_size):
            chunk = all_batches[ci:ci+chunk_size]

            with ThreadPoolExecutor(max_workers=WORKERS) as pool:
                futures = [pool.submit(call_openai, b) for b in chunk]
                for future in as_completed(futures):
                    batch_keys, result = future.result()
                    if result:
                        for key in batch_keys:
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

                    batches_done += 1

            # Log progress after each chunk
            elapsed = time.time() - start_time
            rate = stats["processed"] / elapsed if elapsed > 0 else 0
            log(f"  📊 {stats['processed']} done | {rate:.1f}/s | err:{stats['errors']}")

            # Save periodically
            if batches_done % SAVE_INTERVAL < chunk_size:
                save_dict(dictionary)
                save_progress(progress)

        total_changed += book_changed
        progress["completedBooks"].append(book)

        elapsed = time.time() - start_time
        rate = stats["processed"] / elapsed if elapsed > 0 else 0
        remaining = sum(len(book_map[b]) for b in books if b not in progress["completedBooks"])
        eta_h = remaining / rate / 3600 if rate > 0 else 0
        log(f"  ✅ {book}: +{book_changed} | {stats['processed']}/{len(dictionary)} ({stats['processed']*100//len(dictionary)}%) | ~{eta_h:.1f}h left")

        save_dict(dictionary)
        save_progress(progress)

    log("=" * 60)
    log(f"DONE! {stats['processed']} processed, {stats['errors']} errors, {total_changed} changed")
    log(f"Time: {(time.time()-start_time)/60:.1f} min")
    log("=" * 60)

if __name__ == "__main__":
    main()
