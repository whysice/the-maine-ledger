// Maine Ledger: read-aloud + summary bar. Uses the device's built-in voice; nothing leaves the page.
(function(){
  const bar = document.querySelector('.listen'); if(!bar) return;
  const synth = window.speechSynthesis;
  const body = document.querySelector('.body');
  const sum = document.getElementById('summary');
  const btnPlay = bar.querySelector('[data-play]'), btnSum = bar.querySelector('[data-sum]'), btnStop = bar.querySelector('[data-stop]');
  const status = bar.querySelector('[data-status]'), bar2 = bar.querySelector('[data-bar]'), rateSel = bar.querySelector('[data-rate]');
  if(!synth){ btnPlay.disabled = true; status.textContent = 'READ ALOUD NOT SUPPORTED IN THIS BROWSER'; }

  // Build the reading queue: headline, dek, then every paragraph/heading/list item/caption/quote in order. Tables read their caption only.
  function queueFor(root){
    const sel = 'h1,h2,h3,p,li,blockquote>p,caption';
    const nodes = root === body ? [document.querySelector('.hed h1'), document.querySelector('.hed .dek'), ...body.querySelectorAll(sel)] : [...root.querySelectorAll('h3,p,li')];
    return nodes.filter(n => n && n.textContent.trim() && !n.closest('.tbl tbody') && !n.closest('blockquote footer') && !(n.tagName==='P' && n.closest('blockquote') && !n.matches('blockquote>p')));
  }
  let q = [], i = 0, cur = null, mode = null;
  function clearHi(){ if(cur){ cur.style.background=''; cur.style.boxShadow=''; cur=null; } }
  function speakNext(){
    clearHi();
    if(i >= q.length){ done(); return; }
    cur = q[i]; cur.style.background='var(--acc-soft)'; cur.style.boxShadow='0 0 0 6px var(--acc-soft)';
    const r = cur.getBoundingClientRect(); if(r.top < 80 || r.bottom > innerHeight - 80) window.scrollBy({top: r.top - 140, behavior:'smooth'});
    const u = new SpeechSynthesisUtterance(cur.textContent.replace(/\s+/g,' ').replace(/^\d\d(?=[A-Z])/,'').trim());
    u.rate = parseFloat(rateSel ? rateSel.value : 1); u.lang = 'en-US';
    u.onend = () => { i++; bar2.style.width = Math.round(i/q.length*100)+'%'; speakNext(); };
    u.onerror = e => { if(e.error !== 'interrupted' && e.error !== 'canceled'){ i++; speakNext(); } };
    synth.speak(u);
  }
  function start(root, label){
    synth.cancel(); q = queueFor(root); i = 0; mode = label; bar2.style.width='0%';
    btnPlay.textContent = 'Pause'; btnStop.hidden = false; status.textContent = 'READING ' + label;
    speakNext();
  }
  function done(){ synth.cancel(); clearHi(); mode = null; btnPlay.textContent = 'Listen'; btnStop.hidden = true; status.textContent = 'FINISHED'; bar2.style.width='100%'; }
  btnPlay.addEventListener('click', () => {
    if(!synth) return;
    if(!mode){ start(body, 'ARTICLE'); return; }
    if(synth.paused){ synth.resume(); btnPlay.textContent='Pause'; status.textContent='READING '+mode; }
    else { synth.pause(); btnPlay.textContent='Resume'; status.textContent='PAUSED'; }
  });
  btnStop.addEventListener('click', () => { done(); status.textContent='STOPPED'; bar2.style.width='0%'; });
  if(sum){
    btnSum.addEventListener('click', () => {
      const open = sum.hidden; sum.hidden = !open; btnSum.setAttribute('aria-expanded', String(open));
      btnSum.textContent = open ? 'Hide summary' : 'Summary';
    });
    const sumPlay = sum.querySelector('[data-sum-play]');
    if(sumPlay) sumPlay.addEventListener('click', () => { if(synth) start(sum, 'SUMMARY'); });
  }
  if(rateSel) rateSel.addEventListener('change', () => { if(mode && !synth.paused){ synth.cancel(); speakNext(); } });
  addEventListener('beforeunload', () => synth && synth.cancel());
})();
