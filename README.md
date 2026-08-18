# Wagner Neri — Recuperação de Contas de Redes Sociais

Landing page de alta conversão para captação de clientes com contas de redes
sociais (Instagram, WhatsApp, Facebook, TikTok) suspensas, banidas ou hackeadas,
com foco em atendimento via WhatsApp.

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
    ├── robots.txt
    ├── sitemap.xml
    └── img/
        ├── wagner-neri.jpg
        └── acesso-recuperado.png   # OG / compartilhamento Ads
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

## Rastreamento de leads e tráfego pago

Todo clique nos botões de WhatsApp passa por `/ir/whatsapp?origem=<local>`,
que:

1. Grava um log mínimo (`lead_click origem=... attrs=...`) sem IP/UA completos.
   Na Vercel: **Project → Logs** (Runtime Logs).
2. Redireciona (302) **somente** para `https://wa.me/<número fixo>` (allowlist
   de host/telefone — sem open redirect).
3. Anexa à mensagem um sufixo curto com UTMs/clids sanitizados, quando presentes.

No cliente (`window.SITE_CONFIG` em `public/index.html`), no clique (antes do
redirect):

| Ferramenta | IDs | Eventos no clique WhatsApp |
|---|---|---|
| GA4 | `G-R6XH5W3PJZ` | `click_whatsapp`, `generate_lead` |
| Meta Pixel | `207714888442557` | `Contact`, `Lead` |
| Google Ads | `GOOGLE_ADS_ID` + `GOOGLE_ADS_CONVERSION_LABEL` | `conversion` (só com rótulo) |

**O que o cliente precisa fornecer para Ads:** o ID `AW-…` e o rótulo da
conversão de clique no WhatsApp. Enquanto o ID for placeholder
(`AW-XXXXXXXXXX`), use os eventos GA4 importados no painel do Ads
(vinculação GA4 ↔ Google Ads).

UTMs e `gclid`/`gbraid`/`wbraid`/`fbclid` são capturados em `sessionStorage`,
enviados aos eventos e passados ao backend de forma sanitizada.

SEO: meta/OG/Twitter, `robots.txt`, `sitemap.xml` e JSON-LD
(Person + ProfessionalService — sem claim de OAB/Attorney).
