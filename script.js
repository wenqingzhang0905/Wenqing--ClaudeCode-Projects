/* ─── NAV: scroll shadow + mobile menu ─────────────────── */
const nav       = document.getElementById('nav');
const hamburger = document.getElementById('hamburger');
const navMobile = document.getElementById('navMobile');

window.addEventListener('scroll', () => {
  nav.style.borderBottomColor = window.scrollY > 10
    ? 'rgba(61,186,124,0.22)'
    : 'rgba(61,186,124,0.12)';
});

hamburger.addEventListener('click', () => {
  navMobile.classList.toggle('open');
});

// Close mobile nav on link click
navMobile.querySelectorAll('.nav-mobile-link').forEach(link => {
  link.addEventListener('click', () => navMobile.classList.remove('open'));
});

/* ─── ACTIVE NAV LINK on scroll ────────────────────────── */
const sections   = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-links a');

const activateNav = () => {
  let current = '';
  sections.forEach(section => {
    const top = section.offsetTop - 80;
    if (window.scrollY >= top) current = section.id;
  });
  navAnchors.forEach(a => {
    a.style.color = a.getAttribute('href') === `#${current}`
      ? 'var(--text)'
      : '';
  });
};
window.addEventListener('scroll', activateNav);

/* ─── INTERSECTION OBSERVER: fade-up animations ────────── */
const observerFade = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observerFade.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

const fadeTargets = [
  '.section-label', '.section-title', '.section-desc',
  '.info-card', '.timeline-item',
  '.article-card', '.contact-card', '.contact-form',
  '.hero-badge', '.hero-title', '.hero-tagline', '.hero-desc',
  '.hero-actions', '.hero-stats'
];

fadeTargets.forEach(selector => {
  document.querySelectorAll(selector).forEach((el, i) => {
    el.classList.add('fade-up');
    el.style.transitionDelay = `${i * 0.06}s`;
    observerFade.observe(el);
  });
});

/* ─── SMOOTH SCROLL (fallback for older browsers) ──────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* ─── PIXEL FACE ────────────────────────────────────────── */
(function () {
  const canvas = document.getElementById('pixelFace');
  if (!canvas) return;

  const BLOCK = 3;    // 3px grid → denser pixels
  const COLS  = 133;  // 133×3 = 399px canvas
  const ROWS  = 133;
  const SZ    = BLOCK - 1; // 2px visible square, 1px gap

  canvas.width  = COLS * BLOCK;
  canvas.height = ROWS * BLOCK;

  const ctx = canvas.getContext('2d');

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = 'profile.jpg';

  img.onload = () => {
    const off = document.createElement('canvas');
    off.width  = COLS;
    off.height = ROWS;
    const offCtx = off.getContext('2d');
    const s  = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = (img.naturalWidth  - s) / 2;
    const sy = (img.naturalHeight - s) / 2;
    offCtx.drawImage(img, sx, sy, s, s, 0, 0, COLS, ROWS);
    const data = offCtx.getImageData(0, 0, COLS, ROWS).data;

    const pixels = [];
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const i = (y * COLS + x) * 4;
        pixels.push({ x, y, r: data[i], g: data[i+1], b: data[i+2], a: data[i+3]/255 });
      }
    }

    const N = pixels.length;

    // Return a shuffled stagger-delay array spread over `window` ms
    function makeDelays(window) {
      const d = Array.from({length: N}, (_, i) => i * window / N);
      for (let i = N - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [d[i], d[j]] = [d[j], d[i]];
      }
      return d;
    }

    const sparks = new Map(); // index → start time

    // Shared draw — alphas[] is per-pixel [0..1] multiplier
    function draw(alphas, now) {
      const wt = now * 0.00055;

      // ~20 glitter sparks/sec
      if (Math.random() < 0.33) sparks.set(Math.floor(Math.random() * N), now);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < N; i++) {
        const alpha = pixels[i].a * alphas[i];
        if (alpha <= 0.004) continue;

        const p = pixels[i];
        const wave = Math.sin(wt + (p.x + p.y) * 0.055) * 0.08 + 0.92;

        let spark = 1, glit = 0;
        if (sparks.has(i)) {
          const age = (now - sparks.get(i)) / 140;
          if (age >= 1) { sparks.delete(i); }
          else { const f = Math.sin(age * Math.PI); spark = 1 + f * 0.6; glit = f * 0.55; }
        }

        const b = wave * spark;
        const r  = Math.min(255, Math.round(p.r * b + 255 * glit));
        const g  = Math.min(255, Math.round(p.g * b + 255 * glit));
        const bl = Math.min(255, Math.round(p.b * b + 255 * glit));
        ctx.fillStyle = `rgba(${r},${g},${bl},${alpha.toFixed(3)})`;
        ctx.fillRect(p.x * BLOCK, p.y * BLOCK, SZ, SZ);
      }
    }

    const FADE_IN  = 220;  // ms for one pixel to fully appear
    const FADE_OUT = 180;  // ms for one pixel to fully vanish
    const STAGGER  = 1300; // total stagger window
    const IDLE_MS  = 3200; // stay fully visible before dissolving

    function runReveal() {
      const delays = makeDelays(STAGGER);
      const alphas = new Float32Array(N);
      const start  = performance.now();
      function frame(now) {
        let done = true;
        for (let i = 0; i < N; i++) {
          const e = now - start - delays[i];
          alphas[i] = e < 0 ? 0 : Math.min(1, e / FADE_IN);
          if (alphas[i] < 1) done = false;
        }
        draw(alphas, now);
        done ? runIdle(performance.now() + IDLE_MS) : requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    function runIdle(until) {
      const alphas = new Float32Array(N).fill(1);
      function frame(now) {
        draw(alphas, now);
        now >= until ? runDissolve() : requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    function runDissolve() {
      const delays = makeDelays(STAGGER);
      const alphas = new Float32Array(N).fill(1);
      const start  = performance.now();
      function frame(now) {
        let done = true;
        for (let i = 0; i < N; i++) {
          const e = now - start - delays[i];
          alphas[i] = e < 0 ? 1 : Math.max(0, 1 - e / FADE_OUT);
          if (alphas[i] > 0) done = false;
        }
        draw(alphas, now);
        done ? runReveal() : requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    runReveal();
  };
})();

/* ─── ORBIT ABOUT WHEEL ─────────────────────────────────── */
(function initOrbitWheel() {
  const svg   = document.getElementById('orbitSvg');
  const panel = document.getElementById('orbitPanel');
  if (!svg || !panel) return;

  const CX = 200, CY = 200, OR = 152, IR = 86, LABEL_R = 176;
  const SPAN = 116; // 120° segment - 4° gap

  const SEGS = [
    {
      label: 'Climate', color: '#3dba7c', rgb: '61,186,124', mid: 270,
      heading: 'Climate Action',
      body: 'The biggest gap in climate action isn\'t ideas — it\'s the bridge between intention and measurable impact. After pivoting from macro policy at the IMF and World Bank, I joined climate tech to build systems that make carbon accountability real, verifiable, and scalable.',
      tags: ['Carbon Markets', 'MRV Systems', 'Net-Zero Strategy', 'Decarbonization']
    },
    {
      label: 'Capital', color: '#e08030', rgb: '224,128,48', mid: 30,
      heading: 'Capital & Finance',
      body: 'Years at the IMF and World Bank taught me how capital actually moves — and how to translate complex macro data into policy that billions of dollars follow. I now apply that lens to climate finance: understanding risk, unlocking investment, and building the economic case for net-zero.',
      tags: ['Climate Finance', 'Impact Investing', 'Macro Policy', 'IMF · World Bank']
    },
    {
      label: 'Innovation', color: '#3b82a0', rgb: '59,130,160', mid: 150,
      heading: 'AI & Innovation',
      body: 'An MBA from MIT Sloan wasn\'t just strategy — it was learning how technology reshapes economics. I\'m fascinated by how AI is changing the cost curves of decarbonization: optimizing grids, automating carbon accounting, and unlocking efficiencies that weren\'t possible five years ago.',
      tags: ['AI & Technology', 'Product Strategy', 'Climate Tech', 'Energy Markets']
    }
  ];

  let active    = 0;
  let rotAngle  = 0;
  let lastTime  = null;
  let isPaused  = false;
  const DEG_PER_SEC = 18; // one revolution every 20s

  // refs updated each buildSvg
  let arcsGroup   = null;
  const labelGrps = []; // { el, lx, ly }

  function rad(d) { return d * Math.PI / 180; }

  function arcPath(start, end) {
    const s = rad(start), e = rad(end);
    const f = n => n.toFixed(2);
    const x1 = CX + OR * Math.cos(s), y1 = CY + OR * Math.sin(s);
    const x2 = CX + OR * Math.cos(e), y2 = CY + OR * Math.sin(e);
    const x3 = CX + IR * Math.cos(e), y3 = CY + IR * Math.sin(e);
    const x4 = CX + IR * Math.cos(s), y4 = CY + IR * Math.sin(s);
    const lg = (end - start + 360) % 360 > 180 ? 1 : 0;
    return `M ${f(x1)} ${f(y1)} A ${OR} ${OR} 0 ${lg} 1 ${f(x2)} ${f(y2)} L ${f(x3)} ${f(y3)} A ${IR} ${IR} 0 ${lg} 0 ${f(x4)} ${f(y4)} Z`;
  }

  function mkEl(tag, attrs) {
    const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
    return e;
  }

  function buildSvg() {
    svg.innerHTML = '';
    labelGrps.length = 0;

    const defs = mkEl('defs', {});
    defs.innerHTML = `
      <pattern id="og" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(61,186,124,0.05)" stroke-width="0.5"/>
      </pattern>
      <filter id="arcglow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="5" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>`;
    svg.appendChild(defs);
    svg.appendChild(mkEl('rect', { width: 400, height: 400, fill: 'url(#og)' }));

    // outer decorative orbit ring (static, does not spin)
    svg.appendChild(mkEl('circle', {
      cx: CX, cy: CY, r: OR + 16,
      fill: 'none', stroke: 'rgba(61,186,124,0.07)',
      'stroke-width': '1', 'stroke-dasharray': '2 8'
    }));

    // ── rotating group ──────────────────────────────────────
    arcsGroup = mkEl('g', { id: 'arcsGroup' });
    svg.appendChild(arcsGroup);

    SEGS.forEach((seg, i) => {
      const isActive = i === active;
      const start    = seg.mid - SPAN / 2;
      const end      = seg.mid + SPAN / 2;

      // arc path
      const path = mkEl('path', {
        d:                arcPath(start, end),
        fill:             `rgba(${seg.rgb},${isActive ? 0.28 : 0.09})`,
        stroke:           seg.color,
        'stroke-width':   isActive ? '2.5' : '1',
        'stroke-opacity': isActive ? '1'   : '0.38',
        style: `cursor:pointer;transition:fill .3s,stroke-opacity .3s;${isActive ? 'filter:url(#arcglow)' : ''}`
      });
      path.addEventListener('click',      () => setActive(i));
      path.addEventListener('mouseenter', () => { if (i !== active) { path.setAttribute('fill', `rgba(${seg.rgb},0.18)`); path.setAttribute('stroke-opacity', '0.65'); }});
      path.addEventListener('mouseleave', () => { if (i !== active) { path.setAttribute('fill', `rgba(${seg.rgb},0.09)`); path.setAttribute('stroke-opacity', '0.38'); }});
      arcsGroup.appendChild(path);

      // label group — lives inside arcsGroup (rotates with arcs)
      // but is counter-rotated each frame so text stays upright
      const lx = CX + LABEL_R * Math.cos(rad(seg.mid));
      const ly = CY + LABEL_R * Math.sin(rad(seg.mid));
      const grp = mkEl('g', { style: 'cursor:pointer' });
      grp.addEventListener('click', () => setActive(i));

      const txt = mkEl('text', {
        x: lx.toFixed(1), y: (ly + 4).toFixed(1),
        'text-anchor': 'middle', 'font-family': 'JetBrains Mono, monospace',
        'font-size': '11', 'font-weight': isActive ? '700' : '500',
        fill: isActive ? seg.color : 'rgba(170,190,175,0.5)',
        'letter-spacing': '0.09em'
      });
      txt.textContent = seg.label.toUpperCase();
      grp.appendChild(txt);
      grp.appendChild(mkEl('circle', {
        cx: lx.toFixed(1), cy: (ly + 13).toFixed(1), r: '2.5',
        fill: isActive ? seg.color : 'rgba(170,190,175,0.28)'
      }));
      arcsGroup.appendChild(grp);
      labelGrps.push({ el: grp, lx, ly });
    });

    // ── static center (outside rotating group) ──────────────
    svg.appendChild(mkEl('circle', {
      cx: CX, cy: CY, r: IR - 10,
      fill: 'rgba(61,186,124,0.04)', stroke: 'rgba(61,186,124,0.2)',
      'stroke-width': '1', 'stroke-dasharray': '4 3'
    }));
    ['WHERE', 'I BUILD'].forEach((word, i) => {
      const t = mkEl('text', {
        x: CX, y: CY + (i === 0 ? -5 : 9), 'text-anchor': 'middle',
        'font-family': 'JetBrains Mono, monospace', 'font-size': '8',
        'font-weight': '700', fill: 'rgba(61,186,124,0.6)', 'letter-spacing': '0.1em'
      });
      t.textContent = word;
      svg.appendChild(t);
    });
  }

  function renderPanel() {
    const seg = SEGS[active];
    panel.style.transition = 'none';
    panel.style.opacity    = '0';
    panel.style.transform  = 'translateY(14px)';
    setTimeout(() => {
      panel.innerHTML = `
        <div class="op-label" style="color:${seg.color}">— ${seg.label.toUpperCase()} —</div>
        <h2 class="op-heading">${seg.heading}</h2>
        <p class="op-body">${seg.body}</p>
        <div class="op-tags">${seg.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
        <div class="op-nav">
          <button class="op-prev">← prev</button>
          <div class="op-dots">${SEGS.map((_, j) => `<span class="op-dot${j === active ? ' op-dot-active' : ''}"${j === active ? ` style="background:${seg.color}"` : ''}></span>`).join('')}</div>
          <button class="op-next">next →</button>
        </div>`;
      panel.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
      panel.style.opacity    = '1';
      panel.style.transform  = 'translateY(0)';
      panel.querySelector('.op-prev').addEventListener('click', () => setActive((active - 1 + SEGS.length) % SEGS.length));
      panel.querySelector('.op-next').addEventListener('click', () => setActive((active + 1) % SEGS.length));
    }, 160);
  }

  function setActive(i) {
    active = i;
    buildSvg();
    renderPanel();
  }

  // ── pause / resume on hover ─────────────────────────────
  svg.addEventListener('mouseenter', () => { isPaused = true; });
  svg.addEventListener('mouseleave', () => { isPaused = false; lastTime = null; });

  // ── spin loop ───────────────────────────────────────────
  // arcs rotate; labels counter-rotate so text stays upright
  function spinFrame(ts) {
    if (!isPaused && arcsGroup) {
      if (lastTime !== null) {
        const dt = Math.min((ts - lastTime) / 1000, 0.1); // cap at 100ms
        rotAngle = (rotAngle + DEG_PER_SEC * dt) % 360;
        arcsGroup.setAttribute('transform', `rotate(${rotAngle.toFixed(2)},${CX},${CY})`);
        labelGrps.forEach(({ el, lx, ly }) =>
          el.setAttribute('transform', `rotate(${(-rotAngle).toFixed(2)},${lx.toFixed(1)},${ly.toFixed(1)})`));
      }
      lastTime = ts;
    } else if (isPaused) {
      lastTime = null;
    }
    requestAnimationFrame(spinFrame);
  }

  buildSvg();
  renderPanel();
  requestAnimationFrame(spinFrame);
})();

/* ─── CONTACT FORM ──────────────────────────────────────── */
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name    = document.getElementById('name').value.trim();
    const email   = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();

    const subject = encodeURIComponent(`Message from ${name} via portfolio`);
    const body    = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
    window.location.href = `mailto:ffanyqing@gmail.com?subject=${subject}&body=${body}`;

    const btn = contactForm.querySelector('button[type="submit"]');
    const original = btn.textContent;
    btn.textContent = 'Opening your email app…';
    btn.style.background = 'linear-gradient(135deg, #2e7d5e, #1a5c42)';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = original;
      btn.style.background = '';
      btn.disabled = false;
      contactForm.reset();
    }, 3000);
  });
}
