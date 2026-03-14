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

  const BLOCK = 5;   // px per pixel block
  const COLS  = 80;  // blocks wide  → 400px canvas
  const ROWS  = 80;  // blocks tall  → 400px canvas
  const GAP   = 1;   // gap between blocks

  canvas.width  = COLS * BLOCK;
  canvas.height = ROWS * BLOCK;

  const ctx = canvas.getContext('2d');

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = 'profile.jpg';

  img.onload = () => {
    // Sample the image into COLS×ROWS at a center-crop square
    const off = document.createElement('canvas');
    off.width  = COLS;
    off.height = ROWS;
    const offCtx = off.getContext('2d');
    const s  = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = (img.naturalWidth  - s) / 2;
    const sy = (img.naturalHeight - s) / 2;
    offCtx.drawImage(img, sx, sy, s, s, 0, 0, COLS, ROWS);
    const data = offCtx.getImageData(0, 0, COLS, ROWS).data;

    // Build pixel list with random staggered reveal delays
    const pixels = [];
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const i = (y * COLS + x) * 4;
        pixels.push({
          x, y,
          r: data[i],
          g: data[i + 1],
          b: data[i + 2],
          a: data[i + 3] / 255,
          delay: Math.random() * 1600
        });
      }
    }

    // Phase 1: reveal — pixels fade in with random stagger
    const FADE  = 280;
    const start = performance.now();

    function reveal(now) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let allDone = true;

      for (const p of pixels) {
        const elapsed = now - start - p.delay;
        if (elapsed < 0) { allDone = false; continue; }
        const t = Math.min(1, elapsed / FADE);
        if (t < 1) allDone = false;
        ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${(p.a * t).toFixed(3)})`;
        ctx.fillRect(p.x * BLOCK + GAP, p.y * BLOCK + GAP, BLOCK - GAP, BLOCK - GAP);
      }

      if (allDone) requestAnimationFrame(idle);
      else         requestAnimationFrame(reveal);
    }

    // Phase 2: idle — diagonal sine wave + random pixel sparks forever
    const sparks = new Map(); // pixelIndex → sparkStartTime

    function idle(now) {
      const t = now * 0.00055; // wave speed

      // ~5 new sparks per second
      if (Math.random() < 0.08) {
        sparks.set(Math.floor(Math.random() * pixels.length), now);
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < pixels.length; i++) {
        const p = pixels[i];

        // Slow diagonal wave (brightness 0.82–1.0)
        const wave = Math.sin(t + (p.x + p.y) * 0.07) * 0.09 + 0.91;

        // Short brightness spark (sine arc over 220 ms, up to +45%)
        let spark = 1;
        if (sparks.has(i)) {
          const age = (now - sparks.get(i)) / 220;
          if (age >= 1) sparks.delete(i);
          else spark = 1 + Math.sin(age * Math.PI) * 0.45;
        }

        const b = wave * spark;
        ctx.fillStyle = `rgba(${Math.min(255,Math.round(p.r*b))},${Math.min(255,Math.round(p.g*b))},${Math.min(255,Math.round(p.b*b))},${p.a})`;
        ctx.fillRect(p.x * BLOCK + GAP, p.y * BLOCK + GAP, BLOCK - GAP, BLOCK - GAP);
      }

      requestAnimationFrame(idle);
    }

    requestAnimationFrame(reveal);
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
