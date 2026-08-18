"""
Wagner Neri — Recuperação de Contas de Redes Sociais
Backend Flask, pronto para deploy na Vercel (Python Runtime).

Em produção (Vercel), os arquivos estáticos em `public/` são servidos
diretamente pela CDN da Vercel — este app só entra em ação para a rota
`/ir/whatsapp` (registro de lead + redirecionamento).

Localmente (`python app.py`), o app também serve os arquivos de `public/`
para facilitar o desenvolvimento sem depender da CLI da Vercel.
"""

from __future__ import annotations

import logging
import os
import re
import sys
from pathlib import Path
from urllib.parse import quote, urlparse

from flask import Flask, abort, redirect, request, send_from_directory

BASE_DIR = Path(__file__).resolve().parent
PUBLIC_DIR = (BASE_DIR / "public").resolve()

# Allowlist estrita — nunca aceitar telefone ou host vindos da query.
WHATSAPP_NUMBER = "5586988640341"
ALLOWED_WHATSAPP_HOSTS = frozenset({"wa.me", "api.whatsapp.com", "www.whatsapp.com"})
WHATSAPP_BASE = f"https://wa.me/{WHATSAPP_NUMBER}"

ALLOWED_ORIGENS = frozenset({"header", "hero", "estrategia", "especialista", "float"})

ATTR_KEYS = (
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
    "gclid",
    "gbraid",
    "wbraid",
    "fbclid",
)
MAX_ATTR_LEN = 80
_ATTR_SAFE_RE = re.compile(r"^[\w.\-:%+=@/ ]{1,80}$", re.UNICODE)

# Mensagem pré-preenchida por origem do clique (qual botão foi usado).
MESSAGES = {
    "header": "Olá! Preciso de ajuda para recuperar minha conta de rede social.",
    "hero": (
        "Olá! Minha conta foi bloqueada, hackeada ou banida e preciso de ajuda "
        "urgente para recuperá-la com liminar / Direito Digital."
    ),
    "estrategia": (
        "Olá! Quero uma análise estratégica do meu caso de recuperação de conta "
        "(Instagram, WhatsApp, Facebook ou TikTok)."
    ),
    "especialista": "Olá! Gostaria de avaliar meu caso de recuperação de conta agora.",
    "float": "Olá! Preciso de ajuda para recuperar minha conta suspensa em uma rede social.",
}
DEFAULT_MESSAGE = "Olá! Preciso de ajuda para recuperar minha conta de rede social."

# Logs vão para stdout: no Vercel aparecem em Project > Logs (Runtime Logs).
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger("leads")

app = Flask(__name__, static_folder=None)


def _sanitize_attr_value(raw: str | None) -> str:
    if not raw:
        return ""
    cleaned = re.sub(r"[\x00-\x1f\x7f]", "", str(raw)).strip()
    if not cleaned:
        return ""
    cleaned = cleaned[:MAX_ATTR_LEN]
    if not _ATTR_SAFE_RE.match(cleaned):
        return ""
    return cleaned


def _short_id(value: str) -> str:
    if len(value) > 12:
        return value[:8] + "…"
    return value


def _attribution_suffix() -> str:
    """Monta sufixo curto a partir de UTMs/clids sanitizados (sem PII)."""
    parts: list[str] = []
    utm_source = _sanitize_attr_value(request.args.get("utm_source"))
    utm_campaign = _sanitize_attr_value(request.args.get("utm_campaign"))
    if utm_source:
        parts.append(f"origem: {_short_id(utm_source)}")
    if utm_campaign:
        parts.append(f"campanha: {_short_id(utm_campaign)}")
    for key in ("gclid", "gbraid", "wbraid", "fbclid"):
        value = _sanitize_attr_value(request.args.get(key))
        if value:
            parts.append(f"{key}: {_short_id(value)}")
    return f"\n\n[{' | '.join(parts)}]" if parts else ""


def _build_whatsapp_url(mensagem: str) -> str:
    """Sempre aponta para wa.me + número fixo — open redirect impossível via query."""
    destino = f"{WHATSAPP_BASE}?text={quote(mensagem)}"
    parsed = urlparse(destino)
    if parsed.scheme != "https" or parsed.hostname not in ALLOWED_WHATSAPP_HOSTS:
        logger.error("destino_whatsapp_invalido host=%s", parsed.hostname)
        abort(500)
    # Garante que o path contém apenas o número allowlisted
    if parsed.path.strip("/") != WHATSAPP_NUMBER:
        logger.error("destino_whatsapp_numero_invalido")
        abort(500)
    return destino


def _safe_public_file(filename: str) -> Path:
    """Resolve arquivo sob PUBLIC_DIR; aborta em path traversal."""
    if not filename or filename.startswith(("/", "\\")) or ".." in filename.split("/"):
        abort(404)
    target = (PUBLIC_DIR / filename).resolve()
    try:
        target.relative_to(PUBLIC_DIR)
    except ValueError:
        abort(404)
    if not target.is_file():
        abort(404)
    return target


@app.route("/")
def index():
    return send_from_directory(PUBLIC_DIR, "index.html")


@app.route("/robots.txt")
def robots():
    return send_from_directory(PUBLIC_DIR, "robots.txt")


@app.route("/sitemap.xml")
def sitemap():
    return send_from_directory(PUBLIC_DIR, "sitemap.xml")


@app.route("/<path:filename>")
def static_files(filename):
    """Serve style.css, script.js, img/*, etc. Usado apenas em desenvolvimento
    local — na Vercel, `public/**` é servido direto pela CDN."""
    _safe_public_file(filename)
    return send_from_directory(PUBLIC_DIR, filename)


@app.route("/ir/whatsapp")
def ir_whatsapp():
    """Registra o clique (log mínimo) e redireciona para o WhatsApp allowlisted."""
    origem_raw = (request.args.get("origem") or "desconhecida")[:64]
    origem = origem_raw if origem_raw in ALLOWED_ORIGENS else "desconhecida"
    mensagem = MESSAGES.get(origem, DEFAULT_MESSAGE) + _attribution_suffix()

    # Log sem IP e sem User-Agent completo — reduz exposição de PII nos Runtime Logs.
    attr_present = [
        key for key in ATTR_KEYS if _sanitize_attr_value(request.args.get(key))
    ]
    logger.info(
        "lead_click origem=%s attrs=%s",
        origem,
        ",".join(attr_present) if attr_present else "-",
    )

    return redirect(_build_whatsapp_url(mensagem), code=302)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG") == "1"
    app.run(host="0.0.0.0", port=port, debug=debug)
