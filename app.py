"""
Wagner Neri — Recuperação de Contas de Redes Sociais
Backend Flask, pronto para deploy na Vercel (Python Runtime).

Em produção (Vercel), os arquivos estáticos em `public/` são servidos
diretamente pela CDN da Vercel — este app só entra em ação para a rota
`/ir/whatsapp` (registro de lead + redirecionamento).

Localmente (`python app.py`), o app também serve os arquivos de `public/`
para facilitar o desenvolvimento sem depender da CLI da Vercel.
"""

import logging
import os
import sys
from pathlib import Path
from urllib.parse import quote

from flask import Flask, redirect, request, send_from_directory

BASE_DIR = Path(__file__).resolve().parent
PUBLIC_DIR = BASE_DIR / "public"

# (86) 9 8864-0341
WHATSAPP_NUMBER = "5586988640341"

# Mensagem pré-preenchida por origem do clique (qual botão foi usado).
MESSAGES = {
    "header": "Olá! Preciso de ajuda para recuperar minha conta de rede social.",
    "hero": (
        "Olá! Minha conta foi suspensa/banida em uma rede social e preciso "
        "de ajuda para recuperá-la com urgência."
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


@app.route("/")
def index():
    return send_from_directory(PUBLIC_DIR, "index.html")


@app.route("/<path:filename>")
def static_files(filename):
    """Serve style.css, script.js, img/*, etc. Usado apenas em desenvolvimento
    local — na Vercel, `public/**` é servido direto pela CDN."""
    return send_from_directory(PUBLIC_DIR, filename)


@app.route("/ir/whatsapp")
def ir_whatsapp():
    """Registra o clique como lead (via log) e redireciona para o WhatsApp."""
    origem = request.args.get("origem", "desconhecida")[:64]
    mensagem = MESSAGES.get(origem, DEFAULT_MESSAGE)

    logger.info(
        "lead_click origem=%s ip=%s user_agent=%s",
        origem,
        request.headers.get("X-Forwarded-For", request.remote_addr),
        request.headers.get("User-Agent", ""),
    )

    destino = f"https://wa.me/{WHATSAPP_NUMBER}?text={quote(mensagem)}"
    return redirect(destino, code=302)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG") == "1"
    app.run(host="0.0.0.0", port=port, debug=debug)
