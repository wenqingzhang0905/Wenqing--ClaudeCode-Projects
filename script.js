/* ─── NAV: scroll shadow + mobile menu ─────────────────── */
const nav       = document.getElementById('nav');
const hamburger = document.getElementById('hamburger');
const navMobile = document.getElementById('navMobile');

window.addEventListener('scroll', () => {
  nav.style.borderBottomColor = window.scrollY > 10
    ? 'rgba(80,60,30,0.15)'
    : 'rgba(80,60,30,0.1)';
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

  const BLOCK = 4;   // px per pixel block
  const COLS  = 80;  // blocks wide  → 320px canvas
  const ROWS  = 80;  // blocks tall  → 320px canvas
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

    // Animate reveal: each pixel fades in at its random delay
    const FADE    = 280;  // ms to fully fade in one pixel
    const start   = performance.now();
    let   settled = false;

    function frame(now) {
      if (settled) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let allDone = true;

      for (const p of pixels) {
        const elapsed = now - start - p.delay;
        if (elapsed < 0) { allDone = false; continue; }

        const t = Math.min(1, elapsed / FADE);
        if (t < 1) allDone = false;

        ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${(p.a * t).toFixed(3)})`;
        ctx.fillRect(
          p.x * BLOCK + GAP,
          p.y * BLOCK + GAP,
          BLOCK - GAP,
          BLOCK - GAP
        );
      }

      if (allDone) {
        settled = true;
      } else {
        requestAnimationFrame(frame);
      }
    }

    requestAnimationFrame(frame);
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
