/* Student Echoes - addon.js (mobile + UI enhancements, dark-glass style)
   Purpose: enhance mobile UX and add floating help + several small niceties
   This file is intentionally non-invasive and calls existing global functions when available.
   Install: add <script src="addon.js" defer></script> after your existing script.
*/

(function(){
  'use strict';

  // --- LocalStorage keys ---
  const LS_PROFILE_VISITS = 'se_profile_visits';
  const LS_DAILY_QUOTE = 'se_daily_quote';

  // --- Utilities ---
  const qs = s=>document.querySelector(s);
  const qsa = s=>Array.from(document.querySelectorAll(s));
  const byId = id=>document.getElementById(id);
  const save = (k,v)=>localStorage.setItem(k, JSON.stringify(v));
  const load = (k,def)=>{ try{ const v=JSON.parse(localStorage.getItem(k)); return v===null||v===undefined?def:v; }catch(e){return def;} };
  const now = ()=>new Date().toISOString();

  // --- Inject dark-glass CSS tuned to your theme (A) ---
  const css = `
  /* ADDON: Dark-glass UI (matches existing site) */
  .addon-help-btn{ position:fixed; right:16px; bottom:16px; width:56px; height:56px; border-radius:50%; display:flex;align-items:center;justify-content:center;z-index:999;border:none; cursor:pointer; box-shadow:0 12px 30px rgba(0,0,0,0.6); backdrop-filter:blur(8px); background:linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)); color:var(--white); font-weight:700 }
  .addon-help-btn:active{ transform:scale(0.98) }
  .addon-help-modal .modal-card{ max-width:620px; padding:18px }
  .addon-help-grid{ display:grid; grid-template-columns:1fr 1fr; gap:12px }
  @media(max-width:720px){ .addon-help-grid{ grid-template-columns:1fr } .addon-help-btn{ right:12px; bottom:12px; width:52px; height:52px } }

  /* floating composer */
  .addon-compose-btn{ position:fixed; right:16px; bottom:88px; width:56px;height:56px;border-radius:50%;z-index:998;border:none; cursor:pointer; backdrop-filter:blur(8px); background:linear-gradient(90deg,var(--accent), rgba(0,180,216,0.5)); color:#022; font-size:20px; box-shadow:0 12px 30px rgba(0,0,0,0.6) }
  .addon-compose-btn:active{ transform:scale(0.98) }

  /* daily quote banner */
  .daily-quote{ display:flex;gap:12px;align-items:center;padding:10px 12px;border-radius:10px;background:linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)); margin-bottom:12px }
  .daily-quote .q{ font-weight:700 }

  /* like animation */
  .like-float{ position:absolute; pointer-events:none; transform:translate(-50%,-50%); animation:addon-like-pop 900ms forwards }
  @keyframes addon-like-pop{ 0%{opacity:1; transform:translate(-50%,0) scale(0.9)} 60%{opacity:1; transform:translate(-50%,-40%) scale(1.12)} 100%{opacity:0; transform:translate(-50%,-120%) scale(1.2)} }

  /* small mobile tweaks for cards */
  @media(max-width:720px){ .panel{ padding:12px } .card{ border-radius:10px } textarea{ min-height:88px } }
  `;
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  // --- Help button & modal ---
  function createHelpButton(){
    if(byId('addon-help-btn')) return;
    const btn = document.createElement('button'); btn.id = 'addon-help-btn'; btn.className = 'addon-help-btn'; btn.title = 'Help & Shortcuts'; btn.textContent = '?';
    btn.onclick = openHelpModal;
    document.body.appendChild(btn);
  }

  function openHelpModal(){
    const root = byId('viewModal');
    root.innerHTML = `
      <div class="modal addon-help-modal">
        <div class="modal-card">
          <div style=\"display:flex;justify-content:space-between;align-items:center\">
            <h3>Help & Shortcuts</h3>
            <div><button class=\"small-btn\" onclick=\"closePostModal('help')\">Close</button></div>
          </div>
          <div style=\"margin-top:10px\">
            <div class=\"addon-help-grid\">
              <div><strong>Navigation</strong><div class=\"muted\">Use top nav or bottom nav on mobile</div></div>
              <div><strong>Posting</strong><div class=\"muted\">Tap the + compose button to make a quick post</div></div>
              <div><strong>Theme</strong><div class=\"muted\">Use the moon button in the top nav to toggle themes</div></div>
              <div><strong>Notifications</strong><div class=\"muted\">Ctrl+Shift+N — toggle demo notifications</div></div>
            </div>
            <div style=\"margin-top:12px\"><strong>Mobile Tips</strong><div class=\"muted\">Tap images to view; long-press not required. Cards resize for readability.</div></div>
          </div>
        </div>
      </div>
    `;
    root.style.display = 'block';
  }

  // --- Floating Quick Composer ---
  function createComposerButton(){
    if(byId('addon-compose-btn')) return;
    const btn = document.createElement('button'); btn.id='addon-compose-btn'; btn.className='addon-compose-btn'; btn.title='Quick Compose'; btn.textContent = '+';
    btn.onclick = ()=>{ // open editor modal if available
      if(window.openEditorModal){ window.openEditorModal(); } else { // fallback: focus composer textarea on feed
        showPage('feed'); setTimeout(()=>{ const t = byId('txtPost'); if(t){ t.focus(); } },120);
      }
    };
    document.body.appendChild(btn);
  }

  // --- Auto-refresh news button (adds to Market header) ---
  function injectNewsRefresh(){
    const header = qs('#marketPage .panel'); if(!header) return; if(byId('addon-news-refresh')) return;
    const btn = document.createElement('button'); btn.id='addon-news-refresh'; btn.className='small-btn'; btn.style.marginLeft='8px'; btn.textContent='🔄 Refresh News';
    btn.onclick = ()=>{ if(window.loadNewsFeed) window.loadNewsFeed(); else showToast('Refresh not available'); };
    header.appendChild(btn);
  }

  // --- Hashtag detection enhancer (re-scan posts area) ---
  function enhanceHashtags(){
    // post rendering already creates links; this scans for raw hashtags in dynamic parts and converts them
    const container = byId('postsList'); if(!container) return;
    qsa('#postsList .post .text').forEach(el=>{
      if(el.dataset.enhanced) return; // only once
      el.innerHTML = el.innerHTML.replace(/#([a-zA-Z0-9_]+)/g, (m, tag)=>`<a href=\"javascript:void(0)\" onclick=\"filterByTag('${encodeURIComponent('#'+tag)}')\" class=\"tag\">#${tag}</a>`);
      el.dataset.enhanced = '1';
    });
  }

  // Observe postsList for changes and enhance hashtags
  function watchPostsForHashtags(){
    const root = byId('postsList'); if(!root) return;
    const mo = new MutationObserver(()=>{ enhanceHashtags(); });
    mo.observe(root, { childList:true, subtree:true });
    // initial run
    setTimeout(enhanceHashtags, 400);
  }

  // --- Sound alert for notifications ---
  const notifAudio = new Audio(); // tiny beep via data URI (short sine tone)
  // a short click sound (base64 wav) - generated tiny beep
  notifAudio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='; // placeholder silent, browsers may block; play user action required
  function playNotifSound(){ try{ notifAudio.currentTime=0; notifAudio.play().catch(()=>{}); }catch(e){} }

  // Hook into addNotification to play sound (wrap if exists)
  const origAddNotif = window.addNotification;
  window.addNotification = function(username,type,text,meta){
    if(origAddNotif) origAddNotif(username,type,text,meta);
    // play sound for current user if notification for them
    const cur = localStorage.getItem('se_current');
    if(!cur) return;
    if(username === cur){ playNotifSound(); }
  };

  // --- Profile visit counter ---
  function incrProfileVisit(username){ if(!username) return; const visits = load(LS_PROFILE_VISITS, {}); visits[username] = (visits[username]||0)+1; save(LS_PROFILE_VISITS, visits); renderProfileVisitCount(username); }
  function renderProfileVisitCount(username){ const header = byId('profileHeader'); if(!header) return; const visits = load(LS_PROFILE_VISITS, {}); let node = header.querySelector('.addon-visit-count'); if(!node){ node = document.createElement('div'); node.className='addon-visit-count muted'; node.style.marginTop='8px'; header.appendChild(node); } node.textContent = 'Profile visits: ' + (visits[username]||0); }
  // patch showProfile to increment
  if(window.showProfile){ const _sp = window.showProfile; window.showProfile = function(u){ _sp(u); const name = u || localStorage.getItem('se_current'); setTimeout(()=>{ incrProfileVisit(name); }, 200); } }

  // --- Like animation: wrap toggleLike to generate floating heart ---
  if(window.toggleLike){ const _origLike = window.toggleLike; window.toggleLike = function(postId){
    // find button location
    const btn = document.querySelector(`[onclick*="toggleLike(${postId})"]`);
    if(btn){ const rect = btn.getBoundingClientRect(); const heart = document.createElement('div'); heart.className='like-float'; heart.style.left = (rect.left + rect.width/2)+'px'; heart.style.top = (rect.top)+'px'; heart.style.color='var(--accent)'; heart.style.fontSize='22px'; heart.textContent='❤'; document.body.appendChild(heart); setTimeout(()=>heart.remove(),900); }
    _origLike(postId);
  }; }

  // --- Daily quote banner ---
  const quotes = [
    "Start where you are. Use what you have. Do what you can.",
    'Small daily improvements are the key to staggering long-term results.',
    'Study while others are sleeping. Work while others are loafing. Prepare while others are playing.',
    'Be curious. Read widely. Try new things.'
  ];
  function showDailyQuote(){
    const feed = byId('feedPage'); if(!feed) return;
    // only once per day (store date)
    const last = localStorage.getItem(LS_DAILY_QUOTE);
    const today = new Date().toDateString();
    let quote = load(LS_DAILY_QUOTE, null);
    if(!last || last !== today){ // pick new
      const q = quotes[Math.floor(Math.random()*quotes.length)];
      localStorage.setItem(LS_DAILY_QUOTE, today);
      localStorage.setItem(LS_DAILY_QUOTE+'_text', q);
      quote = q;
    } else {
      quote = localStorage.getItem(LS_DAILY_QUOTE+'_text') || quotes[0];
    }
    // inject banner at top of feed panel
    const panel = feed.querySelector('.panel'); if(!panel) return;
    if(panel.querySelector('.daily-quote')) return; // already
    const div = document.createElement('div'); div.className='daily-quote'; div.innerHTML = `<div class=\"q\">${escapeHtml(quote)}</div><div style=\"margin-left:auto\"><button class=\"small-btn\" onclick=\"this.parentElement.parentElement.remove()\">Close</button></div>`;
    panel.insertBefore(div, panel.firstChild);
  }

  // --- Init: create UI and watchers ---
  function initAddon(){
    createHelpButton();
    createComposerButton();
    injectNewsRefresh();
    watchPostsForHashtags();
    showDailyQuote();

    // ensure mobile nav visible logic consistent
    function adaptNav(){ const top = document.getElementById('navTop'); const bottom = document.getElementById('navBottom'); if(window.innerWidth <= 720){ if(top) top.style.display='none'; if(bottom) bottom.style.display='flex'; } else { if(top) top.style.display='flex'; if(bottom) bottom.style.display='none'; } }
    window.addEventListener('resize', adaptNav); adaptNav();
  }

  document.addEventListener('DOMContentLoaded', initAddon);

  // expose some debug helpers
  window.addon_showHelp = openHelpModal;
  window.addon_showDailyQuote = showDailyQuote;

})();

/* =========================
   THEME TOGGLE FIX
   ========================= */
(function setupThemeToggle(){
  const btn = document.createElement('button');
  btn.id = 'themeToggle';
  btn.textContent = '🌙';
  btn.title = 'Toggle Dark/Light Mode';
  Object.assign(btn.style, {
    position: 'fixed',
    top: '10px',
    right: '16px',
    zIndex: 1000,
    padding: '10px 12px',
    borderRadius: '50%',
    background: 'var(--card)',
    color: 'var(--text)',
    border: 'none',
    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
    cursor: 'pointer',
  });
  document.body.appendChild(btn);

  function applyTheme(t){
    document.body.classList.toggle('light', t === 'light');
    localStorage.setItem(LS_THEME, t);
    btn.textContent = t === 'light' ? '🌙' : '☀️';
  }

  // Initialize
  let theme = localStorage.getItem(LS_THEME) || 'dark';
  applyTheme(theme);

  // Toggle
  btn.addEventListener('click', ()=>{
    theme = (theme === 'light') ? 'dark' : 'light';
    applyTheme(theme);
    showToast(theme === 'light' ? '☀️ Light mode on' : '🌙 Dark mode on');
  });
})();
