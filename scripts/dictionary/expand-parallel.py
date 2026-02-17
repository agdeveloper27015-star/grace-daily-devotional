#!/usr/bin/env python3
"""
Parallel launcher — splits books across N worker processes.
Each worker runs sequential curl calls for its assigned books.
"""

import json
import os
import sys
import time
import subprocess
import multiprocessing
from pathlib import Path
from collections import defaultdict

PROJECT_DIR = Path(__file__).parent.parent.parent
DICT_PATH = PROJECT_DIR / "public" / "dicionario_completo.json"
PROGRESS_PATH = Path(__file__).parent / "openai-progress.json"
LOG_DIR = Path(__file__).parent
SCRIPT_DIR = Path(__file__).parent

OPENAI_KEY = os.environ.get("OPENAI_API_KEY", "")
MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
BATCH_SIZE = int(os.environ.get("BATCH_SIZE", "10"))
NUM_WORKERS = int(os.environ.get("NUM_WORKERS", "4"))
MAX_RETRIES = 4

FIELDS = [
    "significado_contextual",
    "explicacao_detalhada",
    "por_que_esta_palavra",
    "conexao_teologica",
    "referencias_relacionadas",
]

def log(worker_id, msg):
    ts = time.strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] [W{worker_id}] {msg}"
    print(line, flush=True)
    with open(LOG_DIR / f"expand-w{worker_id}.log", "a") as f:
        f.write(line + "\n")

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
                if attempt < MAX_RETRIES:
                    time.sleep(2 ** attempt)
                    continue
                return None
            data = json.loads(result.stdout)
            if "error" in data:
                code = data["error"].get("code", "")
                if "rate" in str(code).lower() or "rate" in data["error"].get("message","").lower():
                    wait = min(30, 2 ** attempt * 3)
                    time.sleep(wait)
                    continue
                return None
            content = data["choices"][0]["message"]["content"]
            return json.loads(content)
        except subprocess.TimeoutExpired:
            continue
        except (json.JSONDecodeError, KeyError, IndexError):
            return None
        except Exception:
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

def worker_fn(worker_id, assigned_books, book_map_serialized, dict_path, result_dir):
    """Each worker processes its books and writes results to a temp file."""
    book_map = json.loads(book_map_serialized)

    # Load dictionary
    log(worker_id, f"Loading dictionary...")
    with open(dict_path) as f:
        dictionary = json.load(f)
    log(worker_id, f"Loaded. Processing {len(assigned_books)} books")

    stats = {"processed": 0, "errors": 0}
    changes = {}  # key -> {field: value}

    for bi, book in enumerate(assigned_books):
        keys = book_map[book]
        log(worker_id, f"📖 [{bi+1}/{len(assigned_books)}] {book}: {len(keys)} entries")
        book_changed = 0

        for i in range(0, len(keys), BATCH_SIZE):
            batch_keys = keys[i:i+BATCH_SIZE]
            entries = [(k, dictionary[k]) for k in batch_keys]
            result = call_openai(entries)

            if result:
                for key, _ in entries:
                    if key in result:
                        key_changes = {}
                        for field in FIELDS:
                            if field in result[key] and result[key][field]:
                                key_changes[field] = result[key][field]
                        if key_changes:
                            changes[key] = key_changes
                            book_changed += 1
                            stats["processed"] += 1
            else:
                stats["errors"] += 1

        log(worker_id, f"  ✅ {book}: +{book_changed} | total: {stats['processed']} | err: {stats['errors']}")

        # Save partial results every book
        out_path = Path(result_dir) / f"results-w{worker_id}.json"
        with open(out_path, "w") as f:
            json.dump({"changes": changes, "stats": stats, "completedBooks": assigned_books[:bi+1]}, f, ensure_ascii=False)

    log(worker_id, f"🏁 Done! {stats['processed']} processed, {stats['errors']} errors")
    return worker_id

def main():
    if not OPENAI_KEY:
        print("OPENAI_API_KEY required"); sys.exit(1)

    print(f"[{time.strftime('%H:%M:%S')}] Expand Dictionary — {NUM_WORKERS} workers, batch {BATCH_SIZE}", flush=True)

    # Load dictionary keys to split books
    print("Loading dictionary for book splitting...", flush=True)
    with open(DICT_PATH) as f:
        dictionary = json.load(f)

    book_map = defaultdict(list)
    for key in dictionary:
        book = get_book_key(key)
        book_map[book].append(key)
    books = sorted(book_map.keys())
    print(f"{len(books)} books, {len(dictionary)} entries", flush=True)
    del dictionary  # free memory before forking

    # Load progress to skip completed books
    if PROGRESS_PATH.exists():
        with open(PROGRESS_PATH) as f:
            prog = json.load(f)
        done = set(prog.get("completedBooks", []))
        books = [b for b in books if b not in done]
        print(f"Skipping {len(done)} completed books, {len(books)} remaining", flush=True)

    # Split books across workers (round-robin for balance)
    worker_books = [[] for _ in range(NUM_WORKERS)]
    for i, book in enumerate(books):
        worker_books[i % NUM_WORKERS].append(book)

    for i, wb in enumerate(worker_books):
        total = sum(len(book_map[b]) for b in wb)
        print(f"  Worker {i}: {len(wb)} books, {total} entries", flush=True)

    # Prepare results dir
    result_dir = LOG_DIR / "parallel-results"
    result_dir.mkdir(exist_ok=True)

    # Serialize book_map
    bm_serial = json.dumps(dict(book_map))

    # Launch workers
    start = time.time()
    with multiprocessing.Pool(NUM_WORKERS) as pool:
        tasks = []
        for i, wb in enumerate(worker_books):
            tasks.append(pool.apply_async(worker_fn, (i, wb, bm_serial, str(DICT_PATH), str(result_dir))))
        for t in tasks:
            t.get(timeout=86400)  # 24h max

    elapsed = time.time() - start
    print(f"\n{'='*60}", flush=True)
    print(f"All workers done in {elapsed/60:.1f} min", flush=True)

    # Merge results back into dictionary
    print("Merging results...", flush=True)
    with open(DICT_PATH) as f:
        dictionary = json.load(f)

    total_changes = 0
    total_errors = 0
    for i in range(NUM_WORKERS):
        rpath = result_dir / f"results-w{i}.json"
        if rpath.exists():
            with open(rpath) as f:
                wd = json.load(f)
            for key, fields in wd["changes"].items():
                for field, value in fields.items():
                    dictionary[key][field] = value
                total_changes += 1
            total_errors += wd["stats"]["errors"]

    # Save final
    tmp = str(DICT_PATH) + ".tmp"
    with open(tmp, "w") as f:
        json.dump(dictionary, f, ensure_ascii=False)
    os.replace(tmp, str(DICT_PATH))

    # Update progress
    progress = {"completedBooks": books, "stats": {"processed": total_changes, "errors": total_errors, "skipped": 0}}
    progress["updatedAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    with open(PROGRESS_PATH, "w") as f:
        json.dump(progress, f, ensure_ascii=False)

    print(f"✅ Merged {total_changes} entries, {total_errors} errors", flush=True)
    print(f"Total time: {elapsed/60:.1f} min", flush=True)

if __name__ == "__main__":
    main()
