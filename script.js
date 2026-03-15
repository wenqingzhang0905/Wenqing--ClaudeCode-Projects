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

/* ─── CONTACT FORM ──────────────────────────────────────── */
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector('button[type="submit"]');
    const original = btn.textContent;
    btn.textContent = 'Message sent!';
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
