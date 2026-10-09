// Theme toggle. The saved choice is applied before first paint by an inline script in each page's <head>.
(function () {
  var btn = document.getElementById('theme-toggle');
  if (!btn) return;
  function effective() {
    var cur = document.documentElement.getAttribute('data-theme');
    if (cur) return cur;
    return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function label() {
    var dark = effective() === 'dark';
    btn.textContent = dark ? 'Light mode' : 'Dark mode';
    btn.setAttribute('aria-label', 'Switch to ' + (dark ? 'light' : 'dark') + ' mode');
  }
  btn.addEventListener('click', function () {
    var next = effective() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('ledger_theme', next); } catch (err) {}
    label();
  });
  if (window.matchMedia) {
    var mq = matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) mq.addEventListener('change', label);
  }
  label();
})();
