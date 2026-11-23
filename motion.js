'use strict';
// PMV — animações extras: títulos palavra por palavra, contadores, barras, faixa,
// cartões 3D, botões magnéticos e brilho do mouse. Leve: só transform/opacity.
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  document.documentElement.classList.add('motion-on');

  const onVisible = (els, cb, opts = {threshold: .25}) => {
    if (!('IntersectionObserver' in window)) { els.forEach(cb); return; }
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { cb(e.target); io.unobserve(e.target); }
    }), opts);
    els.forEach(el => io.observe(el));
  };

  /* ---- Títulos: separa em palavras (mantém <br>, e o gradiente vira uma peça só) ---- */
  const splitWords = root => {
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const parts = n.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach(p => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            const s = document.createElement('span'); s.className = 'w'; s.style.setProperty('--i', i++); s.textContent = p;
            frag.appendChild(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') {
          if (n.classList.contains('gradient-text')) { n.classList.add('w'); n.style.setProperty('--i', i++); }
          else walk(n);
        }
      });
    };
    walk(root);
  };
  const heads = [...document.querySelectorAll('.hero-copy h1, .section h2, .vt-caption h2')]
    .filter(h => !h.closest('.jn'));
  heads.forEach(h => { h.setAttribute('aria-label', h.textContent.replace(/\s+/g, ' ').trim()); splitWords(h); });
  const heroH1 = document.querySelector('.hero-copy h1');
  if (heroH1) setTimeout(() => heroH1.classList.add('words-in'), 150);
  onVisible(heads.filter(h => h !== heroH1 && !h.closest('.vt')), h => h.classList.add('words-in'));
  // na vitrine o título aparece quando a legenda liga
  document.querySelectorAll('.vt-caption').forEach(cap => {
    const h = cap.querySelector('h2'); if (!h) return;
    new MutationObserver(() => h.classList.toggle('words-in', cap.classList.contains('is-on'))).observe(cap, {attributes: true, attributeFilter: ['class']});
  });

  /* ---- Rótulos com traço ---- */
  document.querySelectorAll('.section .overline').forEach(o => o.classList.add('m-line'));
  onVisible([...document.querySelectorAll('.overline.m-line')], o => o.classList.add('is-visible'));

  /* ---- Barras que crescem ---- */
  const bars = [...document.querySelectorAll('.showcase-bars, .vt-bars, .deco-bars')];
  bars.forEach(b => { b.classList.add('m-bars'); [...b.children].forEach((c, i) => c.style.setProperty('--i', i)); });
  onVisible(bars, b => b.classList.add('m-grow'), {threshold: .3});

  /* ---- Números contando ---- */
  const nums = [...document.querySelectorAll('.showcase-card strong, .vt-stats b')]
    .filter(el => /\d/.test(el.textContent) && !el.children.length);
  const fmt = new Intl.NumberFormat('pt-BR');
  onVisible(nums, el => {
    const txt = el.textContent, m = txt.match(/\d[\d.]*/); if (!m) return;
    const target = parseInt(m[0].replace(/\./g, ''), 10); if (!target) return;
    const pre = txt.slice(0, m.index), post = txt.slice(m.index + m[0].length);
    const t0 = performance.now(), dur = 1400;
    const tick = now => {
      const k = Math.min(1, (now - t0) / dur), v = Math.round(target * (1 - Math.pow(1 - k, 3)));
      el.textContent = pre + fmt.format(v) + post;
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, {threshold: .5});

  /* ---- Faixa de serviços entre o topo e as soluções ---- */
  const sol = document.querySelector('#solucoes');
  if (sol && !document.querySelector('.m-marquee')) {
    const words = ['Sites profissionais', 'Sistemas sob medida', 'Automações', 'Dashboards', 'Manutenção', 'Integrações'];
    const band = document.createElement('div'); band.className = 'm-marquee'; band.setAttribute('aria-hidden', 'true');
    const track = document.createElement('div'); track.className = 'm-marquee-track';
    for (let r = 0; r < 2; r++) words.forEach(w => { const s = document.createElement('span'); s.textContent = w; s.appendChild(document.createElement('i')); track.appendChild(s); });
    band.appendChild(track); sol.before(band);
  }

  if (!fine) return; // daqui pra baixo: efeitos de mouse, só no computador

  /* ---- Cartões em 3D seguindo o mouse ---- */
  document.querySelectorAll('.service-card, .step-card, .showcase-card').forEach(card => {
    card.classList.add('m-tilt');
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      card.classList.add('m-tilting');
      card.style.setProperty('--ry', `${(x * 8).toFixed(2)}deg`); card.style.setProperty('--rx', `${(-y * 8).toFixed(2)}deg`);
    }, {passive: true});
    card.addEventListener('pointerleave', () => { card.classList.remove('m-tilting'); card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); });
  });

  /* ---- Botões magnéticos ---- */
  document.querySelectorAll('.btn').forEach(btn => {
    btn.classList.add('m-magnet');
    btn.addEventListener('pointermove', e => {
      const r = btn.getBoundingClientRect();
      btn.style.transform = `translate(${((e.clientX - r.left) / r.width - .5) * 10}px, ${((e.clientY - r.top) / r.height - .5) * 8}px)`;
    }, {passive: true});
    btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
  });

  /* ---- Brilho que segue o mouse ---- */
  const glow = document.createElement('div'); glow.className = 'm-cursor'; document.body.appendChild(glow);
  let gx = innerWidth / 2, gy = innerHeight / 2, cx = gx, cy = gy, running = false;
  const loop = () => {
    cx += (gx - cx) * .15; cy += (gy - cy) * .15;
    glow.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    if (Math.abs(gx - cx) + Math.abs(gy - cy) > .5) requestAnimationFrame(loop); else running = false;
  };
  addEventListener('pointermove', e => {
    gx = e.clientX; gy = e.clientY; glow.classList.add('on');
    if (!running) { running = true; requestAnimationFrame(loop); }
  }, {passive: true});
  document.addEventListener('pointerleave', () => glow.classList.remove('on'));
})();
