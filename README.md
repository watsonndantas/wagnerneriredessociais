# Wagner Neri — Recuperação de Contas de Redes Sociais

Landing page de alta conversão para captação de clientes com contas de redes
sociais (Instagram, Facebook, TikTok) suspensas, banidas ou hackeadas, com
foco em atendimento via WhatsApp.

## Stack

- **Frontend:** HTML5 + CSS3 + JavaScript puro (sem frameworks, sem fontes
  externas — leve e rápida). Arquivos em `public/`.
- **Backend:** Python (Flask), rodando como Vercel Function — cuida apenas
  da rota `/ir/whatsapp`, que registra o clique (log) e redireciona o
  visitante para o WhatsApp com a mensagem correta.

## Estrutura

```
├── app.py            # Backend Flask (rota /ir/whatsapp + servidor local de dev)
├── vercel.json        # Configuração da função Python na Vercel
├── requirements.txt   # Dependências Python
└── public/
    ├── index.html
    ├── style.css
    ├── script.js
    └── img/            # Foto do especialista (wagner-neri.jpg)
```

## Como rodar localmente

```bash
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Acesse http://localhost:5000

## Deploy na Vercel

O projeto já está pronto para deploy "zero-config" na Vercel:

1. Suba o código para um repositório no GitHub.
2. Em https://vercel.com/new, importe o repositório.
3. A Vercel detecta automaticamente o Flask (`app.py`) e o diretório
   `public/` — não é necessário configurar build command nem output.
4. Clique em **Deploy**.

Os arquivos em `public/` são servidos direto pela CDN da Vercel. Apenas a
rota `/ir/whatsapp` roda como função Python (Vercel Function).

### Domínio próprio

Depois do primeiro deploy, em **Project Settings → Domains**, adicione
`wagnerneriredessociais.com.br` e siga as instruções de DNS exibidas pela
Vercel (registro A ou CNAME, conforme o seu provedor de domínio).

## Rastreamento de leads

Todo clique nos botões de WhatsApp passa por `/ir/whatsapp?origem=<local>`,
que:

1. Grava um log estruturado (`lead_click origem=... ip=... user_agent=...`).
   Na Vercel, esses logs aparecem em **Project → Logs** (Runtime Logs).
   > Funções serverless não têm disco persistente, por isso os leads não
   > ficam em um banco de dados local — os logs da Vercel são a fonte de
   > registro dos cliques no backend.
2. Redireciona (302) para o WhatsApp com a mensagem correta para o contexto
   do botão clicado.

A fonte principal de métricas de conversão, porém, são o **Google Analytics
4** e o **Meta Pixel** (evento `click_whatsapp` / `Contact`), configurados
em `window.SITE_CONFIG` no `<head>` do `public/index.html` — eles funcionam
independentemente do backend e têm painéis próprios para acompanhar os
cliques ao longo do tempo.

Se no futuro for necessário um histórico de leads pesquisável (não apenas
logs), a Vercel oferece integrações de armazenamento (Postgres, KV) que
podem ser conectadas à função sem mudar o restante do site.
