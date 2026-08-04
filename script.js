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
      'Plataforma: Instagram / Facebook / TikTok',
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
  const revealTargets = document.querySelectorAll('.hero__content, .hero__terminal, .tracker__step, .specialist__inner');
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
     5) RASTREAMENTO DE CONVERSÃO — GA4 + Meta Pixel
     Disparado no clique, antes de o link seguir para o
     backend (/ir/whatsapp), que registra o lead e redireciona.
     ----------------------------------------------------- */
  const siteConfig = window.SITE_CONFIG || {};
  const isPlaceholder = (value, placeholder) => !value || value === placeholder;

  const gaReady = !isPlaceholder(siteConfig.GA_MEASUREMENT_ID, 'G-XXXXXXXXXX');
  const pixelReady = !isPlaceholder(siteConfig.META_PIXEL_ID, '0000000000000000');

  document.querySelectorAll('a[href*="/ir/whatsapp"]').forEach((link) => {
    link.addEventListener('click', () => {
      const url = new URL(link.href, window.location.origin);
      const origem = url.searchParams.get('origem') || link.id || 'desconhecida';
      console.log('[Conversão] Clique em CTA do WhatsApp:', origem);

      if (gaReady && typeof window.gtag === 'function') {
        window.gtag('event', 'click_whatsapp', { event_category: 'conversao', event_label: origem });
      }

      if (pixelReady && typeof window.fbq === 'function') {
        window.fbq('track', 'Contact', { content_name: origem });
      }
    });
  });

});
