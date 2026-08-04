"""
Wagner Neri — Recuperação de Contas de Redes Sociais
Backend Flask: serve a landing page estática e registra os cliques no
botão do WhatsApp (leads) antes de redirecionar o visitante para o WhatsApp.
"""

import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote

from flask import Flask, g, jsonify, redirect, request, send_from_directory

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "leads.db"

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

# Defina a variável de ambiente ADMIN_TOKEN para habilitar o endpoint /leads.
ADMIN_TOKEN = os.environ.get("ADMIN_TOKEN")

app = Flask(__name__, static_folder=None)


def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(_exception):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    with sqlite3.connect(DB_PATH) as db:
        db.execute(
            """
            CREATE TABLE IF NOT EXISTS leads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                origem TEXT NOT NULL,
                ip TEXT,
                user_agent TEXT
            )
            """
        )


init_db()


@app.route("/")
def index():
    return send_from_directory(BASE_DIR, "index.html")


@app.route("/<path:filename>")
def static_files(filename):
    """Serve style.css, script.js, img/*, etc. diretamente da raiz do projeto."""
    return send_from_directory(BASE_DIR, filename)


@app.route("/ir/whatsapp")
def ir_whatsapp():
    """Registra o clique como lead e redireciona para o WhatsApp."""
    origem = request.args.get("origem", "desconhecida")[:64]
    mensagem = MESSAGES.get(origem, DEFAULT_MESSAGE)

    db = get_db()
    db.execute(
        "INSERT INTO leads (created_at, origem, ip, user_agent) VALUES (?, ?, ?, ?)",
        (
            datetime.now(timezone.utc).isoformat(),
            origem,
            request.headers.get("X-Forwarded-For", request.remote_addr),
            request.headers.get("User-Agent", ""),
        ),
    )
    db.commit()

    destino = f"https://wa.me/{WHATSAPP_NUMBER}?text={quote(mensagem)}"
    return redirect(destino, code=302)


@app.route("/leads")
def leads():
    """Lista os leads capturados. Protegido por token simples via query string."""
    if not ADMIN_TOKEN or request.args.get("token") != ADMIN_TOKEN:
        return jsonify({"error": "not found"}), 404

    db = get_db()
    rows = db.execute(
        "SELECT id, created_at, origem, ip, user_agent FROM leads ORDER BY id DESC"
    ).fetchall()
    return jsonify([dict(row) for row in rows])


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG") == "1"
    app.run(host="0.0.0.0", port=port, debug=debug)
