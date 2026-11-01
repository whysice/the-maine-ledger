document.documentElement.classList.add('js');
(() => {
  const items = document.querySelectorAll('[data-reveal]');
  if (!items.length) return;
  const groups = new Map();
  items.forEach((el) => {
    const i = groups.get(el.parentElement) || 0;
    if (!el.style.getPropertyValue('--d')) el.style.setProperty('--d', `${Math.min(i * 0.08, 0.25)}s`);
    groups.set(el.parentElement, i + 1);
  });
  if (!('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.15 });
  items.forEach((el) => io.observe(el));
})();
