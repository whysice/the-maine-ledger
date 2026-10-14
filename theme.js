// Display settings: theme (system, light, dark), contrast (standard, more) and text size (standard, large, larger).
// Saved choices are applied before first paint by an inline script in each page's <head>; this file only runs the menu.
// "System" removes the saved choice so the operating system setting decides again, including when it changes mid-day.
(function () {
  var menu = document.getElementById('display');
  if (!menu) return;
  var root = document.documentElement;
  var form = menu.querySelector('form');
  var KEYS = { theme: 'ledger_theme', contrast: 'ledger_contrast', text: 'ledger_text' };
  var ATTRS = { theme: 'data-theme', contrast: 'data-contrast', text: 'data-text' };
  var SYSTEM = { theme: 'system', contrast: 'standard', text: 'standard' };

  function read(key) { try { return localStorage.getItem(key); } catch (err) { return null; } }
  function write(key, value) { try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value); } catch (err) {} }

  function systemWantsMore() {
    return !!(window.matchMedia && matchMedia('(prefers-contrast: more)').matches);
  }

  // What the reader is actually seeing: a saved choice, or else the system setting.
  function current(group) {
    var v = root.getAttribute(ATTRS[group]);
    if (v) return v;
    if (group === 'contrast' && systemWantsMore()) return 'more';
    return SYSTEM[group];
  }

  function apply(group, value) {
    if (value === SYSTEM[group] && group !== 'contrast') {
      root.removeAttribute(ATTRS[group]);
      write(KEYS[group], null);
      return;
    }
    if (group === 'contrast' && value === 'standard') {
      // Keep an explicit "standard" only if the system asks for more contrast; otherwise fall back to the system.
      if (systemWantsMore()) { root.setAttribute('data-contrast', 'standard'); write(KEYS.contrast, 'standard'); }
      else { root.removeAttribute('data-contrast'); write(KEYS.contrast, null); }
      return;
    }
    root.setAttribute(ATTRS[group], value);
    write(KEYS[group], value);
  }

  function sync() {
    for (var group in KEYS) {
      var value = current(group);
      var input = form.querySelector('input[name="' + group + '"][value="' + value + '"]');
      if (input) input.checked = true;
    }
  }

  form.addEventListener('change', function (e) {
    var t = e.target;
    if (!t || !t.name || !(t.name in KEYS)) return;
    apply(t.name, t.value);
  });
  form.addEventListener('submit', function (e) { e.preventDefault(); });

  // Close on Escape or on a click outside.
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.open) { menu.open = false; menu.querySelector('summary').focus(); }
  });
  document.addEventListener('click', function (e) {
    if (menu.open && !menu.contains(e.target)) menu.open = false;
  });

  sync();
})();
