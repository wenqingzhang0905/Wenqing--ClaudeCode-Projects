/* ─── NAV: scroll shadow + mobile menu ─────────────────── */
const nav       = document.getElementById('nav');
const hamburger = document.getElementById('hamburger');
const navMobile = document.getElementById('navMobile');

window.addEventListener('scroll', () => {
  nav.style.borderBottomColor = window.scrollY > 10
    ? 'rgba(255,255,255,0.1)'
    : 'rgba(255,255,255,0.07)';
});

hamburger.addEventListener('click', () => {
  navMobile.classList.toggle('open');
});

// Close mobile nav on link click
navMobile.querySelectorAll('.nav-mobile-link').forEach(link => {
  link.addEventListener('click', () => navMobile.classList.remove('open'));
});

/* ─── ACTIVE NAV LINK on scroll ────────────────────────── */
const sections  = document.querySelectorAll('section[id]');
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
}, { threshold: 0.12 });

// Add fade-up to key elements
const fadeTargets = [
  '.section-label', '.section-title', '.section-desc',
  '.info-card', '.timeline-item', '.skill-group',
  '.article-card', '.contact-card', '.contact-form',
  '.hero-badge', '.hero-title', '.hero-subtitle', '.hero-desc',
  '.hero-actions', '.hero-stats'
];

fadeTargets.forEach(selector => {
  document.querySelectorAll(selector).forEach((el, i) => {
    el.classList.add('fade-up');
    el.style.transitionDelay = `${i * 0.06}s`;
    observerFade.observe(el);
  });
});

/* ─── SKILL BARS: animate width on scroll ──────────────── */
const skillObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('.skill-bar-fill').forEach(bar => {
        bar.classList.add('animated');
      });
      skillObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });

document.querySelectorAll('.skill-group').forEach(g => skillObserver.observe(g));

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

/* ─── CONTACT FORM ──────────────────────────────────────── */
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector('button[type="submit"]');
    const original = btn.textContent;
    btn.textContent = 'Message sent!';
    btn.style.background = 'linear-gradient(135deg, #3dd68c, #2bb57a)';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = original;
      btn.style.background = '';
      btn.disabled = false;
      contactForm.reset();
    }, 3000);
  });
}

/* ─── TYPING EFFECT for hero subtitle ──────────────────── */
const subtitleEl = document.querySelector('.hero-subtitle');
if (subtitleEl) {
  const roles = [
    'Product Manager · Data Analyst · Tech Enthusiast',
    'Builder · Writer · International Professional',
    'Small Red Book Creator · Career Sharer',
  ];
  let roleIdx = 0;
  let charIdx  = 0;
  let deleting = false;
  let paused   = false;

  const type = () => {
    const current = roles[roleIdx];
    if (paused) { paused = false; return; }

    if (!deleting) {
      subtitleEl.textContent = current.slice(0, charIdx + 1);
      charIdx++;
      if (charIdx === current.length) {
        deleting = true;
        setTimeout(type, 2200);
        return;
      }
    } else {
      subtitleEl.textContent = current.slice(0, charIdx - 1);
      charIdx--;
      if (charIdx === 0) {
        deleting = false;
        roleIdx = (roleIdx + 1) % roles.length;
      }
    }
    setTimeout(type, deleting ? 40 : 65);
  };

  // Start after a small delay so the hero fade-in plays first
  setTimeout(type, 1200);
}
