(function () {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg';
  const MAP = window.MAP, SITE = window.SITE;
  const LAND = MAP.land;
  const PORT = (function () {
    const o = { vb: [0, -170, 620, 1170] };
    for (const k in LAND) { if (k !== 'vb') o[k] = [LAND[k][1], LAND[k][0]]; }
    o.sharia = [165, 220]; o.data = [165, 780]; o.banking = [455, 220]; o.tech = [455, 780];
    return o;
  })();
  const LANDVB = [-220, 0, 1220, 620];

  /* language */
  function pickLang() {
    try { const s = localStorage.getItem('lang'); if (s === 'ar' || s === 'en') return s; } catch (e) {}
    const q = new URLSearchParams(location.search).get('lang');
    if (q === 'ar' || q === 'en') return q;
    return (navigator.language || '').toLowerCase().startsWith('ar') ? 'ar' : 'en';
  }
  let lang = pickLang(), T = SITE[lang];

  let L, portrait, curVB, tourTimer = null, tourStep = 0, activeDomain = null, openId = null, lastFocus = null;
  const svg = document.getElementById('stage');
  const $ = id => document.getElementById(id);

  function el(tag, attrs, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
  const isPortrait = () => window.innerWidth / Math.max(1, window.innerHeight - 200) < 1.05;

  /* static text */
  function applyText() {
    document.documentElement.lang = lang;
    document.documentElement.dir = T.dir;
    document.title = lang === 'ar' ? 'زيد الداود | التدقيق الشرعي × البيانات × التقنية' : 'Zaid Aldawod | Sharia Audit × Data × Technology';
    $('brandName').textContent = T.name;
    $('brandSub').textContent = T.sub;
    $('h1a').textContent = T.h1a;
    $('h1b').textContent = T.h1b;
    $('prompt').textContent = T.prompt;
    $('tourLabel').textContent = tourTimer ? T.stop : T.tour;
    $('contactBtn').textContent = T.contact;
    $('langBtn').textContent = T.lang;
    $('langBtn').setAttribute('aria-label', lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية');
    $('cvLabel').textContent = T.cv;
    svg.setAttribute('aria-label', T.mapLabel);
    buildChips(); buildCards();
  }

  /* map */
  function build(first) {
    portrait = isPortrait();
    L = portrait ? PORT : Object.assign({}, LAND, { vb: LANDVB });
    curVB = L.vb.slice();
    svg.innerHTML = '';
    svg.setAttribute('viewBox', curVB.join(' '));
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    const fs = portrait ? { d: 27, c: 21, off: 44 } : { d: 24, c: 16, off: 36 };

    const defs = el('defs', {}, svg);
    const f = el('filter', { id: 'glow', x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs);
    el('feGaussianBlur', { stdDeviation: '6', result: 'b' }, f);
    const m = el('feMerge', {}, f); el('feMergeNode', { in: 'b' }, m); el('feMergeNode', { in: 'SourceGraphic' }, m);

    const gE = el('g', {}, svg), gF = el('g', {}, svg), gN = el('g', {}, svg);
    let delay = 0;
    const line = (a, b, cls, key) => {
      const p = el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], class: cls }, gE);
      if (key) p.dataset.k = key;
      if (first && !reduce) { p.classList.add('draw'); p.style.setProperty('--len', Math.hypot(b[0] - a[0], b[1] - a[1])); p.style.setProperty('--d', (delay += 0.05) + 's'); }
    };
    MAP.domains.forEach(d => line(L.C, L[d], 'edge spoke'));
    MAP.cases.forEach(c => c.doms.forEach(d => {
      line(L[c.id], L[d], 'edge', 'e-' + c.id + '-' + d);
      const fl = el('line', { x1: L[d][0], y1: L[d][1], x2: L[c.id][0], y2: L[c.id][1], class: 'flow' }, gF);
      fl.dataset.k = 'e-' + c.id + '-' + d;
    }));

    const cg = el('g', { transform: `translate(${L.C[0]} ${L.C[1]})`, class: first && !reduce ? 'pop' : '', style: '--d:.2s' }, gN);
    const sg = el('g', { class: 'center-star' + (reduce ? '' : ' spin') }, cg);
    [46, 30].forEach((r, i) => {
      el('rect', { x: -r, y: -r, width: r * 2, height: r * 2, fill: 'none', stroke: '#C9A961', 'stroke-width': 1, opacity: i ? 0.8 : 0.45 }, sg);
      el('rect', { x: -r, y: -r, width: r * 2, height: r * 2, fill: 'none', stroke: '#C9A961', 'stroke-width': 1, opacity: i ? 0.8 : 0.45, transform: 'rotate(45)' }, sg);
    });
    el('circle', { r: 62, fill: 'none', stroke: '#C9A961', 'stroke-width': 0.8, opacity: 0.25 }, cg);
    el('circle', { r: 5, fill: '#F0D79A', filter: 'url(#glow)' }, cg);

    let i = 0;
    const mk = (id, label, kind) => {
      const [x, y] = L[id];
      const g = el('g', { class: 'node ' + kind + (first && !reduce ? ' pop' : ''), transform: `translate(${x} ${y})`, tabindex: 0, role: 'button', 'aria-label': label }, gN);
      g.style.setProperty('--d', (0.5 + (i++) * 0.08) + 's');
      g.dataset.id = id;
      const R = kind === 'domain' ? (portrait ? 20 : 15) : (portrait ? 13 : 10);
      el('circle', { r: R * 2.6, class: 'halo', filter: 'url(#glow)' }, g);
      el('circle', { r: R, class: 'ring' }, g);
      el('circle', { r: kind === 'domain' ? R * 0.42 : R * 0.36, class: 'core' }, g);
      if (kind === 'domain') el('circle', { r: R + 7, fill: 'none', stroke: '#C9A961', 'stroke-width': 0.7, opacity: 0.5 }, g);
      const ty = (kind === 'domain' && !portrait && y < L.C[1]) ? -(R + 16) : (R + fs.off * (kind === 'domain' ? 0.95 : 0.8));
      el('text', { y: ty, 'text-anchor': 'middle', 'font-size': kind === 'domain' ? fs.d : fs.c }, g).textContent = label;
      g.addEventListener('click', e => { e.stopPropagation(); stopTour(); kind === 'domain' ? focusDomain(id) : openCase(id); });
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); g.dispatchEvent(new Event('click')); } });
    };
    MAP.domains.forEach(d => mk(d, T.domains[d].label, 'domain'));
    MAP.cases.forEach(c => mk(c.id, T.cases[c.id].short, 'case'));
    if (activeDomain) highlightDomain(activeDomain, false);
    if (openId) highlightCase(openId);
  }

  /* highlighting */
  function clearHL() { svg.querySelectorAll('.on,.dim').forEach(n => n.classList.remove('on', 'dim')); }
  function highlightCase(id) {
    clearHL();
    const c = MAP.cases.find(x => x.id === id);
    svg.querySelectorAll('.node').forEach(n => { const k = n.dataset.id; n.classList.add(k === id || c.doms.includes(k) ? 'on' : 'dim'); });
    svg.querySelectorAll('.edge:not(.spoke)').forEach(e => e.classList.add(c.doms.some(d => e.dataset.k === 'e-' + id + '-' + d) ? 'on' : 'dim'));
    svg.querySelectorAll('.flow').forEach(e => { if (c.doms.some(d => e.dataset.k === 'e-' + id + '-' + d)) e.classList.add('on'); });
  }
  function highlightDomain(d, zoom) {
    clearHL();
    const ids = MAP.cases.filter(c => c.doms.includes(d)).map(c => c.id);
    svg.querySelectorAll('.node').forEach(n => { const k = n.dataset.id; n.classList.add(k === d || ids.includes(k) ? 'on' : 'dim'); });
    svg.querySelectorAll('.edge:not(.spoke)').forEach(e => e.classList.add(e.dataset.k && e.dataset.k.endsWith('-' + d) ? 'on' : 'dim'));
    svg.querySelectorAll('.flow').forEach(e => { if (e.dataset.k.endsWith('-' + d)) e.classList.add('on'); });
    if (!zoom) return;
    const pts = [L[d], ...ids.map(i => L[i])];
    let x0 = Math.min(...pts.map(p => p[0])), x1 = Math.max(...pts.map(p => p[0])), y0 = Math.min(...pts.map(p => p[1])), y1 = Math.max(...pts.map(p => p[1]));
    const pad = portrait ? 110 : 120; x0 -= pad; x1 += pad; y0 -= pad; y1 += pad * 1.2;
    const W = L.vb[2], H = L.vb[3], ar = W / H;
    let w = x1 - x0, h = y1 - y0;
    if (w / h < ar) { const nw = h * ar; x0 -= (nw - w) / 2; w = nw; } else { const nh = w / ar; y0 -= (nh - h) / 2; h = nh; }
    const OX = L.vb[0], OY = L.vb[1];
    w = Math.min(w, W); h = Math.min(h, H); x0 = Math.max(OX, Math.min(x0, OX + W - w)); y0 = Math.max(OY, Math.min(y0, OY + H - h));
    animVB([x0, y0, w, h]);
  }
  function animVB(to) {
    const from = curVB.slice();
    if (reduce) { curVB = to; svg.setAttribute('viewBox', to.join(' ')); return; }
    const t0 = performance.now(), D = 750;
    (function step(t) {
      const k = Math.min(1, (t - t0) / D), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      curVB = from.map((v, i) => v + (to[i] - v) * e); svg.setAttribute('viewBox', curVB.join(' '));
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }
  function resetView() { activeDomain = null; clearHL(); animVB(L.vb.slice()); setChip('all'); filterCards(null); }
  function focusDomain(d) {
    if (activeDomain === d) { resetView(); return; }
    activeDomain = d; highlightDomain(d, true); setChip(d); filterCards(d); hideHint();
  }

  /* chips + cards */
  const chipsEl = $('chips'), cardsEl = $('cards');
  function buildChips() {
    chipsEl.innerHTML = '';
    const mkChip = (key, label) => {
      const b = document.createElement('button'); b.className = 'chip'; b.type = 'button'; b.textContent = label; b.dataset.k = key;
      b.setAttribute('aria-pressed', 'false');
      b.onclick = () => { stopTour(); key === 'all' ? resetView() : focusDomain(key); };
      chipsEl.appendChild(b);
    };
    mkChip('all', T.all); MAP.domains.forEach(d => mkChip(d, T.domains[d].label));
    setChip(activeDomain || 'all');
  }
  function setChip(k) { chipsEl.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', String(c.dataset.k === k))); }
  function buildCards() {
    cardsEl.innerHTML = '';
    MAP.cases.forEach(c => {
      const t = T.cases[c.id];
      const b = document.createElement('button'); b.className = 'card'; b.type = 'button'; b.dataset.id = c.id;
      b.innerHTML = `<div class="k"></div><div class="t"></div><div class="s"></div>`;
      b.querySelector('.k').textContent = t.org; b.querySelector('.t').textContent = t.title; b.querySelector('.s').textContent = t.tag;
      b.onclick = () => { stopTour(); openCase(c.id); };
      b.onmouseenter = () => { if (!openId) highlightCase(c.id); };
      b.onmouseleave = () => { if (!openId) { activeDomain ? highlightDomain(activeDomain, false) : clearHL(); } };
      cardsEl.appendChild(b);
    });
    filterCards(activeDomain);
  }
  function filterCards(d) {
    cardsEl.querySelectorAll('.card').forEach(c => { const cs = MAP.cases.find(x => x.id === c.dataset.id); c.classList.toggle('off', !!d && !cs.doms.includes(d)); });
    cardsEl.scrollTo({ left: 0, behavior: reduce ? 'auto' : 'smooth' });
  }

  /* panel */
  const panel = $('panel'), panelIn = $('panelIn'), scrim = $('scrim');
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const closeBtn = () => `<button class="close" type="button" aria-label="${esc(T.close)}"><svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>`;
  function openPanel(html) {
    if (!panel.classList.contains('show')) lastFocus = document.activeElement;
    panelIn.innerHTML = '<div class="grab" aria-hidden="true"></div>' + html;
    panel.classList.add('show'); scrim.classList.add('show'); panel.setAttribute('aria-hidden', 'false'); panel.scrollTop = 0;
    const cl = panelIn.querySelector('.close'); if (cl) { cl.addEventListener('click', closePanel); setTimeout(() => cl.focus({ preventScroll: true }), 60); }
  }
  function closePanel() {
    if (!panel.classList.contains('show')) return;
    panel.classList.remove('show'); scrim.classList.remove('show'); panel.setAttribute('aria-hidden', 'true');
    openId = null; activeDomain ? highlightDomain(activeDomain, false) : clearHL();
    simT.forEach(clearTimeout);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  scrim.onclick = closePanel;
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePanel(); });
  let sy = null;
  panel.addEventListener('touchstart', e => { if (panel.scrollTop <= 0) sy = e.touches[0].clientY; }, { passive: true });
  panel.addEventListener('touchmove', e => { if (sy !== null && e.touches[0].clientY - sy > 90) { sy = null; closePanel(); } }, { passive: true });
  panel.addEventListener('touchend', () => { sy = null; });

  function openCase(id) {
    hideHint(); openId = id; highlightCase(id);
    const c = MAP.cases.find(x => x.id === id), t = T.cases[id];
    const doms = c.doms.map(d => `<span>${esc(T.domains[d].label)}</span>`).join('');
    openPanel(`
      <div class="p-top"><div class="p-k">${esc(t.org)} · ${esc(t.tag)}</div>${closeBtn()}</div>
      <h2 class="p-title" id="pTitle">${esc(t.title)}</h2>
      <div class="p-doms">${doms}</div>
      <div class="sec"><h3>${esc(T.secProblem)}</h3><p>${esc(t.problem)}</p></div>
      <div class="sec"><h3>${esc(T.secBuilt)}</h3><p>${esc(t.built)}</p>${c.sim ? simHTML() : ''}</div>
      ${t.hard ? `<div class="sec"><h3>${esc(T.secHard)}</h3><p>${esc(t.hard)}</p></div>` : ''}
      <div class="sec"><h3>${esc(T.secResult)}</h3><p>${esc(t.result)}</p></div>`);
    if (c.sim) runSim();
  }

  function simHTML() {
    return `<div class="sim">
      <div class="sim-flow">
        <div class="srcs">${T.simSources.map(s => `<div class="src">${esc(s)}</div>`).join('')}</div>
        <div class="pipe" id="pipe"><i></i></div>
        <div class="coreb"><b>${esc(T.simCore)}</b><span>${esc(T.simCoreSub)}</span></div>
      </div>
      <table class="tbl"><thead><tr><th>${esc(T.simHead[0])}</th><th class="r">${esc(T.simHead[1])}</th><th class="r">${esc(T.simHead[2])}</th><th class="r">${esc(T.simHead[3])}</th></tr></thead><tbody id="simRows"></tbody></table>
      <p class="note">${esc(T.simNote)}</p>
      <button class="btn replay" type="button" id="replay">${esc(T.replay)}</button>
    </div>`;
  }
  const ROWS = [['SAV-1042', '40%', '40%', 0], ['SAV-1187', '40%', '40%', 0], ['TD-0311', '55%', '55%', 0], ['SAV-1203', '40%', '36%', 1], ['TD-0420', '55%', '55%', 0]];
  let simT = [];
  function runSim() {
    simT.forEach(clearTimeout); simT = [];
    const srcs = panelIn.querySelectorAll('.src'), pipe = panelIn.querySelector('#pipe'), body = panelIn.querySelector('#simRows');
    if (!body) return;
    srcs.forEach(s => s.classList.remove('lit')); pipe.classList.remove('run');
    body.innerHTML = ROWS.map(r => `<tr><td dir="ltr">${r[0]}</td><td class="r">${r[1]}</td><td class="r">${r[2]}</td><td class="r"><span class="st">${esc(T.simChecking)}</span></td></tr>`).join('');
    const at = (fn, ms) => simT.push(setTimeout(fn, reduce ? 0 : ms));
    srcs.forEach((s, i) => at(() => s.classList.add('lit'), 300 + i * 250));
    at(() => pipe.classList.add('run'), 1000);
    body.querySelectorAll('tr').forEach((tr, i) => {
      at(() => tr.classList.add('in'), 1400 + i * 260);
      at(() => { const st = tr.querySelector('.st'), flag = ROWS[i][3]; st.className = 'st ' + (flag ? 'flag' : 'ok'); st.textContent = flag ? T.simFlag : T.simOk; }, 2300 + i * 300);
    });
    at(() => pipe.classList.remove('run'), 2300 + ROWS.length * 300 + 300);
    const rp = panelIn.querySelector('#replay'); if (rp) rp.onclick = runSim;
  }

  /* contact */
  $('contactBtn').onclick = () => {
    stopTour(); openId = null;
    openPanel(`
      <div class="p-top"><div class="p-k">${esc(T.contact)}</div>${closeBtn()}</div>
      <h2 class="p-title" id="pTitle">${esc(T.contactTitle)}</h2>
      <div class="sec contact">
        <p>${esc(T.emailL)}: <a href="mailto:aldawodzaid@gmail.com" dir="ltr">aldawodzaid@gmail.com</a></p>
        <p>${esc(T.linkedinL)}: <a href="https://www.linkedin.com/in/zaid-aldawood-a03186187" target="_blank" rel="noopener" dir="ltr">linkedin.com/in/zaid-aldawood-a03186187</a></p>
        <p class="cvrow"><a class="btn gold cv" href="assets/Zaid-Aldawod-CV.pdf" download>${esc(T.cvLink)}</a></p>
      </div>`);
  };

  /* hint */
  const hint = $('hint');
  function hideHint() { hint.style.opacity = '0'; }
  svg.addEventListener('click', () => { if (!openId && activeDomain) resetView(); });

  /* tour */
  const cap = $('caption'), capText = $('capText'), capBar = $('capBar');
  const STEP_MS = 2600;
  function steps() {
    return [{ t: T.tourIntro },
      ...MAP.domains.map(d => ({ d, t: `<b>${esc(T.domains[d].label)}.</b> ${esc(T.domains[d].blurb)}` })),
      ...MAP.cases.map(c => ({ c: c.id, t: `<b>${esc(T.cases[c.id].title)}.</b> ${esc(T.cases[c.id].tour)}` })),
      { t: T.tourEnd }];
  }
  function startTour() {
    closePanel(); hideHint(); stopTour(true); tourStep = 0; cap.classList.add('show');
    $('tourLabel').textContent = T.stop; runStep();
  }
  function runStep() {
    const S = steps();
    if (tourStep >= S.length) { stopTour(); return; }
    const s = S[tourStep]; capText.innerHTML = s.t;
    if (s.d) { activeDomain = null; highlightDomain(s.d, true); } else if (s.c) { animVB(L.vb.slice()); highlightCase(s.c); } else { clearHL(); animVB(L.vb.slice()); }
    capBar.style.transition = 'none'; capBar.style.width = '0'; void capBar.offsetWidth;
    capBar.style.transition = `width ${STEP_MS}ms linear`; capBar.style.width = '100%';
    tourStep++; tourTimer = setTimeout(runStep, STEP_MS);
  }
  function stopTour(silent) {
    const was = !!tourTimer;
    if (tourTimer) { clearTimeout(tourTimer); tourTimer = null; }
    cap.classList.remove('show'); $('tourLabel').textContent = T.tour;
    if (!silent && was) { activeDomain = null; clearHL(); animVB(L.vb.slice()); setChip('all'); filterCards(null); }
  }
  $('tourBtn').onclick = () => { tourTimer ? stopTour() : startTour(); };

  /* language switch */
  $('langBtn').onclick = () => {
    lang = lang === 'ar' ? 'en' : 'ar'; T = SITE[lang];
    try { localStorage.setItem('lang', lang); } catch (e) {}
    stopTour(true); closePanel(); applyText(); build(false);
  };

  /* init */
  applyText();
  build(true);
  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (isPortrait() !== portrait) build(false); }, 150); });
})();
