# Wagner Neri — Recuperação de Contas de Redes Sociais

Landing page de alta conversão para captação de clientes com contas de redes
sociais (Instagram, Facebook, TikTok) suspensas, banidas ou hackeadas, com
foco em atendimento via WhatsApp.

## Stack

- **Frontend:** HTML5 + CSS3 + JavaScript puro (sem frameworks, sem fontes
  externas — leve e rápido).
- **Backend:** Python (Flask) — serve os arquivos estáticos e registra os
  cliques no botão do WhatsApp como leads (SQLite) antes de redirecionar o
  visitante para o WhatsApp.

## Como rodar localmente

```bash
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Acesse http://localhost:5000

## Estrutura

```
├── app.py            # Backend Flask (serve o site + registra leads)
├── requirements.txt  # Dependências Python
├── index.html
├── style.css
├── script.js
├── img/              # Foto do especialista (adicionar wagner-neri.jpg)
└── leads.db          # Criado automaticamente na primeira execução (SQLite)
```

## Rastreamento de leads

Todo clique nos botões de WhatsApp passa por `/ir/whatsapp?origem=<local>`,
que grava um registro em `leads.db` (data/hora, origem do clique, IP e
user-agent) e então redireciona para o WhatsApp com a mensagem apropriada.

Para consultar os leads capturados, defina a variável de ambiente
`ADMIN_TOKEN` e acesse `/leads?token=<seu-token>` (retorna JSON). Sem essa
variável configurada, o endpoint fica oculto (404).

## Analytics

Os IDs do Google Analytics 4 e do Meta Pixel estão configurados em
`window.SITE_CONFIG`, no `<head>` do `index.html`.

## Deploy em produção

Como o site agora depende de um backend Python, **não é compatível com
GitHub Pages** (que serve apenas conteúdo estático). Para produção, use um
serviço com suporte a Python, por exemplo:

- Render.com
- Railway.app
- PythonAnywhere
- Fly.io
- Uma VPS com Gunicorn + Nginx

Exemplo de execução em produção com Gunicorn:

```bash
pip install gunicorn
gunicorn -w 2 -b 0.0.0.0:8000 app:app
```
