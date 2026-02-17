#!/usr/bin/env python3
"""
Expand dictionary shards using OpenAI API.
Processes one book at a time to avoid memory issues.
"""

import json, os, sys, time
from pathlib import Path

SHARDS_DIR = Path(__file__).parent / "shards"
PROGRESS_PATH = Path(__file__).parent / "shards-progress.json"
LOG_PATH = Path(__file__).parent / "expand-shards.log"

OPENAI_KEY = os.environ.get("OPENAI_API_KEY", "")
MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
BATCH_SIZE = int(os.environ.get("BATCH_SIZE", "10"))
MAX_RETRIES = 6

FIELDS = ["significado_contextual", "explicacao_detalhada", "por_que_esta_palavra", "conexao_teologica", "referencias_relacionadas"]

def log(msg):
    ts = time.strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line, flush=True)
    with open(LOG_PATH, "a") as f:
        f.write(line + "\n")

def load_progress():
    if PROGRESS_PATH.exists():
        return json.load(open(PROGRESS_PATH))
    return {"done": [], "stats": {"processed": 0, "errors": 0}}

def save_progress(p):
    p["updatedAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    json.dump(p, open(PROGRESS_PATH, "w"), indent=2)

def call_openai(prompt):
    import subprocess, tempfile
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
                "max_tokens": 16000,
            })
            # Use curl instead of urllib (much faster on macOS)
            result = subprocess.run(
                ["curl", "-s", "--max-time", "90",
                 "https://api.openai.com/v1/chat/completions",
                 "-H", f"Authorization: Bearer {OPENAI_KEY}",
                 "-H", "Content-Type: application/json",
                 "-d", body],
                capture_output=True, text=True, timeout=100
            )
            data = json.loads(result.stdout)
            if "error" in data:
                code = data["error"].get("code", "")
                if "429" in str(data["error"].get("code", "")) or "rate" in data["error"].get("message", "").lower():
                    wait = min(60, 2 ** attempt * 2)
                    log(f"  ⏳ 429, retry {wait}s")
                    time.sleep(wait)
                    continue
                log(f"  ❌ API error: {data['error'].get('message','')[:100]}")
                return None
            return json.loads(data["choices"][0]["message"]["content"])
        except Exception as e:
            log(f"  ❌ {str(e)[:100]}")
            if attempt < MAX_RETRIES:
                time.sleep(2)
                continue
            return None
    return None

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
    return "Para cada chave, preencha: significado_contextual, explicacao_detalhada, por_que_esta_palavra, conexao_teologica, referencias_relacionadas.\nreferencias_relacionadas: string[] com 2-5 refs bíblicas em pt-BR.\nSeja específico ao contexto do versículo.\nDados:\n" + json.dumps(payload, ensure_ascii=False)

def main():
    if not OPENAI_KEY:
        print("Set OPENAI_API_KEY"); sys.exit(1)

    log("=" * 50)
    log(f"Expand Shards | Model: {MODEL} | Batch: {BATCH_SIZE}")
    log("=" * 50)

    progress = load_progress()
    if "--reset" in sys.argv:
        progress = {"done": [], "stats": {"processed": 0, "errors": 0}}

    shards = sorted(SHARDS_DIR.glob("*.json"))
    log(f"{len(shards)} shards found")

    for shard_path in shards:
        book = shard_path.stem
        if book in progress["done"] and "--force-all" not in sys.argv:
            continue

        log(f"📖 {book}")
        with open(shard_path) as f:
            data = json.load(f)

        keys = list(data.keys())
        changed = 0

        for i in range(0, len(keys), BATCH_SIZE):
            batch_keys = keys[i:i+BATCH_SIZE]
            entries = [(k, data[k]) for k in batch_keys]
            prompt = build_prompt(entries)

            result = call_openai(prompt)
            if result:
                for key, _ in entries:
                    if key in result:
                        for field in FIELDS:
                            if field in result[key] and result[key][field]:
                                data[key][field] = result[key][field]
                        changed += 1
                        progress["stats"]["processed"] += 1
                    else:
                        progress["stats"]["errors"] += 1
            else:
                progress["stats"]["errors"] += 1

            time.sleep(0.2)

        # Save shard
        with open(shard_path, "w") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        progress["done"].append(book)
        save_progress(progress)
        log(f"  ✅ {book}: {changed}/{len(keys)} changed | Total: {progress['stats']['processed']} processed, {progress['stats']['errors']} errors")

    log("=" * 50)
    log(f"DONE! {progress['stats']}")
    log("=" * 50)

if __name__ == "__main__":
    main()
