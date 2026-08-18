/* =========================================================
   Wagner Neri — Recuperação de Contas de Redes Sociais
   Vanilla JS — sem dependências externas
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -----------------------------------------------------
     1) TERMINAL DE DIAGNÓSTICO — efeito de digitação
     ----------------------------------------------------- */
  const terminalOutput = document.getElementById('terminal-output');

  if (terminalOutput) {
    const LINES = [
      '$ verificar --conta',
      'Plataforma: Instagram / WhatsApp / Facebook / TikTok',
      'Status: SUSPENSA ⚠',
      'Diagnóstico: bloqueio sem contraditório',
      'Ação recomendada: medida judicial (liminar)',
      '$ iniciar_recuperacao.sh',
      'Status: RECUPERADA ✔',
      'Aguardando seu contato…'
    ];

    const highlight = (el) => {
      el.innerHTML = el.textContent
        .replace(/SUSPENSA/g, '<span class="terminal__hl--danger">SUSPENSA</span>')
        .replace(/RECUPERADA/g, '<span class="terminal__hl--success">RECUPERADA</span>')
        .replace(/liminar/gi, '<span class="terminal__hl--success">liminar</span>');
    };

    const typeLine = (text, el, onDone) => {
      let i = 0;
      const id = setInterval(() => {
        el.textContent = text.slice(0, i + 1);
        i += 1;
        if (i >= text.length) {
          clearInterval(id);
          onDone();
        }
      }, 26);
    };

    const renderInstant = () => {
      terminalOutput.innerHTML = '';
      LINES.forEach((line) => {
        const div = document.createElement('div');
        div.className = 'terminal__line';
        div.textContent = line;
        terminalOutput.appendChild(div);
        highlight(div);
      });
    };

    if (prefersReducedMotion) {
      renderInstant();
    } else {
      let lineIndex = 0;

      const nextLine = () => {
        if (lineIndex >= LINES.length) {
          window.setTimeout(() => {
            terminalOutput.innerHTML = '';
            lineIndex = 0;
            nextLine();
          }, 2600);
          return;
        }

        const div = document.createElement('div');
        div.className = 'terminal__line';
        terminalOutput.appendChild(div);

        typeLine(LINES[lineIndex], div, () => {
          highlight(div);
          lineIndex += 1;
          window.setTimeout(nextLine, 420);
        });
      };

      nextLine();
    }
  }

  /* -----------------------------------------------------
     2) BOTÃO FLUTUANTE DO WHATSAPP — animação de "pulo"
     ----------------------------------------------------- */
  const whatsappButton = document.getElementById('whatsapp-float');

  if (whatsappButton) {
    const BOUNCE_INTERVAL_MS = 5000;
    const BOUNCE_DURATION_MS = 600;

    const triggerBounce = () => {
      whatsappButton.classList.add('bounce');
      window.setTimeout(() => whatsappButton.classList.remove('bounce'), BOUNCE_DURATION_MS);
    };

    if (!prefersReducedMotion) {
      window.setInterval(triggerBounce, BOUNCE_INTERVAL_MS);
    }
  }

  /* -----------------------------------------------------
     3) MODAL — Política de Privacidade
     ----------------------------------------------------- */
  const privacyLink = document.getElementById('privacy-link');
  const privacyModal = document.getElementById('privacy-modal');

  const openModal = () => {
    if (!privacyModal) return;
    privacyModal.classList.add('is-open');
    privacyModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    if (!privacyModal) return;
    privacyModal.classList.remove('is-open');
    privacyModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  if (privacyLink) {
    privacyLink.addEventListener('click', (event) => {
      event.preventDefault();
      openModal();
    });
  }

  document.querySelectorAll('[data-close-modal]').forEach((el) => {
    el.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeModal();
  });

  /* -----------------------------------------------------
     4) SCROLL REVEAL — entrada sutil das seções
     ----------------------------------------------------- */
  const revealTargets = document.querySelectorAll(
    '.hero__content, .hero__visual, .strategy__inner, .specialist__inner'
  );
  revealTargets.forEach((el) => el.classList.add('reveal'));

  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealTargets.forEach((el) => observer.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add('is-visible'));
  }

  /* -----------------------------------------------------
     5) ATRIBUIÇÃO DE CAMPANHA (UTM + clids) — tráfego pago
     ----------------------------------------------------- */
  const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  const CLICK_ID_KEYS = ['gclid', 'gbraid', 'wbraid', 'fbclid'];
  const ATTR_KEYS = UTM_KEYS.concat(CLICK_ID_KEYS);
  const ATTR_STORAGE_KEY = 'wn_utm_params';
  const MAX_ATTR_VALUE_LEN = 80;

  const sanitizeAttrValue = (value) => {
    if (value == null) return '';
    const asString = String(value).replace(/[\u0000-\u001F\u007F]/g, '').trim();
    if (!asString) return '';
    return asString.length > MAX_ATTR_VALUE_LEN
      ? asString.slice(0, MAX_ATTR_VALUE_LEN)
      : asString;
  };

  const sanitizeAttrObject = (raw) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    const clean = {};
    ATTR_KEYS.forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(raw, key)) return;
      const value = sanitizeAttrValue(raw[key]);
      if (value) clean[key] = value;
    });
    return clean;
  };

  const readAttrFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const attr = {};
    ATTR_KEYS.forEach((key) => {
      const value = sanitizeAttrValue(params.get(key));
      if (value) attr[key] = value;
    });
    return attr;
  };

  const readAttrFromStorage = () => {
    try {
      const stored = sessionStorage.getItem(ATTR_STORAGE_KEY);
      if (!stored) return {};
      return sanitizeAttrObject(JSON.parse(stored));
    } catch (e) {
      return {};
    }
  };

  let utmParams = {};
  try {
    const fromUrl = readAttrFromUrl();
    if (Object.keys(fromUrl).length) {
      utmParams = Object.assign({}, readAttrFromStorage(), fromUrl);
      sessionStorage.setItem(ATTR_STORAGE_KEY, JSON.stringify(utmParams));
    } else {
      utmParams = readAttrFromStorage();
    }
  } catch (e) {
    // sessionStorage indisponível — segue sem atribuição
  }

  const attributionForEvents = () => Object.assign({}, utmParams);

  /* DKI leve: só troca o badge por rótulos fixos (nunca injeta o termo cru) */
  const KEYWORD_BADGES = [
    { match: /whatsapp/i, label: 'Especialista em WhatsApp banido' },
    { match: /facebook/i, label: 'Especialista em recuperação de Facebook' },
    { match: /instagram/i, label: 'Especialista em recuperação de Instagram' },
    { match: /tiktok/i, label: 'Especialista em recuperação de TikTok' },
    { match: /banid|banimento/i, label: 'Especialista em conta banida' },
    { match: /suspens/i, label: 'Especialista em conta suspensa' },
    { match: /hack|invad|roubad|clonad/i, label: 'Especialista em conta hackeada' },
  ];

  const adKeyword = (() => {
    const params = new URLSearchParams(window.location.search);
    return sanitizeAttrValue(
      params.get('utm_term') || params.get('kw') || utmParams.utm_term || ''
    );
  })();

  if (adKeyword) {
    const badgeEl = document.getElementById('hero-badge');
    const matchedBadge = KEYWORD_BADGES.find((entry) => entry.match.test(adKeyword));
    if (badgeEl && matchedBadge) {
      badgeEl.textContent = matchedBadge.label;
    }
  }

  /* -----------------------------------------------------
     6) RASTREAMENTO DE CONVERSÃO — GA4 + Meta + Google Ads
     Dispara no clique, ANTES do redirect /ir/whatsapp.
     Atribuição sanitizada vai na query do backend (sufixo
     da mensagem WhatsApp é montado no servidor).
     ----------------------------------------------------- */
  const siteConfig = window.SITE_CONFIG || {};
  const isPlaceholder = (value, placeholder) => !value || value === placeholder;

  const gaReady = !isPlaceholder(siteConfig.GA_MEASUREMENT_ID, 'G-XXXXXXXXXX');
  const pixelReady = !isPlaceholder(siteConfig.META_PIXEL_ID, '0000000000000000');
  const adsReady = !isPlaceholder(siteConfig.GOOGLE_ADS_ID, 'AW-XXXXXXXXXX');
  const adsConversionLabel = (siteConfig.GOOGLE_ADS_CONVERSION_LABEL || '').trim();

  if (!adsReady) {
    console.info(
      '[Google Ads] GOOGLE_ADS_ID ainda é placeholder (AW-XXXXXXXXXX). ' +
      'Cole o ID real em SITE_CONFIG. Enquanto isso, use click_whatsapp / generate_lead no GA4.'
    );
  } else if (!adsConversionLabel) {
    console.info(
      '[Google Ads] Remarketing ativo. GOOGLE_ADS_CONVERSION_LABEL vazio — ' +
      'cole o rótulo ou importe generate_lead / click_whatsapp do GA4.'
    );
  }

  document.querySelectorAll('a[href*="/ir/whatsapp"]').forEach((link) => {
    if (!link.dataset.baseHref) {
      link.dataset.baseHref = link.getAttribute('href') || '';
    }

    link.addEventListener('click', () => {
      const url = new URL(link.dataset.baseHref, window.location.origin);
      const origem = url.searchParams.get('origem') || link.id || 'desconhecida';
      const attr = attributionForEvents();
      const ctaLabel = link.id || origem;

      // Anexa UTMs/clids sanitizados à rota do backend (não altera host/destino)
      ATTR_KEYS.forEach((key) => {
        if (attr[key]) url.searchParams.set(key, attr[key]);
      });
      link.href = url.pathname + url.search;

      console.log('[Conversão] Clique em CTA do WhatsApp:', ctaLabel);

      if (gaReady && typeof window.gtag === 'function') {
        window.gtag('event', 'click_whatsapp', {
          event_category: 'conversao',
          event_label: ctaLabel,
          ...attr,
        });
        window.gtag('event', 'generate_lead', {
          event_category: 'conversao',
          event_label: ctaLabel,
          currency: 'BRL',
          value: 0,
          ...attr,
        });
      }

      if (adsReady && adsConversionLabel && typeof window.gtag === 'function') {
        window.gtag('event', 'conversion', {
          send_to: `${siteConfig.GOOGLE_ADS_ID}/${adsConversionLabel}`,
          event_category: 'conversao',
          event_label: ctaLabel,
        });
      }

      if (pixelReady && typeof window.fbq === 'function') {
        window.fbq('track', 'Contact', { content_name: ctaLabel, ...attr });
        window.fbq('track', 'Lead', { content_name: ctaLabel, ...attr });
      }
    });
  });

});
