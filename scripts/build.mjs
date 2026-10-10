// Builds the facility and bill pages from data/ledger.json.
// Run: node scripts/build.mjs          (writes pages; Netlify runs this on deploy)
//      node scripts/build.mjs --check  (fails if a committed page is out of date)
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(readFileSync(join(ROOT, 'data/ledger.json'), 'utf8'));
const CHECK = process.argv.includes('--check');

// ---- Validation: the scheme degrades through duplicate and stray tags, so refuse them here.
const errors = [];
const warnings = [];
const facilities = new Map(data.facilities.map(f => [f.id, f]));
const bills = new Map(data.bills.map(b => [b.id, b]));
const norm = s => s.toLowerCase().replace(/[’']/g, '').replace(/\s+/g, ' ').trim();

const seenIds = new Set();
for (const list of [data.facilities, data.bills, data.items]) {
  for (const x of list) {
    if (seenIds.has(x.id)) errors.push(`duplicate id "${x.id}"`);
    seenIds.add(x.id);
  }
}

const nameOwner = new Map();
for (const f of data.facilities) {
  if (!/^[a-z0-9-]+$/.test(f.id)) errors.push(`facility id "${f.id}" must be lowercase letters, digits and hyphens`);
  if (!data.systems[f.system]) errors.push(`facility "${f.id}" has unknown system "${f.system}"`);
  for (const label of [f.name, ...(f.aliases || [])]) {
    const k = norm(label);
    if (nameOwner.has(k) && nameOwner.get(k) !== f.id) {
      errors.push(`"${label}" is used by both "${nameOwner.get(k)}" and "${f.id}"; one place, one tag`);
    }
    nameOwner.set(k, f.id);
  }
  if (!f.in_maine && !f.maine_tie) {
    warnings.push(`"${f.name}" is outside Maine and has no maine_tie record yet; its page says so`);
  }
}

for (const b of data.bills) {
  if (b.id !== `${b.legislature}-${b.ld}`) errors.push(`bill id "${b.id}" must be "${b.legislature}-${b.ld}"`);
}

for (const it of data.items) {
  if (!data.formats[it.format]) errors.push(`item "${it.id}" has unknown format "${it.format}"`);
  if (!data.systems[it.system]) errors.push(`item "${it.id}" has unknown system "${it.system}"`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(it.date)) errors.push(`item "${it.id}" date must be YYYY-MM-DD`);
  for (const id of it.facilities) if (!facilities.has(id)) errors.push(`item "${it.id}" tags unknown facility "${id}"`);
  for (const id of it.bills) if (!bills.has(id)) errors.push(`item "${it.id}" tags unknown bill "${id}"`);
}

for (const w of warnings) console.warn(`warning: ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`error: ${e}`);
  process.exit(1);
}

// ---- Rendering
const SITE = 'https://maineledger.netlify.app';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const stamp = iso => { const [y, m, d] = iso.split('-'); return `${MONTHS[+m - 1]} ${d} ${y}`; };
const ordinal = n => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');
const newestFirst = (a, b) => b.date.localeCompare(a.date);
const facilityPath = f => `/facility/${f.id}`;
const billPath = b => `/bill/${b.id}`;
const abs = url => url.startsWith('http') ? url : SITE + url;
const filedOn = pred => data.items.filter(pred);
const plural = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`;
// Aliases worth showing: the town is already on the card, so an alias that only repeats it is noise.
const shownAliases = f => (f.aliases || []).filter(a => norm(a) !== norm(f.town));
// JSON-LD must not close its own script element.
const ld = obj => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;

const facilitySchema = f => ({
  '@type': 'GovernmentBuilding',
  name: f.name,
  ...(f.aliases?.length ? { alternateName: f.aliases } : {}),
  url: SITE + facilityPath(f),
  address: { '@type': 'PostalAddress', addressLocality: f.town.replace(/, Va\.$/, ''), addressRegion: f.in_maine ? 'ME' : (f.town.endsWith('Va.') ? 'VA' : undefined) },
  ...(f.operator ? { description: `${data.systems[f.system]} run by ${f.operator}.` } : {}),
});
const billSchema = b => ({
  '@type': 'Legislation',
  name: b.title,
  legislationIdentifier: `LD ${b.ld}`,
  alternateName: `LD ${b.ld}, ${ordinal(b.legislature)} Maine Legislature`,
  legislationJurisdiction: 'Maine',
  sameAs: b.url,
  url: SITE + billPath(b),
});
const itemSchema = it => ({
  '@type': it.format === 'report' ? 'Report' : 'CreativeWork',
  name: it.title,
  url: abs(it.url),
  datePublished: it.format === 'calendar' ? undefined : it.date,
  genre: data.formats[it.format],
});

function page({ title, description, current, path, schema, body }) {
  const nav = [['/', 'This week'], ['/archive', 'Archive'], ['/facilities', 'Facilities'], ['/about', 'About']]
    .map(([href, label]) => `<a${current === href ? " aria-current='page'" : ''} href='${href}'>${label}</a>`).join('');
  return `<!doctype html>
<html lang="en">
<head>
<script>
// Applies a previously chosen theme before first paint, so a reload never flashes the other theme first.
(function () {
  try {
    var t = localStorage.getItem('ledger_theme');
    if (t === 'dark' || t === 'light') document.documentElement.setAttribute('data-theme', t);
  } catch (err) { /* storage unavailable; prefers-color-scheme decides */ }
})();
</script>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="copyright" content="© 2026 Whysice" />
<meta name="description" content="${esc(description)}" />
<meta name="theme-color" content="#16263a" />
<link rel="canonical" href="${SITE}${path}" />
<link rel="manifest" href="/manifest.webmanifest" />
<link rel="icon" href="/assets/icon-192.png" type="image/png" />
<link rel="apple-touch-icon" href="/assets/icon-180.png" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<title>${esc(title)} — Maine Ledger</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&family=Public+Sans:wght@500;600;700&display=swap" />
<link rel="stylesheet" href="/ledger.css" />
${ld({ '@context': 'https://schema.org', ...schema })}
</head>
<body>
<!-- Generated by scripts/build.mjs from data/ledger.json. Edit the data, not this file. -->
<header class="top"><div class="wrap top-in"><a class='name' href='/'>Maine Ledger<small>Jails, prisons and courts, by the record.</small></a>
    <nav class="tools" aria-label="Main"><button class="theme-toggle" id="theme-toggle" type="button">Dark mode</button>${nav}<a class='sub-btn' href='/#subscribe'>Subscribe</a></nav></div></header>
<div class="wrap">

  <main class="panel tagpage">
${body}
  </main>

  <footer>
    <p><a href='/'>This week</a> · <a href='/archive'>Archive</a> · <a href='/facilities'>Facilities and bills</a></p>
  <p class="copy">© 2026 Whysice</p></footer>
</div>
<script>if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));</script>
<script src="/theme.js" defer></script>
</body>
</html>
`;
}

const crumbs = (...trail) => `    <nav class="crumbs mono" aria-label="Breadcrumb"><a href="/facilities">Facilities and bills</a>${trail.map(t => ` <span aria-hidden="true">/</span> <span>${esc(t)}</span>`).join('')}</nav>`;

function itemList(items) {
  if (!items.length) return '    <p class="tag-empty">Nothing filed here yet.</p>';
  const rows = items.slice().sort(newestFirst).map(it => {
    const fmt = data.formats[it.format] + (it.issue ? ` · Issue № ${it.issue}` : '');
    const due = it.format === 'calendar' ? 'Due ' : '';
    const ext = it.url.startsWith('http');
    return `      <li><span class="d mono">${due}${stamp(it.date)}</span><span class="tag-body"><a href="${esc(it.url)}"${ext ? ' rel="noopener"' : ''}>${esc(it.title)}${ext ? ' <span class="ext" aria-label="(record, opens on the publisher’s site)">↗</span>' : ''}</a><span class="tag-meta mono">${esc(fmt)} · ${esc(it.place)}</span></span></li>`;
  });
  return `    <ul class="tag-list">\n${rows.join('\n')}\n    </ul>`;
}

const facts = pairs => `<dl class="tag-facts">\n${pairs.map(([k, v]) => `        <div><dt class="mono">${k}</dt><dd>${v}</dd></div>`).join('\n')}\n      </dl>`;
const chips = labels => `<ul class="alias-list">${labels.map(a => `<li>${esc(a)}</li>`).join('')}</ul>`;

const out = new Map();

for (const f of data.facilities) {
  const items = filedOn(it => it.facilities.includes(f.id));
  const linkedBills = [...new Set(items.flatMap(it => it.bills))].map(id => bills.get(id));
  const aside = [
    `      <h2>At a glance</h2>`,
    `      ${facts([['Town', esc(f.town)], ['System', esc(data.systems[f.system])], ['Run by', esc(f.operator)], ['Filed', plural(items.length, 'piece')]])}`,
    f.aliases?.length ? `      <h2>Also called</h2>\n      ${chips(f.aliases)}` : '',
    f.alias_note ? `      <p class="tag-note">${esc(f.alias_note)}</p>` : '',
    linkedBills.length ? `      <h2>Bills</h2>\n      <ul class="side-links">${linkedBills.map(b => `<li><a href="${billPath(b)}" title="${esc(b.title)}"><span class="mono">LD ${b.ld} · ${ordinal(b.legislature)}</span><span class="side-title">${esc(b.title)}</span></a></li>`).join('')}</ul>` : '',
  ].filter(Boolean).join('\n');
  const body = [
    crumbs(f.in_maine ? data.systems[f.system] : 'Outside Maine'),
    `    <header class="tag-head">`,
    `      <p class="kicker mono">Facility · ${esc(data.systems[f.system])} · ${esc(f.town)}</p>`,
    `      <h1>${esc(f.name)}</h1>`,
    f.note ? `      <p class="tag-lede">${esc(f.note)}</p>` : '',
    !f.in_maine ? `      <p class="tag-flag">Outside Maine. Listed because people from Maine are held here.${f.maine_tie ? ` Record: <a href="${esc(f.maine_tie.url)}" rel="noopener">${esc(f.maine_tie.title)}</a>.` : ' The record showing it is still to be added.'}</p>` : '',
    `    </header>`,
    `    <div class="tag-cols">`,
    `    <section class="tag-main" aria-labelledby="filed-h">`,
    `    <h2 id="filed-h">Everything filed under this facility</h2>`,
    itemList(items),
    `    </section>`,
    `    <aside class="tag-side" aria-label="About this facility">`,
    aside,
    `    </aside>`,
    `    </div>`,
  ].filter(Boolean).join('\n');
  out.set(`facility/${f.id}.html`, page({
    title: f.name,
    description: `Everything Maine Ledger has filed on ${f.name}${f.aliases?.length ? ` (also called ${f.aliases.slice(0, 2).join(', ')})` : ''}.`,
    current: '/facilities',
    path: facilityPath(f),
    schema: { '@type': 'CollectionPage', name: f.name, url: SITE + facilityPath(f), about: facilitySchema(f), hasPart: items.map(itemSchema) },
    body,
  }));
}

for (const b of data.bills) {
  const items = filedOn(it => it.bills.includes(b.id));
  const linkedFacilities = [...new Set(items.flatMap(it => it.facilities))].map(id => facilities.get(id));
  const aside = [
    `      <h2>At a glance</h2>`,
    `      ${facts([['Legislature', `${ordinal(b.legislature)}`], ['Status', esc(b.status)], ['Record', `<a href="${esc(b.url)}" rel="noopener">Bill status and history ↗</a>`], ['Filed', plural(items.length, 'piece')]])}`,
    linkedFacilities.length ? `      <h2>Facilities</h2>\n      <ul class="side-links">${linkedFacilities.map(f => `<li><a href="${facilityPath(f)}">${esc(f.name)}</a></li>`).join('')}</ul>` : '',
  ].filter(Boolean).join('\n');
  const body = [
    crumbs(`LD ${b.ld}`),
    `    <header class="tag-head">`,
    `      <p class="kicker mono">Bill · ${ordinal(b.legislature)} Legislature</p>`,
    `      <h1>LD ${b.ld}</h1>`,
    `      <p class="tag-lede">${esc(b.title)}</p>`,
    `    </header>`,
    `    <div class="tag-cols">`,
    `    <section class="tag-main" aria-labelledby="filed-h">`,
    `    <h2 id="filed-h">Reporting that cites this bill</h2>`,
    itemList(items),
    `    </section>`,
    `    <aside class="tag-side" aria-label="About this bill">`,
    aside,
    `    </aside>`,
    `    </div>`,
  ].join('\n');
  out.set(`bill/${b.id}.html`, page({
    title: `LD ${b.ld} (${ordinal(b.legislature)} Legislature)`,
    description: `Maine Ledger reporting that cites LD ${b.ld} of the ${ordinal(b.legislature)} Maine Legislature: ${b.title}.`,
    current: '/facilities',
    path: billPath(b),
    schema: { '@type': 'CollectionPage', name: `LD ${b.ld}`, url: SITE + billPath(b), about: billSchema(b), hasPart: items.map(itemSchema) },
    body,
  }));
}

{
  const card = f => {
    const n = filedOn(it => it.facilities.includes(f.id)).length;
    const aka = shownAliases(f);
    return `        <li class="fac-card"><a href="${facilityPath(f)}"><span class="fac-name">${esc(f.name)}</span><span class="fac-meta mono">${esc(f.town)} · ${plural(n, 'filed', 'filed')}</span>${aka.length ? `<span class="fac-aka">Also ${esc(aka.join(' · '))}</span>` : ''}</a></li>`;
  };
  const group = (id, label, fs, note) => fs.length ? `    <section class="fac-group" aria-labelledby="${id}">\n      <h2 id="${id}">${esc(label)} <span class="count mono">${fs.length}</span></h2>${note ? `\n      <p class="tag-note">${note}</p>` : ''}\n      <ul class="fac-grid">\n${fs.map(card).join('\n')}\n      </ul>\n    </section>` : '';
  const byName = (a, b) => a.name.localeCompare(b.name);
  const groups = Object.entries(data.systems).map(([key, label]) =>
    group(`sys-${key}`, label, data.facilities.filter(f => f.system === key && f.in_maine).sort(byName))).filter(Boolean);
  const away = data.facilities.filter(f => !f.in_maine).sort(byName);
  if (away.length) groups.push(group('sys-away', 'Outside Maine', away, 'Facilities in other states where people from Maine are held.'));

  const billRows = data.bills.slice().sort((a, b) => b.legislature - a.legislature || a.ld - b.ld).map(b => {
    const n = filedOn(it => it.bills.includes(b.id)).length;
    return `        <li><a href="${billPath(b)}"><span class="bill-ld mono">LD ${b.ld}</span><span class="bill-title">${esc(b.title)}</span><span class="bill-meta mono">${ordinal(b.legislature)} Legislature · ${plural(n, 'filed', 'filed')}</span></a></li>`;
  });
  const body = [
    `    <header class="tag-head">`,
    `      <h1>Facilities and bills</h1>`,
    `      <p class="tag-lede">One page for each jail, prison and bill, collecting everything Maine Ledger has filed on it. Facilities are listed under their official names, with the names locals and records use.</p>`,
    `      <p class="jump mono"><a href="#facilities-h">${plural(data.facilities.length, 'facility', 'facilities')}</a><a href="#bills">${plural(data.bills.length, 'bill')}</a></p>`,
    `    </header>`,
    `    <h2 class="sr" id="facilities-h">Facilities</h2>`,
    ...groups,
    `    <section class="fac-group" aria-labelledby="bills">`,
    `      <h2 id="bills">Bills, by LD number <span class="count mono">${data.bills.length}</span></h2>`,
    `      <p class="tag-note">LD numbers restart with each Legislature, so a bill is always named with its Legislature.</p>`,
    `      <ul class="bill-list">\n${billRows.join('\n')}\n      </ul>`,
    `    </section>`,
  ].join('\n');
  out.set('facilities.html', page({
    title: 'Facilities and bills',
    description: 'Every Maine jail, prison and bill Maine Ledger has reported on, each with one page collecting the reporting and records.',
    current: '/facilities',
    path: '/facilities',
    schema: {
      '@type': 'CollectionPage', name: 'Facilities and bills', url: SITE + '/facilities',
      mainEntity: { '@type': 'ItemList', itemListElement: [...data.facilities.map(facilitySchema), ...data.bills.map(billSchema)].map((x, i) => ({ '@type': 'ListItem', position: i + 1, url: x.url, name: x.name })) },
    },
    body,
  }));
}

// ---- Write or check. Stale generated pages (a removed facility or bill) are deleted.
const generatedDirs = ['facility', 'bill'];
const existing = new Set(generatedDirs.flatMap(dir => existsSync(join(ROOT, dir)) ? readdirSync(join(ROOT, dir)).map(f => `${dir}/${f}`) : []));
let stale = 0;
for (const [rel, html] of out) {
  const abs = join(ROOT, rel);
  const prev = existsSync(abs) ? readFileSync(abs, 'utf8') : null;
  existing.delete(rel);
  if (prev === html) continue;
  stale++;
  if (CHECK) { console.error(`out of date: ${rel}`); continue; }
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, html);
}
for (const rel of existing) {
  stale++;
  if (CHECK) { console.error(`no longer in data: ${rel}`); continue; }
  rmSync(join(ROOT, rel));
}
if (CHECK && stale) { console.error('Run: node scripts/build.mjs'); process.exit(1); }
console.log(`${out.size} pages${CHECK ? ' up to date' : ` built (${stale} changed)`}: ${data.facilities.length} facilities, ${data.bills.length} bills.`);
