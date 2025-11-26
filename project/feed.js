/* feed.js
 *
 * Main client-side application for the demo Social Dashboard.
 * This file manages:
 * - application state (posts, categories, notifications, anonymous posts, etc.)
 * - rendering of UI panels (feed, profile, news, anonymous room, communities, etc.)
 * - modals, toasts, lightbox, and accessibility helpers
 * - event wiring for forms, buttons, keyboard shortcuts
 *
 * For students: each function is commented to explain its role. The code keeps
 * state in-memory and persists to localStorage so you can inspect and modify it.
 *
 * Important keys in localStorage:
 * - userProfile (object): the logged-in user's profile (name, avatar, bio, ...)
 * - amu_posts, amu_categories, amu_notifications, amu_anonymous_posts, amu_communities
 *
 * NOTE: This is a demo app — in production you would replace localStorage usage
 * with server APIs, authentication, and more robust persistence and security.
 */
(() => {
  // KEY: central names for localStorage keys used across the app
  const KEY = {
    CATEGORIES: 'amu_categories',
    POSTS: 'amu_posts',
    NOTIFS: 'amu_notifications',
    PROFILE: 'userProfile', // feed.js reads/writes this to get logged-in user
    THEME: 'theme',
    ANON: 'amu_anonymous_posts',
    LAST_TAB: 'amu_last_tab',
    SETTINGS: 'amu_settings',
    COMMUNITIES: 'amu_communities',
    ANON_PROFILE: 'amu_anon_profile'
  };

  // ---------------------------------------------------------------------------
  // Seed / default data: used when localStorage is empty — makes the demo usable
  // ---------------------------------------------------------------------------
  const seedFriends = [
    { id:1, name:'Emily', avatar:'https://i.pravatar.cc/40?img=1', online:true },
    { id:2, name:'Fiona', avatar:'https://i.pravatar.cc/40?img=2', online:true },
    { id:3, name:'Jennifer', avatar:'https://i.pravatar.cc/40?img=3', online:false },
    { id:4, name:'Anne', avatar:'https://i.pravatar.cc/40?img=4', online:false },
    { id:5, name:'Andrew', avatar:'https://i.pravatar.cc/40?img=5', online:true }
  ];

  const defaultCategories = [
    { id:1, name:'Photography' },
    { id:2, name:'Technology' },
    { id:3, name:'Lifestyle' },
    { id:4, name:'Space' }
  ];

  // A couple of starter posts so the feed isn't empty on first load
  const defaultPosts = [
    {
      id:101,
      author:{name:'Amandine', avatar:'https://i.pravatar.cc/48?img=12'},
      createdAt: Date.now()-5*3600*1000,
      text:'Just took a late walk through the hills. The light was incredible.',
      image:'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&q=60&auto=format&fit=crop',
      categoryId:1,
      likes:89,
      shares:1,
      liked:false,
      comments: [
        { id: 1001, author:{name:'Emily', avatar:'https://i.pravatar.cc/36?img=1'}, text: 'So beautiful!', createdAt: Date.now()-4.5*3600*1000, replies:[
            { id: 1101, author:{name:'Amandine', avatar:'https://i.pravatar.cc/48?img=12'}, text: 'Thanks Emily!', createdAt: Date.now()-4.2*3600*1000 }
          ]
        },
        { id: 1002, author:{name:'Fiona', avatar:'https://i.pravatar.cc/36?img=2'}, text: 'Where is that?', createdAt: Date.now()-4*3600*1000, replies:[] }
      ]
    },
    {
      id:102,
      author:{name:'Casie', avatar:'https://i.pravatar.cc/48?img=45'},
      createdAt: Date.now()-36*3600*1000,
      text:'Foggy mornings are my favorite. Coffee + mist = mood.',
      image:'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=60&auto=format&fit=crop',
      categoryId:3,
      likes:25,
      shares:0,
      liked:false,
      comments: []
    }
  ];

  // ---------------------------------------------------------------------------
  // Application state (in-memory), persisted to localStorage by saveState()
  // ---------------------------------------------------------------------------
  let categories = JSON.parse(localStorage.getItem(KEY.CATEGORIES) || 'null') || defaultCategories.slice();
  let posts = JSON.parse(localStorage.getItem(KEY.POSTS) || 'null') || defaultPosts.slice();
  let notifications = JSON.parse(localStorage.getItem(KEY.NOTIFS) || 'null') || [{ id:1, text:'Welcome to your feed!', createdAt: Date.now()-3600*1000, avatar:'https://i.pravatar.cc/36?img=10' }];
  const friends = seedFriends.slice();
  let anonymousPosts = JSON.parse(localStorage.getItem(KEY.ANON) || 'null') || [];
  let communities = JSON.parse(localStorage.getItem(KEY.COMMUNITIES) || 'null') || [
    { id:1, name:'UI/UX Designers', members:54, description:'Designers sharing UI patterns' },
    { id:2, name:'Frontend Developers', members:16, description:'Frontend tips & discussion' }
  ];
  let activeCategoryId = null;

  // NEW: when another user is being "viewed" (stalked), viewedProfileUser holds that user's minimal profile
  let viewedProfileUser = null;

  // Cute anonymous avatars (replaces ABCD letters)
  const ANON_AVATARS = [
    { id: 'anon-1', name: 'Kitty', src: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><rect width='100%' height='100%' fill='#fff7f7'/><text x='50%' y='58%' dominant-baseline='middle' text-anchor='middle' font-size='28' fill='#ff6b81'>🐱</text></svg>`) },
    { id: 'anon-2', name: 'Puppy', src: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><rect width='100%' height='100%' fill='#f7fff6'/><text x='50%' y='58%' dominant-baseline='middle' text-anchor='middle' font-size='28' fill='#3fb24a'>🐶</text></svg>`) },
    { id: 'anon-3', name: 'Foxy', src: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><rect width='100%' height='100%' fill='#fff8ec'/><text x='50%' y='58%' dominant-baseline='middle' text-anchor='middle' font-size='26' fill='#ff7a2d'>🦊</text></svg>`) },
    { id: 'anon-4', name: 'Bunny', src: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><rect width='100%' height='100%' fill='#eef9ff'/><text x='50%' y='58%' dominant-baseline='middle' text-anchor='middle' font-size='26' fill='#2b9bd6'>🐰</text></svg>`) }
  ];

  // ---------------------------------------------------------------------------
  // DOM references cached once for performance
  // ---------------------------------------------------------------------------
  const friendsList = document.getElementById('friends-list');
  const feedEl = document.getElementById('feed');
  const notifList = document.getElementById('notif-list');
  const commList = document.getElementById('communities-list');
  const themeToggle = document.getElementById('theme-toggle');
  const clearNotifsBtn = document.getElementById('clear-notifs');
  const postForm = document.getElementById('post-form');
  const postText = document.getElementById('post-text');
  const addImageBtn = document.getElementById('add-image-btn');
  const postImage = document.getElementById('post-image');
  const preview = document.getElementById('preview');
  const postCategorySelect = document.getElementById('post-category');
  const newCategoryBtn = document.getElementById('new-category-btn');
  const categoriesContent = document.getElementById('categories-content');
  const globalSearch = document.getElementById('global-search');
  const navList = document.getElementById('nav-list');

  // modal & toast roots
  const modalRoot = document.getElementById('modal-root');
  const toastRoot = document.getElementById('toast-container');

  // Top stories refs
  const topStoriesList = document.getElementById('top-stories-list');
  const moreNewsBtn = document.getElementById('more-news-btn');

  // settings menu controls
  const settingsBtn = document.getElementById('settings-btn');
  const settingsMenu = document.getElementById('settings-menu');
  const settingPrivBtn = document.getElementById('settingPriv');
  const helpBtn = document.getElementById('helpBtn');
  const modeBtn = document.getElementById('modeBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  // keep anonymous preview data in memory while user composes an anon post
  let anonPreviewData = null;

  // ---------------------------------------------------------------------------
  // Utility helpers
  // ---------------------------------------------------------------------------
  /**
   * saveState()
   * Persist the in-memory arrays to localStorage so the demo state survives reloads.
   */
  function saveState(){
    try {
      localStorage.setItem(KEY.CATEGORIES, JSON.stringify(categories));
      localStorage.setItem(KEY.POSTS, JSON.stringify(posts));
      localStorage.setItem(KEY.NOTIFS, JSON.stringify(notifications));
      localStorage.setItem(KEY.ANON, JSON.stringify(anonymousPosts));
      localStorage.setItem(KEY.COMMUNITIES, JSON.stringify(communities));
    } catch (e) {
      console.warn('saveState() failed', e);
    }
  }

  /**
   * escapeHtml(s)
   * Simple utility to escape text before inserting into HTML to avoid XSS in this demo.
   */
  function escapeHtml(s){ if(!s && s!==0) return ''; return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

  /**
   * timeAgo(ts)
   * Convert a timestamp in ms to a short human-friendly relative string.
   */
  function timeAgo(ts){ const s=Math.floor((Date.now()-ts)/1000); if(s<10) return 'just now'; if(s<60) return s+'s'; const m=Math.floor(s/60); if(m<60) return m+'m'; const h=Math.floor(m/60); if(h<24) return h+'h'; const d=Math.floor(h/24); if(d<7) return d+'d'; return new Date(ts).toLocaleDateString(); }

  /**
   * debounce(fn, wait)
   * Returns a debounced version of fn — useful for input events like search.
   */
  function debounce(fn, wait=220){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), wait); }; }

  // ---------------------------------------------------------------------------
  // Small SVG icon helpers — return inline SVG used in buttons
  // ---------------------------------------------------------------------------
  function svgLike(fill = 'none', stroke = 'currentColor') {
    return `<svg viewBox="0 0 24 24" fill="${fill}" stroke="${stroke}" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.69l-1.06-1.08a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;
  }
  function svgComment() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`; }
  function svgShare() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>`; }
  function svgMenu() {
    return `<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden="true"><circle cx="6" cy="12" r="2"></circle><circle cx="12" cy="12" r="2"></circle><circle cx="18" cy="12" r="2"></circle></svg>`;
  }

  // ---------------------------------------------------------------------------
  // Toast (ephemeral in-app notifications)
  // ---------------------------------------------------------------------------
  /**
   * toast(message, opts)
   * Show a small message to the user. Auto-hides after a timeout.
   */
  function toast(message, opts = {}) {
    if(!toastRoot) return;
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    const div = document.createElement('div');
    div.className = 'toast';
    div.id = id;
    div.innerHTML = `<div>${escapeHtml(message)}</div>`;
    toastRoot.appendChild(div);
    requestAnimationFrame(()=> div.classList.add('show'));
    const timeout = opts.timeout || 3500;
    setTimeout(()=> {
      div.classList.remove('show');
      setTimeout(()=> div.remove(), 220);
    }, timeout);
  }

  // ---------------------------------------------------------------------------
  // Settings menu aria state helper
  // ---------------------------------------------------------------------------
  function setSettingsOpen(open) {
    if(!settingsBtn || !settingsMenu) return;
    settingsBtn.setAttribute('aria-expanded', String(Boolean(open)));
    settingsMenu.style.display = open ? 'block' : 'none';
    settingsMenu.setAttribute('aria-hidden', String(!open));
    if(open) {
      updateModeButtonLabel();
    }
  }
  if(settingsBtn && settingsMenu) {
    // toggle settings menu open/close on click
    settingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = settingsMenu.style.display === 'block';
      setSettingsOpen(!isOpen);
    });
    // close settings when clicking outside
    document.addEventListener('click', function(e) {
      if (!settingsBtn.contains(e.target) && !settingsMenu.contains(e.target)) {
        setSettingsOpen(false);
      }
    });
    // keyboard handlers for accessibility
    settingsBtn.addEventListener('keydown', (e) => {
      if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); setSettingsOpen(!(settingsMenu.style.display === 'block')); }
      if(e.key === 'Escape') setSettingsOpen(false);
    });
  }

  // ---------------------------------------------------------------------------
  // Modal: accessible dialog helper that returns a Promise for result
  // ---------------------------------------------------------------------------
  /**
   * openModal(options)
   * options: { title, html, input (bool), placeholder, confirmText, cancelText, width }
   *
   * When input=true a textarea is added and the promise resolves with the textarea value
   * Otherwise it resolves with true when confirm is clicked, null when canceled.
   */
  function openModal({ title = '', html = '', input = false, placeholder = '', confirmText = 'OK', cancelText = 'Cancel', width = 720 } = {}) {
    return new Promise((resolve) => {
      const prevFocus = document.activeElement;

      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop';
      backdrop.style.zIndex = 1100;

      const box = document.createElement('div');
      box.className = 'modal';
      box.style.maxWidth = width + 'px';
      box.setAttribute('role','dialog');
      box.setAttribute('aria-modal','true');
      box.setAttribute('aria-label', title || 'Dialog');

      box.innerHTML = `
        <div class="modal-head">
          <strong>${escapeHtml(title)}</strong>
          <div><button class="btn small modal-close" aria-label="Close dialog">✕</button></div>
        </div>
        <div class="modal-body">${html || ''}</div>
        <div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end">
          ${cancelText ? `<button class="btn small modal-cancel">${escapeHtml(cancelText)}</button>` : ''}
          <button class="btn primary modal-confirm">${escapeHtml(confirmText)}</button>
        </div>
      `;

      if(input) {
        const ta = document.createElement('textarea');
        ta.placeholder = placeholder || '';
        ta.style.width = '100%';
        ta.style.minHeight = '120px';
        ta.style.marginTop = '8px';
        const body = box.querySelector('.modal-body');
        body.insertBefore(ta, body.firstChild);
        setTimeout(()=> ta.focus(), 40);
      } else {
        setTimeout(()=> {
          const t = box.querySelector('button, a, input, textarea, [tabindex]');
          if(t) t.focus();
        }, 40);
      }

      modalRoot.appendChild(backdrop);
      modalRoot.appendChild(box);
      modalRoot.setAttribute('aria-hidden','false');
      requestAnimationFrame(()=> {
        backdrop.style.opacity = '1';
        box.classList.add('show');
      });

      // accessibility: trap focus inside modal while open
      function getFocusables(container) {
        return Array.from(container.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'));
      }

      const focusables = () => getFocusables(box);
      function trapFocus(e) {
        if(e.key === 'Tab') {
          const f = focusables();
          if(f.length === 0) { e.preventDefault(); return; }
          const first = f[0];
          const last = f[f.length - 1];
          if(e.shiftKey) {
            if(document.activeElement === first) { e.preventDefault(); last.focus(); }
          } else {
            if(document.activeElement === last) { e.preventDefault(); first.focus(); }
          }
        }
      }

      function cleanup(result) {
        document.removeEventListener('keydown', trapFocus);
        document.removeEventListener('keydown', onKeyEscape);
        box.classList.remove('show');
        backdrop.style.opacity = '0';
        setTimeout(()=> {
          backdrop.remove();
          box.remove();
          modalRoot.setAttribute('aria-hidden','true');
          try { if(prevFocus && prevFocus.focus) prevFocus.focus(); } catch(e){}
        }, 220);
        resolve(result);
      }

      box.querySelector('.modal-close').addEventListener('click', ()=> cleanup(null));
      const cancel = box.querySelector('.modal-cancel');
      if(cancel) cancel.addEventListener('click', ()=> cleanup(null));
      const confirm = box.querySelector('.modal-confirm');
      if(confirm) confirm.addEventListener('click', ()=> {
        if(input) {
          const val = box.querySelector('textarea').value;
          cleanup(val);
        } else cleanup(true);
      });

      backdrop.addEventListener('click', ()=> cleanup(null));
      function onKeyEscape(e) { if(e.key === 'Escape') cleanup(null); }
      document.addEventListener('keydown', onKeyEscape);
      document.addEventListener('keydown', trapFocus);
    });
  }

  // ---------------------------------------------------------------------------
  // Lightbox helper: open an image in a modal
  // ---------------------------------------------------------------------------
  function openImageLightbox(src, alt='') {
    openModal({ title: '', html: `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" class="lightbox-img" />`, confirmText: 'Close', cancelText: '' , width: 980});
  }

  // ---------------------------------------------------------------------------
  // Comments modal for regular (non-anonymous) posts
  // ---------------------------------------------------------------------------
  /**
   * openComments(postId)
   * Show comments for a post inside a modal and allow adding a new comment.
   */
  function openComments(postId) {
    const post = posts.find(p => p.id === postId);
    if(!post) return;

    function renderCommentsHtml(comments) {
      if(!comments || comments.length === 0) return `<div class="muted">No comments yet.</div>`;
      return comments.map(c => `
        <div style="margin-bottom:12px;padding:8px;border-radius:8px;background:transparent;">
          <div style="display:flex;gap:8px;align-items:flex-start">
            <img src="${escapeHtml(c.author.avatar)}" style="width:36px;height:36px;border-radius:50%"/>
            <div style="flex:1">
              <div style="font-weight:600">${escapeHtml(c.author.name)} <span class="muted" style="font-weight:400;font-size:12px"> • ${escapeHtml(timeAgo(c.createdAt))}</span></div>
              <div style="margin-top:6px">${escapeHtml(c.text)}</div>
              <div style="margin-top:8px"><button class="btn small reply-to-comment" data-cid="${c.id}" data-pid="${postId}">Reply</button></div>
              ${c.replies && c.replies.length ? `<div style="margin-top:8px;margin-left:44px">${c.replies.map(r=>`
                <div style="margin-bottom:8px;padding:6px;border-radius:6px;background:rgba(255,255,255,0.01)">
                  <div style="font-weight:600">${escapeHtml(r.author.name)} <span class="muted" style="font-weight:400;font-size:12px"> • ${escapeHtml(timeAgo(r.createdAt))}</span></div>
                  <div style="margin-top:6px">${escapeHtml(r.text)}</div>
                </div>
              `).join('')}</div>` : ''}
            </div>
          </div>
        </div>
      `).join('');
    }

    const html = `
      <div style="max-height:58vh;overflow:auto;padding-right:8px">
        ${renderCommentsHtml(post.comments)}
      </div>
      <div style="margin-top:12px">
        <strong>Add a comment</strong>
        <div style="margin-top:8px">
          <textarea id="__newCommentInput" placeholder="Write a comment..." style="width:100%;min-height:80px;padding:8px;border-radius:6px;border:1px solid rgba(255,255,255,0.04)"></textarea>
          <div style="margin-top:8px"><button class="btn primary" id="__submitNewComment">Post comment</button></div>
        </div>
      </div>
    `;

    openModal({ title: `Comments (${post.comments ? post.comments.length : 0})`, html, confirmText: 'Close', cancelText: '' });

    const modal = modalRoot.querySelector('.modal');
    if(!modal) return;

    const submitBtn = modal.querySelector('#__submitNewComment');
    const newCommentInput = modal.querySelector('#__newCommentInput');
    if(submitBtn && newCommentInput) {
      submitBtn.addEventListener('click', () => {
        const txt = (newCommentInput.value || '').trim();
        if(!txt) { toast('Write a comment first'); return; }
        const u = getUserProfile();
        const c = { id: Date.now() + Math.floor(Math.random()*99), author: { name: u.name, avatar: u.avatar }, text: txt, createdAt: Date.now(), replies: [] };
        post.comments = post.comments || [];
        post.comments.push(c);
        notifications.unshift({ id: Date.now(), text:'You commented on a post.', createdAt: Date.now(), avatar: u.avatar });
        saveState(); renderFeed(); renderNotifications();
        const closeBtn = modal.querySelector('.modal-close');
        if(closeBtn) closeBtn.click();
        setTimeout(()=> openComments(postId), 120);
        toast('Comment added');
      });
    }

    // Reply buttons: open a small modal to capture reply
    modal.querySelectorAll('.reply-to-comment').forEach(btn => {
      btn.addEventListener('click', async () => {
        const cid = Number(btn.dataset.cid);
        const pid = Number(btn.dataset.pid);
        const postObj = posts.find(p=>p.id===pid);
        if(!postObj) return;
        const comment = (postObj.comments || []).find(c=>c.id===cid);
        if(!comment) return;
        const replyText = await openModal({ title: `Reply to ${escapeHtml(comment.author.name)}`, input:true, placeholder:'Write your reply...', confirmText:'Reply' });
        if(replyText && replyText.trim()) {
          const u = getUserProfile();
          const reply = { id: Date.now() + Math.floor(Math.random()*99), author: { name: u.name, avatar: u.avatar }, text: replyText.trim(), createdAt: Date.now() };
          comment.replies = comment.replies || [];
          comment.replies.push(reply);
          notifications.unshift({ id: Date.now(), text:`You replied to ${comment.author.name}`, createdAt: Date.now(), avatar: u.avatar });
          saveState(); renderFeed(); renderNotifications();
          const closeBtn = modal.querySelector('.modal-close');
          if(closeBtn) closeBtn.click();
          setTimeout(()=> openComments(pid), 120);
          toast('Reply posted');
        }
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Anonymous Room — create, view, comment on anonymous posts
  // ---------------------------------------------------------------------------
  function getSavedAnonProfile() {
    try {
      const raw = localStorage.getItem(KEY.ANON_PROFILE);
      if(!raw) return { avatarId: ANON_AVATARS[0].id };
      return JSON.parse(raw);
    } catch(e){ return { avatarId: ANON_AVATARS[0].id }; }
  }
  function setSavedAnonProfile(obj) {
    try { localStorage.setItem(KEY.ANON_PROFILE, JSON.stringify(obj)); } catch(e){}
  }

  /**
   * renderAnonymousRoom()
   * Build the anonymous room UI: avatar chooser, image preview, create form,
   * and the list of anonymous posts. Also wires all handlers for anon actions.
   */
  function renderAnonymousRoom(){
    const el = document.getElementById('anonymous-content');
    if(!el) return;

    const savedAnon = getSavedAnonProfile();
    const selectedId = savedAnon.avatarId || ANON_AVATARS[0].id;

    // Render the compose area and feed container
    el.innerHTML = `
      <div class="card" style="margin-bottom:12px">
        <form id="anon-create-form" style="position:relative;">
          <textarea id="anon-text" placeholder="Share anonymously..." rows="3" aria-label="Anonymous post text" style="width:100%;padding:12px;border-radius:10px;border:1px solid rgba(255,255,255,0.04);background:transparent;"></textarea>

          <div style="display:flex;gap:12px;align-items:flex-start;margin-top:8px;">
            <div style="flex:1">
              <div class="anon-avatar-chooser" aria-hidden="false">
                ${ANON_AVATARS.map(a => `
                  <button type="button" class="anon-avatar-btn" data-id="${a.id}" title="${escapeHtml(a.name)}" aria-pressed="${a.id===selectedId}">
                    <img src="${a.src}" alt="${escapeHtml(a.name)}" />
                  </button>
                `).join('')}
              </div>
            </div>

            <div style="width:240px;flex-shrink:0;">
              <img id="anon-preview" class="anon-preview" alt="preview"/>
              <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:6px;">
                <button class="btn small" type="button" id="anon-add-image">Add image</button>
                <button class="btn small anon-remove-preview" type="button" id="anon-remove-preview" style="display:none">Remove</button>
              </div>
            </div>
          </div>

          <div style="display:flex;justify-content:flex-end;margin-top:8px">
            <button class="btn primary" type="submit">Post anonymously</button>
          </div>

          <input id="anon-image" type="file" accept="image/*" style="display:none">
        </form>
      </div>
      <div id="anon-feed-list"></div>
    `;

    const feedContainer = document.getElementById('anon-feed-list');
    if(!feedContainer) return;

    // Bind UI for image preview & avatar chooser
    const anonImageInput = document.getElementById('anon-image');
    const anonAddImageBtn = document.getElementById('anon-add-image');
    const anonPreviewEl = document.getElementById('anon-preview');
    const anonRemoveBtn = document.getElementById('anon-remove-preview');

    if(anonPreviewData) {
      anonPreviewEl.src = anonPreviewData;
      anonPreviewEl.style.display = 'block';
      if(anonRemoveBtn) anonRemoveBtn.style.display = 'inline-block';
    } else {
      anonPreviewEl.style.display = 'none';
      if(anonRemoveBtn) anonRemoveBtn.style.display = 'none';
    }

    el.querySelectorAll('.anon-avatar-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        el.querySelectorAll('.anon-avatar-btn').forEach(b => b.setAttribute('aria-pressed','false'));
        btn.setAttribute('aria-pressed','true');
        const id = btn.dataset.id;
        setSavedAnonProfile({ avatarId: id });
      });
    });

    if(anonAddImageBtn) {
      anonAddImageBtn.addEventListener('click', () => { if(anonImageInput) anonImageInput.click(); });
    }

    if(anonImageInput) {
      anonImageInput.addEventListener('change', (e) => {
        const f = e.target.files && e.target.files[0];
        if(!f) {
          anonPreviewData = null;
          anonPreviewEl.src = '';
          anonPreviewEl.style.display = 'none';
          if(anonRemoveBtn) anonRemoveBtn.style.display = 'none';
          return;
        }
        const r = new FileReader();
        r.onload = (ev) => {
          anonPreviewData = ev.target.result;
          anonPreviewEl.src = anonPreviewData;
          anonPreviewEl.style.display = 'block';
          if(anonRemoveBtn) anonRemoveBtn.style.display = 'inline-block';
        };
        r.readAsDataURL(f);
      });
    }

    if(anonRemoveBtn) {
      anonRemoveBtn.addEventListener('click', () => {
        anonPreviewData = null;
        anonPreviewEl.src = '';
        anonPreviewEl.style.display = 'none';
        if(anonImageInput) anonImageInput.value = '';
        anonRemoveBtn.style.display = 'none';
      });
    }

    anonPreviewEl && anonPreviewEl.addEventListener('click', () => {
      if(anonPreviewData) openImageLightbox(anonPreviewData, 'Anonymous preview');
    });

    // Render the list of anonymous posts and wire their actions
    function renderAnonList(){
      if(!feedContainer) return;
      if(anonymousPosts.length === 0){
        feedContainer.innerHTML = `<div class="card muted">No anonymous posts yet.</div>`;
        return;
      }
      feedContainer.innerHTML = anonymousPosts.slice().reverse().map(p => {
        const commentCount = (p.comments && p.comments.length) ? p.comments.length : 0;
        const avatarSrc = p.avatarSrc || (ANON_AVATARS.find(a=>a.id===p.avatarId) || ANON_AVATARS[0]).src;
        return `<article class="post card" data-aid="${p.id}">
          <div class="post-head">
            <img src="${escapeHtml(avatarSrc)}" alt="Anonymous avatar" />
            <div style="flex:1">
              <div style="font-weight:600">Anonymous</div>
              <div class="muted" style="font-size:12px">${escapeHtml(timeAgo(p.createdAt || Date.now()))} • <strong>Anonymous Room</strong></div>
            </div>
            <div style="font-size:18px;opacity:.6"><button class="icon-btn menu-btn anon-menu-btn" data-id="${p.id}" title="Post menu" aria-label="Open post actions">${svgMenu()}</button></div>
          </div>
          <div class="post-body">
            <div>${escapeHtml(p.text || '')}</div>
            ${p.image ? `<img src="${escapeHtml(p.image)}" alt="anonymous image" loading="lazy">` : ''}
          </div>
          <div class="post-foot">
            <div class="actions-row" role="toolbar" aria-label="Anonymous post actions">
              <button class="action-inline anon-like-btn ${p.liked ? 'liked' : ''}" data-id="${p.id}" aria-pressed="${p.liked ? 'true' : 'false'}" aria-label="Like anonymous post">${svgLike(p.liked ? 'currentColor' : 'none')}<span class="sr-only">Like</span><span class="count" aria-hidden="true">${p.likes||0}</span></button>
              <button class="action-inline anon-comment-btn" data-id="${p.id}" aria-label="Comment on anonymous post">${svgComment()}<span class="sr-only">Comment</span><span class="count" aria-hidden="true">${commentCount}</span></button>
              <button class="action-inline anon-share-btn" data-id="${p.id}" aria-label="Share anonymous post">${svgShare()}<span class="sr-only">Share</span><span class="count" aria-hidden="true">${p.shares}</span></button>
            </div>
          </div>
        </article>`;
      }).join('');
      // attach handlers
      feedContainer.querySelectorAll('.post-body img').forEach(img => {
        img.addEventListener('click', (e) => openImageLightbox(e.currentTarget.getAttribute('src'), 'Anonymous image'));
      });

      feedContainer.querySelectorAll('.anon-like-btn').forEach(b => b.onclick = () => {
        const id = Number(b.dataset.id);
        toggleAnonLike(id);
      });

      feedContainer.querySelectorAll('.anon-share-btn').forEach(b => b.onclick = () => {
        const id = Number(b.dataset.id);
        shareAnonPost(id);
      });

      feedContainer.querySelectorAll('.anon-comment-btn').forEach(b => b.onclick = () => {
        const id = Number(b.dataset.id);
        openAnonComments(id);
      });

      feedContainer.querySelectorAll('.anon-menu-btn').forEach(b => {
        b.addEventListener('click', (e) => openAnonPostMenu(Number(b.dataset.id)));
      });
    }

    // Submit anonymous post: collects text + selected avatar + optional image preview
    const form = document.getElementById('anon-create-form');
    if(form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const ta = document.getElementById('anon-text');
        const text = (ta && ta.value || '').trim();
        if(!text && !anonPreviewData) { toast('Write something first'); return; }
        const saved = getSavedAnonProfile();
        const avatar = ANON_AVATARS.find(a => a.id === saved.avatarId) || ANON_AVATARS[0];
        const p = { id: Date.now(), text, createdAt: Date.now(), image: anonPreviewData || null, likes:0, shares:0, liked:false, comments: [], avatarId: avatar.id, avatarSrc: avatar.src };
        anonymousPosts.push(p);
        saveState();
        // reset UI
        if(ta) ta.value = '';
        anonPreviewData = null;
        if(anonImageInput) anonImageInput.value = '';
        if(anonPreviewEl) { anonPreviewEl.src = ''; anonPreviewEl.style.display = 'none'; }
        if(anonRemoveBtn) anonRemoveBtn.style.display = 'none';
        // re-render
        renderAnonymousRoom();
        toast('Anonymous post added');
      });
    }

    renderAnonList();
  }

  // Anonymous comments modal
  function openAnonComments(anonId) {
    const post = anonymousPosts.find(p => p.id === anonId);
    if(!post) return;

    function renderCommentsHtml(comments) {
      if(!comments || comments.length === 0) return `<div class="muted">No comments yet.</div>`;
      return comments.map(c => `
        <div style="margin-bottom:12px;padding:8px;border-radius:8px;background:transparent;">
          <div style="display:flex;gap:8px;align-items:flex-start">
            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36'%3E%3Ccircle cx='18' cy='12' r='8' fill='%23b3cde0'/%3E%3Cpath d='M2 36c0-4 4-6 16-6s16 2 16 6' fill='%23dbeef6'/%3E%3C/svg%3E" style="width:36px;height:36px;border-radius:50%"/>
            <div style="flex:1">
              <div style="font-weight:600">Anonymous <span class="muted" style="font-weight:400;font-size:12px"> • ${escapeHtml(timeAgo(c.createdAt))}</span></div>
              <div style="margin-top:6px">${escapeHtml(c.text)}</div>
              <div style="margin-top:8px"><button class="btn small reply-to-anon-comment" data-cid="${c.id}" data-pid="${anonId}">Reply</button></div>
              ${c.replies && c.replies.length ? `<div style="margin-top:8px;margin-left:44px">${c.replies.map(r=>`
                <div style="margin-bottom:8px;padding:6px;border-radius:6px;background:rgba(255,255,255,0.01)">
                  <div style="font-weight:600">Anonymous <span class="muted" style="font-weight:400;font-size:12px"> • ${escapeHtml(timeAgo(r.createdAt))}</span></div>
                  <div style="margin-top:6px">${escapeHtml(r.text)}</div>
                </div>
              `).join('')}</div>` : ''}
            </div>
          </div>
        </div>
      `).join('');
    }

    const html = `
      <div style="max-height:58vh;overflow:auto;padding-right:8px">
        ${renderCommentsHtml(post.comments)}
      </div>
      <div style="margin-top:12px">
        <strong>Add a comment (anonymous)</strong>
        <div style="margin-top:8px">
          <textarea id="__newAnonCommentInput" placeholder="Write a comment..." style="width:100%;min-height:80px;padding:8px;border-radius:6px;border:1px solid rgba(255,255,255,0.04)"></textarea>
          <div style="margin-top:8px"><button class="btn primary" id="__submitNewAnonComment">Post comment</button></div>
        </div>
      </div>
    `;
    openModal({ title: `Comments (${post.comments ? post.comments.length : 0})`, html, confirmText: 'Close', cancelText: '' });

    const modal = modalRoot.querySelector('.modal');
    if(!modal) return;

    const submitBtn = modal.querySelector('#__submitNewAnonComment');
    const newCommentInput = modal.querySelector('#__newAnonCommentInput');
    if(submitBtn && newCommentInput) {
      submitBtn.addEventListener('click', () => {
        const txt = (newCommentInput.value || '').trim();
        if(!txt) { toast('Write a comment first'); return; }
        const c = { id: Date.now() + Math.floor(Math.random()*99), text: txt, createdAt: Date.now(), replies: [] };
        post.comments = post.comments || [];
        post.comments.push(c);
        saveState(); renderAnonymousRoom();
        const closeBtn = modal.querySelector('.modal-close');
        if(closeBtn) closeBtn.click();
        setTimeout(()=> openAnonComments(anonId), 120);
        toast('Comment added');
      });
    }

    modal.querySelectorAll('.reply-to-anon-comment').forEach(btn => {
      btn.addEventListener('click', async () => {
        const cid = Number(btn.dataset.cid);
        const pid = Number(btn.dataset.pid);
        const p = anonymousPosts.find(x => x.id === pid);
        if(!p) return;
        const comment = (p.comments || []).find(c => c.id === cid);
        if(!comment) return;
        const replyText = await openModal({ title: `Reply (anonymous)`, input:true, placeholder:'Write your reply...', confirmText:'Reply' });
        if(replyText && replyText.trim()) {
          const reply = { id: Date.now() + Math.floor(Math.random()*99), text: replyText.trim(), createdAt: Date.now() };
          comment.replies = comment.replies || [];
          comment.replies.push(reply);
          saveState(); renderAnonymousRoom();
          const closeBtn = modal.querySelector('.modal-close');
          if(closeBtn) closeBtn.click();
          setTimeout(()=> openAnonComments(pid), 120);
          toast('Reply posted');
        }
      });
    });
  }

  // Anonymous post menu actions (copy, report, delete)
  function openAnonPostMenu(anonId){
    const post = anonymousPosts.find(p => p.id === anonId);
    if(!post) return;
    const html = `
      <div style="display:flex;flex-direction:column;gap:8px">
        <button class="btn small" id="pm-copy-anon">Copy text</button>
        <button class="btn small" id="pm-report-anon" style="background:rgba(255,75,75,0.06)">Report</button>
        <button class="btn small" id="pm-delete-anon" style="background:rgba(255,75,75,0.12)">Delete</button>
      </div>
    `;
    openModal({ title: 'Post actions', html, confirmText: 'Close', cancelText: '' });
    const modal = modalRoot.querySelector('.modal'); if(!modal) return;
    const copyBtn = modal.querySelector('#pm-copy-anon');
    const reportBtn = modal.querySelector('#pm-report-anon');
    const delBtn = modal.querySelector('#pm-delete-anon');

    if(copyBtn) copyBtn.onclick = () => {
      const text = post.text + (post.image ? '\n' + post.image : '');
      navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(text).then(()=> toast('Copied')) : toast('Copy not supported');
    };
    if(reportBtn) reportBtn.onclick = () => {
      notifications.unshift({ id:Date.now(), text: 'Reported anonymous post (demo)', createdAt: Date.now(), avatar: getUserProfile().avatar });
      saveState(); renderNotifications();
      toast('Reported (demo)');
    };
    if(delBtn) delBtn.onclick = () => {
      if(!confirm('Delete this anonymous post?')) return;
      anonymousPosts = anonymousPosts.filter(p => p.id !== anonId);
      saveState(); renderAnonymousRoom(); toast('Anonymous post deleted');
      const closeBtn = modal.querySelector('.modal-close');
      if(closeBtn) closeBtn.click();
    };
  }

  // Like and share helpers for anonymous posts
  function toggleAnonLike(id){
    anonymousPosts = anonymousPosts.map(p => p.id===id ? {...p, liked: !p.liked, likes: (!p.liked ? (p.likes||0)+1 : Math.max(0,(p.likes||0)-1)) } : p);
    saveState();
    renderAnonymousRoom();
  }

  function shareAnonPost(id){
    const p = anonymousPosts.find(x=>x.id===id); if(!p) return;
    const text = (p.text || '') + (p.image ? '\n' + p.image : '');
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(() => {
        notifications.unshift({id:Date.now(), text:'Copied anonymous post to clipboard!', createdAt: Date.now(), avatar:'https://i.pravatar.cc/36?img=65'});
        saveState(); renderNotifications();
        toast('Copied anonymous post to clipboard!');
      }).catch(()=> {
        notifications.unshift({id:Date.now(), text:'Clipboard failed.', createdAt: Date.now(), avatar:'https://i.pravatar.cc/36?img=65'});
        saveState(); renderNotifications();
        toast('Clipboard failed');
      });
    } else {
      notifications.unshift({id:Date.now(), text:'Clipboard not supported.', createdAt: Date.now(), avatar:'https://i.pravatar.cc/36?img=65'});
      saveState(); renderNotifications();
      toast('Clipboard not supported');
    }
  }

  // ---------------------------------------------------------------------------
  // Renderers: friends, notifications, categories, communities, feed panels
  // ---------------------------------------------------------------------------

  /**
   * renderFriends()
   * Render list of friends on the left sidebar. Clicking a friend opens that user's
   * profile (stalk view).
   */
  function renderFriends(){
    if(!friendsList) return;
    friendsList.innerHTML = '';
    friends.forEach(f=>{
      const d = document.createElement('div'); d.className='friend';
      d.style.cursor = 'pointer';
      d.setAttribute('role','button');
      d.setAttribute('tabindex','0');
      d.innerHTML = `<img src="${f.avatar}" alt="${escapeHtml(f.name)}"/><div style="flex:1"><div style="font-weight:600">${escapeHtml(f.name)}</div><div class="muted">${f.online?'Online':'Offline'}</div></div><div style="width:10px;height:10px;border-radius:50%;background:${f.online?'#34d399':'#94a3b8'}"></div>`;
      // Clicking a friend opens their profile page (stalking)
      d.addEventListener('click', () => {
        openProfileView({ name: f.name, avatar: f.avatar });
      });
      d.addEventListener('keydown', (e) => { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openProfileView({ name: f.name, avatar: f.avatar }); } });
      friendsList.appendChild(d);
    });
  }

  /**
   * renderNotifications()
   * Render small list of notifications in the sidebar.
   */
  function renderNotifications(){
    if(!notifList) return;
    notifList.innerHTML = '';
    if(notifications.length===0){ notifList.innerHTML='<div class="muted">No notifications</div>'; updateSideBadges(); return; }
    notifications.forEach(n=>{
      const row = document.createElement('div'); row.style.display='flex'; row.style.gap='8px'; row.style.marginBottom='8px';
      row.innerHTML = `<img src="${escapeHtml(n.avatar)}" style="width:36px;height:36px;border-radius:50%"/><div><div style="font-weight:600">${escapeHtml(n.text)}</div><div class="muted" style="font-size:12px">${escapeHtml(timeAgo(n.createdAt||Date.now()))}</div></div>`;
      notifList.appendChild(row);
    });
    updateSideBadges();
  }

  // small helper to map category id to readable name
  function getCategoryName(id){ if(!id) return 'Uncategorized'; const c = categories.find(x=>x.id===id); return c ? c.name : 'Uncategorized'; }

  /**
   * renderPostCategoryOptions()
   * Fill the "create post" select with available categories from state.
   */
  function renderPostCategoryOptions(){
    if(!postCategorySelect) return;
    postCategorySelect.innerHTML='';
    const none = document.createElement('option'); none.value=''; none.textContent='— None —'; postCategorySelect.appendChild(none);
    categories.forEach(c => { const o=document.createElement('option'); o.value=c.id; o.textContent=c.name; postCategorySelect.appendChild(o); });
  }

  // ---------------------------------------------------------------------------
  // Profile view code: open gallery (modal) and full profile tab view
  // ---------------------------------------------------------------------------

  /**
   * openProfileView(user)
   * Navigate to profile tab and set viewedProfileUser — this is what allows users
   * to "stalk" other users' profiles. `user` is an object { name, avatar?, bio? }.
   */
  function openProfileView(user) {
    viewedProfileUser = user || null; // null => own profile
    setActiveTab('profile');
    renderProfile(false);
  }

  /**
   * openProfileGallery(author)
   * Show a modal gallery of a user's posts (used from the friends list and post avatars).
   * The modal includes an "Open profile" button that sends the user to the profile tab.
   */
  function openProfileGallery(author) {
    const current = getUserProfile();
    const viewed = author && author.name ? author : current;
    const viewedName = viewed.name;
    const avatar = viewed.avatar || (function(){
      const p = posts.find(pp => (pp.author && pp.author.name === viewedName) || (pp.author_name && pp.author_name === viewedName));
      return p ? (p.author && p.author.avatar) || p.author_avatar || current.avatar : current.avatar;
    })();

    // Find posts authored by the viewed person (checks both author.name and author_name for compatibility)
    const userPosts = posts.filter(p => {
      const an = (p.author && p.author.name) || p.author_name || '';
      if(!an) return false;
      return an.toLowerCase() === (viewedName || '').toLowerCase();
    });

    const html = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
        <div style="display:flex;gap:12px;align-items:center">
          <img src="${escapeHtml(avatar)}" alt="${escapeHtml(viewedName)}" style="width:56px;height:56px;border-radius:50%;object-fit:cover">
          <div>
            <strong>${escapeHtml(viewedName)}</strong>
            <div class="muted" style="font-size:13px">${userPosts.length} posts</div>
          </div>
        </div>
        <div>
          ${ viewedName === current.name ? '<button class="btn small" id="openProfileFromGallery">Open profile</button>' : `<button class="btn small" id="openProfileFromGalleryOther">Open profile</button>` }
        </div>
      </div>
      <div style="margin-top:12px">
        ${userPosts.length === 0 ? `<div class="muted">No posts yet.</div>` : `<div class="profile-gallery-grid">
          ${userPosts.map(p => {
            const thumb = p.image ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml((p.text||'').slice(0,60))}">` : `<div class="pg-txt">${escapeHtml((p.text||'').slice(0,120))}</div>`;
            return `<button class="profile-gallery-item" data-id="${p.id}" aria-label="Open post">${thumb}</button>`;
          }).join('')}
        </div>`}
      </div>
    `;
    openModal({ title: `${escapeHtml(viewedName)} — Gallery`, html, confirmText: 'Close', cancelText: '' });

    const modal = modalRoot.querySelector('.modal');
    if(!modal) return;

    // Open selected post in lightbox/modal when clicked
    modal.querySelectorAll('.profile-gallery-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = Number(btn.dataset.id);
        const post = posts.find(p => p.id === id);
        if(!post) return;
        if(post.image) {
          openImageLightbox(post.image, post.text || '');
        } else {
          openModal({
            title: `${escapeHtml(timeAgo(post.createdAt || Date.now()))}`,
            html: `<div style="margin-top:8px">${escapeHtml(post.text || '')}</div>`,
            confirmText: 'Close',
            cancelText: ''
          });
        }
      });
    });

    // "Open profile" button: goes to profile tab and sets viewedProfileUser appropriately
    const openProfileBtn = modal.querySelector('#openProfileFromGallery');
    if(openProfileBtn) openProfileBtn.addEventListener('click', () => {
      const closeBtn = modal.querySelector('.modal-close');
      if(closeBtn) closeBtn.click();
      setTimeout(() => {
        viewedProfileUser = null; // own profile
        setActiveTab('profile');
        renderProfile(false);
      }, 160);
    });

    const openProfileOtherBtn = modal.querySelector('#openProfileFromGalleryOther');
    if(openProfileOtherBtn) openProfileOtherBtn.addEventListener('click', () => {
      const closeBtn = modal.querySelector('.modal-close');
      if(closeBtn) closeBtn.click();
      setTimeout(() => {
        viewedProfileUser = { name: viewedName, avatar: avatar }; // view other person's profile
        setActiveTab('profile');
        renderProfile(false);
      }, 160);
    });
  }

  // ---------------------------------------------------------------------------
  // Feed renderer and wiring for post actions (like/share/comment/menu)
  // ---------------------------------------------------------------------------

  /**
   * renderFeed()
   * Render visible posts into the main feed panel, applying search and category filter.
   * Attaches button handlers for like, share, comment and post menu.
   */
  function renderFeed(){
    if(!feedEl) return;
    const q = (globalSearch && globalSearch.value || '').trim().toLowerCase();
    let visible = posts.slice();

    if(activeCategoryId) visible = visible.filter(p => p.categoryId === activeCategoryId);

    if(q){
      visible = visible.filter(p => (p.text||'').toLowerCase().includes(q) || (p.author && p.author.name || '').toLowerCase().includes(q) || getCategoryName(p.categoryId).toLowerCase().includes(q));
    }

    feedEl.innerHTML = '';
    if(visible.length === 0){ feedEl.innerHTML = `<div class="card muted">No posts match your filters.</div>`; return; }

    visible.forEach(post=>{
      const art = document.createElement('article'); art.className='post card';
      const commentCount = (post.comments && post.comments.length) ? post.comments.length : 0;
      art.innerHTML = `
        <div class="post-head">
          <img src="${escapeHtml((post.author && post.author.avatar) || post.author_avatar || 'https://i.pravatar.cc/48')}" alt="${escapeHtml((post.author && post.author.name) || post.author_name || 'User')}" />
          <div style="flex:1">
            <div style="font-weight:600">${escapeHtml((post.author && post.author.name) || post.author_name || 'Unknown')}</div>
            <div class="muted" style="font-size:12px">${escapeHtml(timeAgo(post.createdAt||Date.now()))} • <strong>${escapeHtml(getCategoryName(post.categoryId))}</strong></div>
          </div>
          <div style="font-size:18px;opacity:.6"><button class="icon-btn menu-btn" data-id="${post.id}" title="Post menu" aria-label="Open post actions">${svgMenu()}</button></div>
        </div>
        <div class="post-body">
          <div>${escapeHtml(post.text)}</div>
          ${post.image?`<img src="${escapeHtml(post.image)}" alt="post image" loading="lazy">`:''}
        </div>
        <div class="post-foot">
          <div class="actions-row" role="toolbar" aria-label="Post actions">
            <button class="action-inline like-btn ${post.liked?'liked':''}" data-id="${post.id}" aria-pressed="${post.liked? 'true':'false'}" aria-label="Like post">
              ${svgLike(post.liked ? 'currentColor' : 'none')}
              <span class="sr-only">Like</span>
              <span class="count" aria-hidden="true">${post.likes}</span>
            </button>

            <button class="action-inline comment-btn" data-id="${post.id}" aria-label="Comment on post">
              ${svgComment()}
              <span class="sr-only">Comment</span>
              <span class="count" aria-hidden="true">${commentCount}</span>
            </button>

            <button class="action-inline share-btn" data-id="${post.id}" aria-label="Share post">
              ${svgShare()}
              <span class="sr-only">Share</span>
              <span class="count" aria-hidden="true">${post.shares}</span>
            </button>
          </div>
        </div>
      `;
      feedEl.appendChild(art);

      // Clicking the avatar image opens that user's profile view (stalk mode)
      const headImg = art.querySelector('.post-head img');
      if(headImg) {
        headImg.style.cursor = 'pointer';
        headImg.addEventListener('click', () => {
          const authorObj = post.author && post.author.name ? { name: post.author.name, avatar: post.author.avatar } : (post.author_name ? { name: post.author_name, avatar: post.author_avatar } : null);
          if(authorObj && authorObj.name) {
            openProfileView(authorObj);
          } else {
            openProfileGallery(post.author || { name: post.author_name });
          }
        });
        headImg.addEventListener('keydown', (e) => { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const authorObj = post.author && post.author.name ? { name: post.author.name, avatar: post.author.avatar } : (post.author_name ? { name: post.author_name, avatar: post.author_avatar } : null); if(authorObj && authorObj.name) openProfileView(authorObj); else openProfileGallery(post.author || { name: post.author_name }); } });
      }
    });

    // image click to open lightbox
    feedEl.querySelectorAll('.post-body img').forEach(img => img.onclick = (e) => {
      const src = e.currentTarget.getAttribute('src');
      openImageLightbox(src, e.currentTarget.getAttribute('alt') || '');
    });

    // wire like/share/comment/menu buttons
    feedEl.querySelectorAll('.like-btn').forEach(b => b.onclick = () => {
      const id = Number(b.dataset.id);
      toggleLike(id);
    });

    feedEl.querySelectorAll('.share-btn').forEach(b => b.onclick = () => {
      const id = Number(b.dataset.id);
      sharePost(id);
    });

    feedEl.querySelectorAll('.comment-btn').forEach(b => b.onclick = () => {
      const id = Number(b.dataset.id);
      openComments(id);
    });

    feedEl.querySelectorAll('.menu-btn').forEach(b => b.onclick = (e) => openPostMenu(e.currentTarget, Number(b.dataset.id)));
  }

  // ---------------------------------------------------------------------------
  // Post action implementations (like, share, menu)
  // ---------------------------------------------------------------------------
  function toggleLike(id){
    posts = posts.map(p => p.id===id ? {...p, liked: !p.liked, likes: (!p.liked ? p.likes+1 : Math.max(0,p.likes-1)) } : p);
    saveState();
    renderFeed();
    updateSideBadges();
  }

  /**
   * sharePost(id)
   * Copies post text (and image URL if present) to clipboard and notifies user.
   */
  function sharePost(id){
    const p = posts.find(x=>x.id===id); if(!p) return;
    let text = (p.text || '') + (p.image ? '\n' + p.image : '');
    if(p.categoryId) text += `\nCategory: ${getCategoryName(p.categoryId)}`;
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(() => {
        notifications.unshift({id:Date.now(), text:'Copied post to clipboard!', createdAt: Date.now(), avatar:'https://i.pravatar.cc/36?img=65'});
        saveState(); renderNotifications();
        toast('Copied post to clipboard!');
      }).catch(()=> {
        notifications.unshift({id:Date.now(), text:'Clipboard failed.', createdAt: Date.now(), avatar:'https://i.pravatar.cc/36?img=65'});
        saveState(); renderNotifications();
        toast('Clipboard failed');
      });
    } else {
      notifications.unshift({id:Date.now(), text:'Clipboard not supported.', createdAt: Date.now(), avatar:'https://i.pravatar.cc/36?img=65'});
      saveState(); renderNotifications();
      toast('Clipboard not supported');
    }
  }

  /**
   * openPostMenu(btn, postId)
   * Opens modal with actions: Save, Copy link, Report. If the current user
   * owns the post, also show Edit and Delete actions.
   */
  function openPostMenu(btn, postId){
    const user = getUserProfile();
    const post = posts.find(p=>p.id===postId);
    if(!post) return;

    const isOwner = ((post.author && post.author.name) || post.author_name) === user.name;

    const commonActionsHtml = `
      <div style="display:flex;flex-direction:column;gap:8px">
        <button class="btn small" id="pm-save">Save post</button>
        <button class="btn small" id="pm-copy">Copy link</button>
        <button class="btn small" id="pm-report" style="background:rgba(255,75,75,0.06)">Report</button>
      </div>
    `;

    const ownerActionsHtml = `
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px;border-top:1px dashed rgba(255,255,255,0.03);padding-top:8px">
        <button class="btn small" id="pm-edit">Edit</button>
        <button class="btn small" id="pm-delete" style="background:rgba(255,75,75,0.12)">Delete</button>
      </div>
    `;

    openModal({
      title: 'Post actions',
      html: `${commonActionsHtml}${isOwner ? ownerActionsHtml : ''}`,
      confirmText: 'Close',
      cancelText: ''
    });

    const modal = modalRoot.querySelector('.modal'); if(!modal) return;
    const saveBtn = modal.querySelector('#pm-save');
    const copyBtn = modal.querySelector('#pm-copy');
    const reportBtn = modal.querySelector('#pm-report');
    const editBtn = modal.querySelector('#pm-edit');
    const delBtn = modal.querySelector('#pm-delete');

    if(saveBtn) saveBtn.onclick = () => {
      notifications.unshift({ id:Date.now(), text:'Post saved', createdAt: Date.now(), avatar:user.avatar });
      saveState(); renderNotifications(); toast('Saved');
    };
    if(copyBtn) copyBtn.onclick = async () => {
      const link = `${location.origin}${location.pathname}#post-${postId}`;
      try {
        await navigator.clipboard.writeText(link);
        toast('Link copied');
      } catch(e) {
        toast('Copy failed');
      }
    };
    if(reportBtn) reportBtn.onclick = () => {
      openModal({ title:'Report post', input:true, placeholder:'Describe the issue', confirmText:'Report' }).then(val => {
        if(val && val.trim()){
          notifications.unshift({id:Date.now(), text:'You reported a post.', createdAt: Date.now(), avatar:user.avatar});
          saveState(); renderNotifications(); toast('Reported');
        }
      });
    };
    if(editBtn) editBtn.onclick = async () => {
      const newText = await openModal({ title: 'Edit post', input:true, placeholder:'Edit your post text', confirmText:'Save', html: escapeHtml(post.text || '') });
      if(newText !== null) {
        posts = posts.map(p => p.id===postId ? {...p, text: newText} : p);
        saveState(); renderFeed();
        toast('Post updated');
      }
      const closeBtn = modal.querySelector('.modal-close');
      if(closeBtn) closeBtn.click();
    };
    if(delBtn) delBtn.onclick = () => {
      if(!confirm('Delete this post?')) return;
      posts = posts.filter(p => p.id !== postId);
      notifications.unshift({id:Date.now(), text:'You deleted a post.', createdAt: Date.now(), avatar:user.avatar});
      saveState(); renderFeed(); renderNotifications();
      toast('Post deleted');
      const closeBtn = modal.querySelector('.modal-close');
      if(closeBtn) closeBtn.click();
    };
  }

  // ---------------------------------------------------------------------------
  // Create post (regular feed) — file input preview + actual creation
  // ---------------------------------------------------------------------------
  if(addImageBtn) addImageBtn.onclick = () => postImage && postImage.click();
  if(postImage) postImage.onchange = (e) => {
    const f = e.target.files && e.target.files[0];
    if(!f){ if(preview){ preview.style.display='none'; preview.src=''; } return; }
    const r = new FileReader();
    r.onload = (ev) => { if(preview){ preview.src = ev.target.result; preview.style.display='block'; } };
    r.readAsDataURL(f);
  };

  function createPost(e){
    if(e && e.preventDefault) e.preventDefault();
    const text = (postText && postText.value || '').trim();
    const file = (postImage && postImage.files && postImage.files[0]);
    const cat = postCategorySelect && postCategorySelect.value ? Number(postCategorySelect.value) : null;
    if(!text && !file && (!preview || !preview.src)) { toast('Add text or image'); return; }
    if(file){
      const fr = new FileReader();
      fr.onload = (ev) => { actuallyCreatePost(text, ev.target.result, cat); };
      fr.readAsDataURL(file);
    } else {
      actuallyCreatePost(text, (preview && preview.src) || null, cat);
    }
  }

  /**
   * actuallyCreatePost(text, image, categoryId)
   * Build a post object from the current user profile and insert at the top of the feed.
   */
  function actuallyCreatePost(text, image, categoryId){
    const u = getUserProfile();
    const p = { id: Date.now(), author:{name:u.name, avatar:u.avatar}, createdAt: Date.now(), text: text, image: image, categoryId: categoryId, likes:0, comments: [], shares:0, liked:false };
    posts.unshift(p);
    notifications.unshift({id:Date.now(), text:'You posted to the feed.', createdAt: Date.now(), avatar:u.avatar});
    if(postText) postText.value=''; if(postImage) postImage.value=''; if(preview) { preview.src=''; preview.style.display='none'; }
    if(postCategorySelect) postCategorySelect.value='';
    saveState(); renderFeed(); renderNotifications();
    toast('Posted to your feed');
  }

  if(postForm) postForm.onsubmit = createPost;
  if(newCategoryBtn) newCategoryBtn.onclick = addCategoryPrompt;

  /**
   * addCategoryPrompt()
   * Ask the user for a new category name and add it to state if not duplicate.
   */
  function addCategoryPrompt(){
    openModal({ title: 'New category', input:true, placeholder:'Category name', confirmText:'Add' }).then(name => {
      if(!name) return;
      const trimmed = name.trim(); if(!trimmed) return;
      if(categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())){ toast('Category already exists'); return; }
      const id = Date.now();
      categories.push({id, name: trimmed});
      saveState(); renderPostCategoryOptions(); renderCategoriesPage();
      toast('Category added');
    });
  }

  // ---------------------------------------------------------------------------
  // Categories page renderer — shows number of posts per category and allows rename
  // ---------------------------------------------------------------------------
  function renderCategoriesPage(){
    if(!categoriesContent) return;
    const counts = {}; posts.forEach(p => { const id = p.categoryId || 0; counts[id] = (counts[id]||0)+1; });
    categoriesContent.innerHTML = '';
    const head = document.createElement('div'); head.style.display='flex'; head.style.justifyContent='space-between'; head.style.alignItems='center'; head.style.marginBottom='12px';
    head.innerHTML = `<div style="font-weight:600">Categories</div><div><button class="btn small" id="showAllBtn">Show All</button> <button class="btn small" id="addCatBtn">Add Category</button></div>`;
    categoriesContent.appendChild(head);

    const list = document.createElement('div');
    const all = document.createElement('div'); all.style.display='flex'; all.style.justifyContent='space-between'; all.style.marginBottom='8px';
    all.innerHTML = `<div><button class="btn small category-filter" data-id="">View</button> All</div><div class="muted">${posts.length} posts</div>`;
    list.appendChild(all);
    categories.forEach(c=>{
      const row = document.createElement('div'); row.style.display='flex'; row.style.justifyContent='space-between'; row.style.marginBottom='8px';
      row.innerHTML = `<div><button class="btn small category-filter" data-id="${c.id}">View</button> ${escapeHtml(c.name)}</div><div class="muted">${counts[c.id]||0} posts <button class="btn small rename-cat" data-id="${c.id}">Rename</button></div>`;
      list.appendChild(row);
    });
    categoriesContent.appendChild(list);

    categoriesContent.querySelectorAll('.category-filter').forEach(b => b.onclick = () => { const id = b.dataset.id; activeCategoryId = id ? Number(id) : null; renderFeed(); setActiveTab('feed'); });
    const showAll = document.getElementById('showAllBtn'); if(showAll) showAll.onclick = () => { activeCategoryId = null; renderFeed(); };
    const addBtn = document.getElementById('addCatBtn'); if(addBtn) addBtn.onclick = addCategoryPrompt;
    categoriesContent.querySelectorAll('.rename-cat').forEach(b => b.onclick = () => {
      const id = Number(b.dataset.id); const cat = categories.find(c=>c.id===id); if(!cat) return;
      openModal({ title: 'Rename category', input:true, placeholder: cat.name, confirmText:'Rename' }).then(name => {
        if(name && name.trim()){ cat.name = name.trim(); saveState(); renderPostCategoryOptions(); renderCategoriesPage(); toast('Category renamed'); }
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Profile helpers: get/set profile and UI rendering of profile tab
  // ---------------------------------------------------------------------------

  /**
   * getUserProfile()
   * Retrieve the saved user profile from localStorage. If none exists, return a demo default.
   * Note: feed.js expects the object format: { name, avatar, bio, joined, communitiesJoined, joinedCommunities }
   */
  function getUserProfile(){ const raw = localStorage.getItem(KEY.PROFILE); if(raw) try { return JSON.parse(raw); } catch(e){} return { name:'Marjohn', avatar:'https://i.pravatar.cc/80?img=7', bio:'Frontend dev. Loves design & coffee.', joined:'Feb 2024', communitiesJoined:2, joinedCommunities:[] }; }

  /**
   * setUserProfile(upd)
   * Persist a profile object to localStorage and refresh small UI areas that depend on it.
   */
  function setUserProfile(upd){ localStorage.setItem(KEY.PROFILE, JSON.stringify(upd)); renderTopRightUser(); renderProfile(false); saveState(); }

  /**
   * renderTopRightUser()
   * Update the header top-right user avatar and name.
   */
  function renderTopRightUser(){ const u=getUserProfile(); const img = document.querySelector('.user img'); const nm = document.querySelector('.username'); if(img) img.src = u.avatar; if(nm) nm.textContent = u.name; }

  /**
   * renderProfile(editMode=false)
   * Render the profile tab. If viewedProfileUser is set, show that user's public posts.
   * If viewedProfileUser is null, show the current user's profile (and allow editing).
   */
  function renderProfile(editMode=false){
    const cont = document.getElementById('profile-content'); if(!cont) return;
    const currentUser = getUserProfile();
    const viewed = viewedProfileUser || null; // if null => show current user
    const isViewingOwn = !viewed || (viewed && viewed.name && viewed.name === currentUser.name);

    // helper: attempt to resolve additional profile data by scanning posts authored by the name
    function resolveProfileData(name, fallback) {
      const profile = { name: name || (fallback && fallback.name) || 'Unknown', avatar: (fallback && fallback.avatar) || null, bio: (fallback && fallback.bio) || '' };
      const p = posts.find(pp => {
        const an = (pp.author && pp.author.name) || pp.author_name || '';
        return an && name && an.toLowerCase() === name.toLowerCase();
      });
      if(p) {
        profile.avatar = profile.avatar || ((p.author && p.author.avatar) || p.author_avatar);
      }
      return profile;
    }

    // If viewing own profile and not editing: show full editable summary and the user's posts
    if(isViewingOwn && !editMode) {
      const u = currentUser;
      const postItems = posts.filter(p => {
        const authorName = (p.author && p.author.name) || p.author_name || '';
        if(!authorName) return false;
        return authorName.toLowerCase() === String(u.name).toLowerCase();
      });
      const postCount = postItems.length;
      const defaultAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='8' r='4' fill='%23b3cde0'/%3E%3Cpath d='M2 20c0-4 4-6 10-6s10 2 10 6' fill='%23dbeef6'/%3E%3C/svg%3E";

      cont.innerHTML = `
        <div style="display:flex;gap:16px;align-items:center;margin-bottom:12px;">
          <img src="${escapeHtml(u.avatar || defaultAvatar)}" style="width:80px;height:80px;border-radius:50%;object-fit:cover">
          <div>
            <div style="font-size:22px;font-weight:700;">${escapeHtml(u.name)}</div>
            <div class="muted">${escapeHtml(u.bio)}</div>
            <div style="margin-top:6px;font-size:13px;">Joined: ${escapeHtml(u.joined)}</div>
          </div>
        </div>
        <div>
          <strong>Posts:</strong> ${postCount}<br>
          <strong>Communities:</strong> ${u.communitiesJoined || 0}
        </div>
        <div style="margin-top:12px;">
          <button class="btn small" id="editProfileBtn">Edit Profile</button>
        </div>
        <hr style="margin:12px 0;opacity:.06" />
        <div style="margin-top:12px">
          <strong>Your posts</strong>
          <div style="margin-top:8px">
            ${postItems.length === 0 ? `<div class="muted">You haven't posted yet.</div>` : `<div class="profile-gallery-grid" aria-live="polite">
              ${postItems.map(p => {
                const thumb = p.image ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml((p.text||'').slice(0,60))}">` : `<div class="pg-txt">${escapeHtml((p.text||'').slice(0,120))}</div>`;
                return `<button class="profile-gallery-item" data-id="${p.id}" aria-label="Open post">${thumb}</button>`;
              }).join('')}
            </div>`}
          </div>
        </div>
      `;

      // wire edit button to switch to edit mode
      const eb = document.getElementById('editProfileBtn'); if(eb) eb.onclick = () => renderProfile(true);

      // wire gallery click to open post (image or text)
      cont.querySelectorAll('.profile-gallery-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = Number(btn.dataset.id);
          const post = posts.find(p => p.id === id);
          if(!post) return;
          if(post.image) {
            openImageLightbox(post.image, post.text || '');
          } else {
            openModal({
              title: `${escapeHtml(timeAgo(post.createdAt || Date.now()))}`,
              html: `<div style="margin-top:8px">${escapeHtml(post.text || '')}</div>`,
              confirmText: 'Close',
              cancelText: ''
            });
          }
        });
      });

      return;
    }

    // If editing own profile: show edit form UI (upload avatar, webcam, remove)
    if(isViewingOwn && editMode) {
      let currentAvatar = currentUser.avatar || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Ccircle cx='12' cy='8' r='4' fill='%23b3cde0'/%3E%3Cpath d='M2 20c0-4 4-6 10-6s10 2 10 6' fill='%23dbeef6'/%3E%3C/svg%3E";
      cont.innerHTML = `
        <form id="editProfileForm" style="display:flex;flex-direction:column;gap:10px;">
          <label>Name:<br>
            <input name="name" value="${escapeHtml(currentUser.name)}" style="width:100%;padding:6px;border-radius:6px;border:1px solid rgba(255,255,255,0.04);">
          </label>
          <div style="margin-top:8px;">
            <label style="font-weight:600;margin-bottom:4px;">Profile Photo:</label>
            <div style="display:flex;gap:18px;align-items:center">
              <img id="avatarPreview" src="${escapeHtml(currentAvatar)}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:2px solid #ddd;">
              <div style="display:flex;flex-direction:column;gap:7px;">
                <input type="file" id="avatarUpload" accept="image/*" style="display:none;">
                <button type="button" class="btn small" id="pickPhotoBtn">Upload Photo</button>
                <button type="button" class="btn small" id="takePhotoBtn">Take Photo</button>
                <button type="button" class="btn small" id="removePhotoBtn" style="color:#d32f2f">Remove Photo</button>
              </div>
            </div>
          </div>
          <label>Bio:<br>
            <textarea name="bio" rows="3" style="width:100%;padding:6px;border-radius:6px;border:1px solid rgba(255,255,255,0.04);">${escapeHtml(currentUser.bio)}</textarea>
          </label>
          <div style="margin-top:12px;">
            <button class="btn small" type="submit">Save</button>
            <button class="btn small" type="button" id="cancelProfileBtn" style="margin-left:8px">Cancel</button>
          </div>
        </form>
        <div id="webcam-modal-root"></div>
      `;
      // ... the rest of the edit wiring (avatar upload/webcam/save/cancel) is unchanged from earlier,
      // and is included here to keep behavior consistent with the original demo code.
      const avatarPreview = document.getElementById('avatarPreview');
      const avatarUpload = document.getElementById('avatarUpload');
      const pickPhotoBtn = document.getElementById('pickPhotoBtn');
      const takePhotoBtn = document.getElementById('takePhotoBtn');
      const removePhotoBtn = document.getElementById('removePhotoBtn');
      const form = document.getElementById('editProfileForm');
      const cancel = document.getElementById('cancelProfileBtn');
      const webcamModalRoot = document.getElementById('webcam-modal-root');

      pickPhotoBtn.onclick = () => avatarUpload.click();
      avatarUpload.onchange = (e) => {
        const file = e.target.files && e.target.files[0];
        if(file){
          const reader = new FileReader();
          reader.onload = function(ev) {
            currentAvatar = ev.target.result;
            avatarPreview.src = currentAvatar;
          };
          reader.readAsDataURL(file);
        }
      };

      // Webcam/camera take photo
      takePhotoBtn.onclick = () => {
        if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
          toast('Camera/webcam not supported or permission denied');
          return;
        }
        // Webcam modal
        webcamModalRoot.innerHTML = `
          <div style="position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:1200;background:rgba(2,6,23,0.6);display:flex;align-items:center;justify-content:center;">
            <div style="background:#fff;border-radius:12px;padding:24px;max-width:340px;text-align:center;box-shadow:0 6px 32px rgba(2,6,23,0.25);position:relative;">
              <div style="font-weight:700;font-size:16px;margin-bottom:8px;">Take Photo</div>
              <video id="webcamVideo" autoplay playsinline width="240" height="180" style="border-radius:10px;border:1px solid #dadada;background:#ddd;"></video>
              <br>
              <button id="snapPhotoBtn" class="btn primary" style="margin-top:10px;">Take Photo</button>
              <button id="closeWebcamBtn" class="btn small" style="margin-top:10px;margin-left:8px;">Cancel</button>
            </div>
          </div>
        `;
        const video = document.getElementById('webcamVideo');
        const snapBtn = document.getElementById('snapPhotoBtn');
        const closeBtn = document.getElementById('closeWebcamBtn');
        let stream = null;
        navigator.mediaDevices.getUserMedia({ video: true }).then(s => {
          stream = s;
          video.srcObject = s;
        }).catch(() => {
          toast('Camera access denied');
          webcamModalRoot.innerHTML = '';
        });
        snapBtn.onclick = function(){
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 240;
          canvas.height = video.videoHeight || 180;
          canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
          currentAvatar = canvas.toDataURL('image/png');
          avatarPreview.src = currentAvatar;
          if(stream){
            stream.getTracks().forEach(t=>t.stop());
          }
          webcamModalRoot.innerHTML = '';
        };
        closeBtn.onclick = function(){
          if(stream){
            stream.getTracks().forEach(t=>t.stop());
          }
          webcamModalRoot.innerHTML = '';
        };
      };

      // remove photo and revert to default SVG
      removePhotoBtn.onclick = () => {
        if(confirm('Are you sure you want to remove your profile photo?')){
          currentAvatar = defaultAvatar;
          avatarPreview.src = defaultAvatar;
          toast('Profile photo removed');
        }
      };

      // save profile changes
      form.onsubmit = function(ev){
        ev.preventDefault();
        const fd = new FormData(form), prev = getUserProfile();
        const np = {
          name: (fd.get('name')||prev.name).trim(),
          avatar: currentAvatar,
          bio: (fd.get('bio')||'').trim(),
          joined: prev.joined,
          communitiesJoined: prev.communitiesJoined || 0,
          joinedCommunities: prev.joinedCommunities || []
        };
        setUserProfile(np); renderTopRightUser(); renderFeed(); renderProfile(false);
        toast('Profile updated');
      };
      if(cancel) cancel.onclick = () => renderProfile(false);
      return;
    }

    // Viewing someone else's profile (read-only): show their posts and summary
    if(viewedProfileUser) {
      const profile = resolveProfileData(viewedProfileUser.name, viewedProfileUser);
      const userPosts = posts.filter(p => {
        const an = (p.author && p.author.name) || p.author_name || '';
        return an && profile.name && an.toLowerCase() === profile.name.toLowerCase();
      });
      cont.innerHTML = `
        <div style="display:flex;gap:16px;align-items:center;margin-bottom:12px;">
          <img src="${escapeHtml(profile.avatar || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Ccircle cx='40' cy='40' r='38' fill='%23b3cde0'/%3E%3C/svg%3E")}" style="width:80px;height:80px;border-radius:50%;object-fit:cover">
          <div>
            <div style="font-size:22px;font-weight:700;">${escapeHtml(profile.name)}</div>
            <div class="muted">${escapeHtml(profile.bio || '')}</div>
          </div>
        </div>
        <div style="margin-top:12px">
          <strong>Posts by ${escapeHtml(profile.name)}</strong>
          <div style="margin-top:8px">
            ${userPosts.length === 0 ? `<div class="muted">This user hasn't posted yet.</div>` : `<div class="profile-gallery-grid" aria-live="polite">
              ${userPosts.map(p => {
                const thumb = p.image ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml((p.text||'').slice(0,60))}">` : `<div class="pg-txt">${escapeHtml((p.text||'').slice(0,120))}</div>`;
                return `<button class="profile-gallery-item" data-id="${p.id}" aria-label="Open post">${thumb}</button>`;
              }).join('')}
            </div>`}
          </div>
        </div>
      `;

      // wire gallery items to open posts
      cont.querySelectorAll('.profile-gallery-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = Number(btn.dataset.id);
          const post = posts.find(p => p.id === id);
          if(!post) return;
          if(post.image) {
            openImageLightbox(post.image, post.text || '');
          } else {
            openModal({
              title: `${escapeHtml(timeAgo(post.createdAt || Date.now()))}`,
              html: `<div style="margin-top:8px">${escapeHtml(post.text || '')}</div>`,
              confirmText: 'Close',
              cancelText: ''
            });
          }
        });
      });

      return;
    }

    // fallback: show basic current user info
    const u = currentUser;
    cont.innerHTML = `<div><strong>${escapeHtml(u.name)}</strong><div class="muted">${escapeHtml(u.bio)}</div></div>`;
  }

  // ---------------------------------------------------------------------------
  // Tabs, navigation and accessibility helpers
  // ---------------------------------------------------------------------------
  const TAB_TO_PANEL_ID = {
    feed: 'tab-feed',
    news: 'tab-news',
    profile: 'tab-profile',
    write: 'tab-write',
    mystories: 'tab-mystories',
    categories: 'tab-categories',
    trending: 'tab-trending',
    anonymous: 'tab-anonymous'
  };

  function initNavAccessibility(){
    if(!navList) return;
    const items = Array.from(navList.querySelectorAll('li'));
    navList.setAttribute('role','tablist');
    items.forEach((li, idx) => {
      li.setAttribute('role','tab');
      li.setAttribute('tabindex', li.classList.contains('active') ? '0' : '-1');
      li.setAttribute('aria-selected', li.classList.contains('active') ? 'true' : 'false');
      li.addEventListener('keydown', (e)=>{
        if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); activateNavItem(li); }
        else if(e.key === 'ArrowDown' || e.key === 'ArrowRight'){ e.preventDefault(); const next = items[(idx+1)%items.length]; next.focus(); }
        else if(e.key === 'ArrowUp' || e.key === 'ArrowLeft'){ e.preventDefault(); const prev = items[(idx-1+items.length)%items.length]; prev.focus(); }
      });
      li.addEventListener('click', ()=> activateNavItem(li));
    });
  }

  function activateNavItem(li){
    const tab = li.dataset.tab;
    setActiveTab(tab);
    li.focus();
  }

  /**
   * setActiveTab(tab)
   * Switch view between the main panels (feed, profile, news, etc.).
   * When switching to certain tabs we call render functions to populate them.
   */
  function setActiveTab(tab){
    if(!navList) return;
    navList.querySelectorAll('li').forEach(li => {
      const is = li.dataset.tab === tab;
      li.classList.toggle('active', is);
      li.setAttribute('aria-selected', is ? 'true' : 'false');
      li.setAttribute('tabindex', is ? '0' : '-1');
    });

    // hide all tab-panels and show the one for `tab`
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));

    const panelId = TAB_TO_PANEL_ID[tab] || TAB_TO_PANEL_ID['feed'];
    const panelEl = document.getElementById(panelId);
    if(panelEl) panelEl.classList.remove('hidden');

    // show/hide feed-card vs feed list depending on tab
    if(tab === 'feed'){
      const feedCard = document.getElementById('tab-feed'); if(feedCard) feedCard.classList.remove('hidden');
      if(feedEl) feedEl.classList.remove('hidden');
    } else {
      const feedList = document.getElementById('feed'); if(feedList) feedList.classList.add('hidden');
      const feedCard = document.getElementById('tab-feed'); if(feedCard) feedCard.classList.add('hidden');
    }

    // call renderers for tabs that need it
    if(tab === 'profile') renderProfile(false);
    if(tab === 'categories') renderCategoriesPage();
    if(tab === 'news') renderNews();
    if(tab === 'write') renderWrite();
    if(tab === 'mystories') renderMyStories();
    if(tab === 'trending') renderTrending();
    if(tab === 'anonymous') renderAnonymousRoom();

    try { const newHash = `#${tab}`; if(location.hash !== newHash) history.replaceState(null, '', newHash); } catch(e){}
    try { localStorage.setItem(KEY.LAST_TAB, tab); } catch(e){}
  }

  if(navList) {
    initNavAccessibility();
    navList.addEventListener('click', (e) => {
      const li = e.target.closest && e.target.closest('li');
      if(li && li.dataset && li.dataset.tab) activateNavItem(li);
    });
  }

  function restoreTabFromHashOrLast(){
    const h = (location.hash || '').replace('#','');
    const last = localStorage.getItem(KEY.LAST_TAB);
    const tab = h && TAB_TO_PANEL_ID[h] ? h : (last && TAB_TO_PANEL_ID[last] ? last : 'feed');
    setActiveTab(tab);
  }

  // ---------------------------------------------------------------------------
  // News fetching + helpers (spaceflight news API fallback + local curated items)
  // ---------------------------------------------------------------------------
  async function fetchNews(limit = 6){
    try {
      const res = await fetch(`https://api.spaceflightnewsapi.net/v3/articles?_limit=${limit}`);
      if(!res.ok) throw new Error('Bad response');
      const json = await res.json();
      return json.map(i => ({
        title: i.title,
        url: i.url || i.newsSite || '#',
        summary: i.summary || '',
        publishedAt: i.publishedAt || i.published_at || i.published || i.published_date || null,
        image: i.imageUrl || i.image || (i.photos && i.photos[0]) || null
      }));
    } catch(e){
      const todayTs = Date.now();
      return [
        { title: 'Local: New design patterns emerging', url:'#', summary:'A short curated story about design trends.', publishedAt: todayTs, image: null },
        { title: 'School: City schools reopen with new safety measures', url:'#', summary:'Local district announces protocols for reopening.', publishedAt: todayTs, image: null },
        { title: 'Education update: Scholarships announced for students', url:'#', summary:'New scholarship opportunities for local students.', publishedAt: todayTs, image: null },
        { title: 'Tech: Web performance tips', url:'#', summary:'How to optimize images and deliver faster pages.', publishedAt: todayTs, image: null }
      ];
    }
  }

  const SCHOOL_KEYWORDS = [
    'school','schools','student','students','education','teacher','teachers',
    'campus','university','college','classroom','tuition','principal','faculty',
    'k-12','kindergarten','preschool','schoolboard','scholarship','exam','testing','curriculum','learning','study','district'
  ];

  function isSchoolRelated(item) {
    if(!item) return false;
    const text = ((item.title || '') + ' ' + (item.summary || '') + ' ' + (item.url || '')).toLowerCase();
    return SCHOOL_KEYWORDS.some(k => text.includes(k));
  }

  function isPublishedToday(item) {
    if(!item) return false;
    const pub = item.publishedAt ? new Date(item.publishedAt) : null;
    if(!pub || isNaN(pub.getTime())) return false;
    const now = new Date();
    return pub.getFullYear() === now.getFullYear() &&
           pub.getMonth() === now.getMonth() &&
           pub.getDate() === now.getDate();
  }

  function schoolPlaceholderDataUrl(title = '') {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='180'><rect width='100%' height='100%' fill='#e6eef6'/><g font-family='sans-serif' fill='#04202a'><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='24'>🏫</text></g></svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  /**
   * renderNews()
   * Load news items and display items that match school-related keywords.
   * If none are found, show curated fallback items and a small message.
   */
  async function renderNews(){
    const el = document.getElementById('news-content');
    if(!el) return;
    el.innerHTML = `<div class="muted">Loading news…</div>`;
    try {
      const items = await fetchNews(50);
      const schoolItems = items.filter(isSchoolRelated);
      let filtered = schoolItems;
      if(filtered.length === 0) {
        el.innerHTML = `<div class="muted">No education-focused articles were found from the source — showing recent school-related or curated items.</div>`;
        filtered = [
          { title: 'Education update: Scholarships announced for students', url:'#', summary:'New scholarship opportunities for local students.', publishedAt: Date.now(), image: null },
          { title: 'School safety: New protocols', url:'#', summary:'Updates on school safety measures.', publishedAt: Date.now(), image: null },
          { title: 'Local schools: New teaching methods', url:'#', summary:'A short curated story about teaching practices.', publishedAt: Date.now(), image: null }
        ];
      } else {
        el.innerHTML = `<div class="muted">Showing education & school-related news.</div>`;
      }

      el.innerHTML += filtered.slice(0, 20).map(i => {
        const thumb = i.image ? `<img src="${escapeHtml(i.image)}" alt="">` : `<img src="${schoolPlaceholderDataUrl(i.title)}" alt="">`;
        const dateStr = i.publishedAt ? timeAgo(new Date(i.publishedAt).getTime()) : '';
        const url = (i.url && String(i.url).startsWith('http')) ? i.url : '#';
        return `<div style="margin-bottom:12px;display:flex;gap:10px;align-items:flex-start">
          <div style="flex:0 0 96px;width:96px;height:64px;border-radius:6px;overflow:hidden;background:rgba(0,0,0,0.04)">${thumb}</div>
          <div style="flex:1">
            <a href="${escapeHtml(url)}" target="_blank" rel="noopener" style="font-weight:600">${escapeHtml(i.title)}</a>
            <div class="muted" style="font-size:13px;margin-top:6px">${escapeHtml((i.summary||'').slice(0,220))}</div>
            <div class="muted" style="font-size:12px;margin-top:6px">${escapeHtml(dateStr)}</div>
          </div>
        </div>`;
      }).join('');
    } catch(e) {
      el.innerHTML = `<div class="muted">Couldn't load news.</div>`;
    }
  }

  // ---------------------------------------------------------------------------
  // Write story, My stories, Trending renderers (smaller helpers)
  // ---------------------------------------------------------------------------
  function renderWrite(){
    const el = document.getElementById('write-content');
    if(!el) return;
    el.innerHTML = `
      <form id="writeStoryForm" style="display:flex;flex-direction:column;gap:8px;">
        <input name="title" placeholder="Story title" style="padding:8px;border-radius:6px;border:1px solid rgba(255,255,255,0.04)"/>
        <textarea name="body" rows="8" placeholder="Write your story..." style="padding:8px;border-radius:6px;border:1px solid rgba(255,255,255,0.04)"></textarea>
        <div style="display:flex;gap:8px;align-items:center">
          <select name="category" id="write-category-select" style="padding:6px;border-radius:6px;">
            <option value="">— None —</option>
            ${categories.map(c=>`<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('')}
          </select>
          <button class="btn primary" type="submit">Publish Story</button>
        </div>
      </form>
    `;
    const form = document.getElementById('writeStoryForm');
    form.onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const title = (fd.get('title')||'').trim();
      const body = (fd.get('body')||'').trim();
      const categoryId = fd.get('category') ? Number(fd.get('category')) : null;
      if(!title && !body){ toast('Write something first'); return; }
      const u = getUserProfile();
      const p = { id: Date.now(), author:{name:u.name, avatar:u.avatar}, createdAt: Date.now(), text: (title ? `# ${title}\n\n${body}` : body), image: null, categoryId, likes:0, comments:[], shares:0, liked:false };
      posts.unshift(p);
      notifications.unshift({ id:Date.now(), text:'You published a story.', createdAt: Date.now(), avatar:u.avatar });
      saveState(); renderFeed(); renderNotifications();
      toast('Story published');
      setActiveTab('mystories');
    };
  }

  function renderMyStories(){
    const el = document.getElementById('mystories-content');
    if(!el) return;
    const u = getUserProfile();
    const mine = posts.filter(p => p.author.name === u.name);
    if(mine.length===0){ el.innerHTML = `<div class="muted">You haven't published any stories yet.</div>`; return; }
    el.innerHTML = '';
    mine.forEach(p => {
      const row = document.createElement('div'); row.style.marginBottom='12px';
      row.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:flex-start"><div><div style="font-weight:700">${escapeHtml((p.text||'').split('\n')[0].replace(/^#\s*/,''))}</div><div class="muted" style="font-size:12px">${escapeHtml(timeAgo(p.createdAt))}</div></div><div><button class="btn small edit-story" data-id="${p.id}">Edit</button><button class="btn small delete-story" data-id="${p.id}" style="margin-left:8px">Delete</button></div></div><div style="margin-top:6px">${escapeHtml((p.text||'').split('\n').slice(1).join('\n').slice(0,350))}</div>`;
      el.appendChild(row);
    });
    el.querySelectorAll('.edit-story').forEach(b => b.onclick = async () => {
      const id = Number(b.dataset.id);
      const post = posts.find(x=>x.id===id);
      if(!post) return;
      const newText = await openModal({ title:'Edit story', input:true, placeholder:'Edit story (markdown ok)', confirmText:'Save' , html: escapeHtml(post.text||'')});
      if(newText === null) return;
      posts = posts.map(pp => pp.id===id ? {...pp, text: newText} : pp);
      saveState(); renderMyStories(); renderFeed();
      toast('Story updated');
    });
    el.querySelectorAll('.delete-story').forEach(b => b.onclick = () => {
      const id = Number(b.dataset.id);
      if(!confirm('Delete this story?')) return;
      posts = posts.filter(x=>x.id!==id);
      saveState(); renderMyStories(); renderFeed();
      toast('Story deleted');
    });
  }

  function renderTrending(){
    const el = document.getElementById('trending-content');
    if(!el) return;
    const byScore = posts.slice().sort((a,b)=> ((b.likes||0)+( (b.comments && b.comments.length) || 0 )) - ((a.likes||0)+((a.comments && a.comments.length) || 0))).slice(0,5);
    const catCounts = {};
    posts.forEach(p => { const id = p.categoryId || 0; catCounts[id] = (catCounts[id] || 0) + 1; });
    const topCats = Object.keys(catCounts).map(k=>({ id: Number(k), count: catCounts[k]})).sort((a,b)=>b.count-a.count).slice(0,5);
    el.innerHTML = `<div style="display:flex;gap:12px"><div style="flex:1"><strong>Top posts</strong><div style="margin-top:8px">${byScore.map(p=>`<div style="margin-bottom:8px"><div style="font-weight:600">${escapeHtml((p.text||'').slice(0,80))}</div><div class="muted">${escapeHtml(getCategoryName(p.categoryId))} • ${escapeHtml(String(p.likes))} likes</div></div>`).join('')}</div></div><div style="width:220px"><strong>Top categories</strong><div class="muted" style="margin-top:8px">${topCats.map(c=>`${escapeHtml(getCategoryName(c.id))} — ${c.count} posts`).join('<br>')}</div></div></div>`;
  }

  /**
   * renderPostCategoryOptionsForSelect(selectEl)
   * Populate a <select> element with categories (used for write/story select).
   */
  function renderPostCategoryOptionsForSelect(selectEl){
    if(!selectEl) return;
    selectEl.innerHTML = `<option value="">— None —</option>${categories.map(c=>`<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('')}`;
  }

  // Wire global search input to re-render feed with debounce
  if(globalSearch){
    globalSearch.addEventListener('input', debounce(()=>renderFeed(), 180));
  }

  // ---------------------------------------------------------------------------
  // Theme / mode toggles
  // ---------------------------------------------------------------------------
  function setTheme(isLight) {
    try {
      if(isLight) document.body.classList.add('theme-light');
      else document.body.classList.remove('theme-light');
      localStorage.setItem(KEY.THEME, isLight ? 'light' : 'dark');
    } catch (e) {
      console.warn('setTheme error', e);
    }
    if(themeToggle) {
      themeToggle.textContent = isLight ? 'Dark' : 'Light';
      themeToggle.setAttribute('aria-pressed', String(isLight));
    }
    if(modeBtn) {
      modeBtn.textContent = isLight ? 'Light' : 'Dark';
      modeBtn.setAttribute('aria-pressed', String(!isLight));
    }
  }

  function toggleTheme() {
    const isLight = document.body.classList.contains('theme-light');
    setTheme(!isLight);
    toast(!isLight ? 'Light theme' : 'Dark theme');
  }

  function updateModeButtonLabel() {
    if(!modeBtn) return;
    const isLight = document.body.classList.contains('theme-light');
    modeBtn.textContent = isLight ? 'Light' : 'Dark';
    modeBtn.setAttribute('aria-pressed', String(!isLight));
  }

  if(themeToggle) themeToggle.addEventListener('click', ()=> toggleTheme());
  if(modeBtn) {
    modeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleTheme();
      setSettingsOpen(false);
    });
  }

  // ---------------------------------------------------------------------------
  // Settings & Help modals wiring
  // ---------------------------------------------------------------------------
  function openSettingsModal() {
    const saved = (() => {
      try { return JSON.parse(localStorage.getItem(KEY.SETTINGS) || '{}'); } catch(e){ return {}; }
    })();
    const profileVisibility = saved.profileVisibility || 'public';
    const allowIndex = saved.allowIndex === false ? false : true;

    const html = `
      <div style="display:flex;flex-direction:column;gap:10px;">
        <div>
          <div style="font-weight:600;margin-bottom:6px">Profile visibility</div>
          <div><label><input type="radio" name="profileVisibility" value="public" ${profileVisibility==='public' ? 'checked' : ''}/> Public</label> &nbsp; <label><input type="radio" name="profileVisibility" value="private" ${profileVisibility==='private' ? 'checked' : ''}/> Private</label></div>
          <div class="muted" style="margin-top:6px">When private, your posts won't appear publicly in some listings in this demo.</div>
        </div>

        <div>
          <div style="font-weight:600;margin-bottom:6px">Search indexing</div>
          <label><input type="checkbox" id="__allowIndex" ${allowIndex ? 'checked' : ''}/> Allow search engines to index my profile</label>
        </div>

        <div>
          <div style="font-weight:600;margin-bottom:6px">Profile</div>
          <div class="muted">To edit details, open your profile and click Edit Profile.</div>
          <div style="margin-top:8px"><button class="btn small" id="__openEditProfile">Edit Profile</button></div>
        </div>
      </div>
    `;

    openModal({ title: 'Settings and privacy', html, confirmText: 'Save', cancelText: 'Cancel' });

    const modal = modalRoot.querySelector('.modal'); if(!modal) return;
    const confirm = modal.querySelector('.modal-confirm');
    if(confirm) {
      confirm.addEventListener('click', () => {
        const selected = modal.querySelector('input[name="profileVisibility"]:checked');
        const pv = selected ? selected.value : 'public';
        const allowI = !!modal.querySelector('#__allowIndex') && modal.querySelector('#__allowIndex').checked;
        try {
          localStorage.setItem(KEY.SETTINGS, JSON.stringify({ profileVisibility: pv, allowIndex: allowI }));
        } catch(e){}
        toast('Settings saved');
      });
    }
    const editBtn = modal.querySelector('#__openEditProfile');
    if(editBtn) {
      editBtn.addEventListener('click', () => {
        const closeBtn = modal.querySelector('.modal-close');
        if(closeBtn) closeBtn.click();
        setTimeout(() => { setActiveTab('profile'); renderProfile(true); }, 160);
      });
    }
  }

  function openHelpModal() {
    const html = `
      <div style="display:flex;flex-direction:column;gap:10px;">
        <div style="font-weight:600">Help & Support</div>
        <div class="muted">FAQ: How do I create a post? — Use the Create post area at the top of the feed. Add an image or text, pick a category and Post.</div>
        <div class="muted">FAQ: How to change my profile? — Open your profile and click Edit Profile.</div>
        <div class="muted">If you still need help, send a message to our demo support below.</div>
        <div style="margin-top:8px"><button class="btn small" id="__contactSupportBtn">Contact support</button></div>
      </div>
    `;
    openModal({ title: 'Help and Support', html, confirmText: 'Close', cancelText: '' });

    const modal = modalRoot.querySelector('.modal'); if(!modal) return;
    const contactBtn = modal.querySelector('#__contactSupportBtn');
    if(contactBtn) {
      contactBtn.addEventListener('click', async () => {
        const msg = await openModal({ title: 'Contact support', input: true, placeholder: 'Describe your issue', confirmText: 'Send' });
        if(msg && msg.trim()) {
          notifications.unshift({ id: Date.now(), text: 'Support request sent', createdAt: Date.now(), avatar: getUserProfile().avatar });
          saveState(); renderNotifications();
          toast('Support request sent (demo)');
        }
      });
    }
  }

  // wire settings & help menu buttons
  if(settingPrivBtn) {
    settingPrivBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openSettingsModal();
      setSettingsOpen(false);
    });
  }
  if(helpBtn) {
    helpBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openHelpModal();
      setSettingsOpen(false);
    });
  }

  // ---------------------------------------------------------------------------
  // Login / logout helpers
  // ---------------------------------------------------------------------------
  const LOGIN_PATH_CANDIDATES = [
    'login.html',
    'log in.html',
    '/login',
    '/signin',
    '/sign-in',
    'index.html'
  ];

  /**
   * resolveLoginPath()
   * Tries a small list of likely login page paths and returns one that responds.
   * This is a convenience to try redirecting to a good login page after logout.
   */
  async function resolveLoginPath() {
    for (const candidate of LOGIN_PATH_CANDIDATES) {
      try {
        const url = encodeURI(candidate);
        let ok = false;
        try {
          const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
          ok = res && res.ok;
        } catch (e) {}
        if (!ok) {
          try {
            const res2 = await fetch(encodeURI(candidate), { method: 'GET', cache: 'no-store' });
            ok = res2 && res2.ok;
          } catch (e) {
            ok = false;
          }
        }
        if (ok) return candidate;
      } catch (err) {}
    }
    return LOGIN_PATH_CANDIDATES[0];
  }

  /**
   * doLogout()
   * Clears local login flags and userProfile and redirects to a login page.
   */
  async function doLogout() {
    try {
      localStorage.removeItem('loggedIn');
      localStorage.removeItem(KEY.PROFILE);
    } catch (err) {
      console.warn('Error clearing storage on logout', err);
    }

    setSettingsOpen(false);

    try {
      const dest = await resolveLoginPath();
      try { location.replace(dest); } catch (e) { location.href = dest; }
    } catch (err) {
      try { location.replace('log in.html'); } catch (e) { location.href = 'login.html'; }
    }
  }

  // Delegated logout: global listener so logout button works even if added later
  function attachDelegatedLogout() {
    document.addEventListener('click', function delegatedLogoutClick(e) {
      const btn = e.target.closest && e.target.closest('#logoutBtn');
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        doLogout().catch(err => console.error('logout error', err));
      }
    }, true);

    document.addEventListener('keydown', function delegatedLogoutKey(e) {
      const active = document.activeElement;
      if (!active) return;
      if (active.id === 'logoutBtn' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        doLogout().catch(err => console.error('logout error', err));
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Small side icon & badge helpers
  // ---------------------------------------------------------------------------
  function updateSideBadges(){
    // placeholder - no side badges in this simplified demo
  }

  function showNotificationsModal(){
    const html = notifications.length === 0 ? `<div class="muted">No notifications</div>` : notifications.map(n => `<div style="display:flex;gap:8px;margin-bottom:10px"><img src="${escapeHtml(n.avatar)}" style="width:36px;height:36px;border-radius:50%"/><div><div style="font-weight:600">${escapeHtml(n.text)}</div><div class="muted" style="font-size:12px">${escapeHtml(timeAgo(n.createdAt||Date.now()))}</div></div></div>`).join('');
    openModal({ title: 'Notifications', html, confirmText:'Close', cancelText:'' });
  }

  function initSideIcons(){
    // placeholder for optional side icon wiring
    updateSideBadges();
  }

  // ---------------------------------------------------------------------------
  // Profile icon shortcut: clicking top-right avatar opens own profile
  // ---------------------------------------------------------------------------
  function initProfileIconShortcut() {
    const profileIcon = document.getElementById('profile-icon');
    if (profileIcon) {
      profileIcon.style.cursor = "pointer";
      profileIcon.tabIndex = 0;
      profileIcon.addEventListener('click', () => {
        // view own profile
        viewedProfileUser = null;
        setActiveTab('profile');
        renderProfile(false);
      });
      profileIcon.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          viewedProfileUser = null;
          setActiveTab('profile');
          renderProfile(false);
        }
      });
    }

    const usernameEl = document.querySelector('.username');
    if (usernameEl) {
      usernameEl.tabIndex = 0;
      usernameEl.addEventListener('click', () => {
        viewedProfileUser = null;
        setActiveTab('profile');
        renderProfile(true);
      });
      usernameEl.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          viewedProfileUser = null;
          setActiveTab('profile');
          renderProfile(true);
        }
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Keyboard shortcuts for quick navigation
  // ---------------------------------------------------------------------------
  document.addEventListener('keydown', (e) => {
    if(e.target && (e.target.tagName==='INPUT' || e.target.tagName==='TEXTAREA' || e.target.isContentEditable)) return;
    if(e.key === '/') { e.preventDefault(); globalSearch && globalSearch.focus(); }
    if(e.key === 'n') { e.preventDefault(); postText && postText.focus(); }
    if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      setActiveTab('write');
    }
  });

  // ---------------------------------------------------------------------------
  // initTheme(): read saved theme preference and apply
  // ---------------------------------------------------------------------------
  function initTheme(){
    try {
      const t = localStorage.getItem(KEY.THEME);
      if(t === 'light') { document.body.classList.add('theme-light'); if(themeToggle) { themeToggle.textContent = 'Dark'; themeToggle.setAttribute('aria-pressed','true'); } }
      else { document.body.classList.remove('theme-light'); if(themeToggle) { themeToggle.textContent = 'Light'; themeToggle.setAttribute('aria-pressed','false'); } }
      updateModeButtonLabel();
    } catch(e){}
  }

  // ---------------------------------------------------------------------------
  // Top stories rendering (uses news functions above)
  // ---------------------------------------------------------------------------
  async function renderTopStories() {
    if(!topStoriesList) return;
    topStoriesList.innerHTML = 'Loading top stories…';
    try {
      const items = await fetchNews(50);
      let schoolToday = items.filter(i => isSchoolRelated(i) && isPublishedToday(i));
      let schoolRecent = items.filter(i => isSchoolRelated(i) && !isPublishedToday(i));
      let showItems = schoolToday.length ? schoolToday.slice(0,6) : (schoolRecent.length ? schoolRecent.slice(0,6) : items.slice(0,6));

      if(showItems.length === 0) {
        showItems = [
          { title: 'Education update: Scholarships announced for students', url:'#', summary:'New scholarship opportunities for local students.', publishedAt: Date.now(), image: null },
          { title: 'School safety: New protocols', url:'#', summary:'Updates on school safety measures.', publishedAt: Date.now(), image: null }
        ];
      }

      topStoriesList.innerHTML = showItems.map(it => {
        const thumb = it.image ? `<img src="${escapeHtml(it.image)}" alt="">` : `<img src="${schoolPlaceholderDataUrl(it.title)}" alt="">`;
        const dateLabel = it.publishedAt ? timeAgo(new Date(it.publishedAt).getTime()) : '';
        const url = (it.url && String(it.url).startsWith('http')) ? it.url : '#';
        return `<div class="top-stories-item" role="button" tabindex="0" data-url="${escapeHtml(url)}">
          <div class="top-stories-thumb">${thumb}</div>
          <div class="top-stories-meta">
            <div class="ts-title">${escapeHtml(it.title)}</div>
            <div class="muted ts-summary">${escapeHtml((it.summary||'').slice(0,120))}</div>
            <div class="muted ts-time">${escapeHtml(dateLabel)}</div>
          </div>
        </div>`;
      }).join('');

      topStoriesList.querySelectorAll('.top-stories-item').forEach(node => {
        node.addEventListener('click', () => {
          const url = node.dataset.url;
          if(url && url !== '#') window.open(url, '_blank');
        });
        node.addEventListener('keydown', (e) => {
          if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); node.click(); }
        });
      });
    } catch (err) {
      topStoriesList.innerHTML = '<div class="muted">Could not load top stories.</div>';
      console.warn('renderTopStories error', err);
    }
  }

  if(moreNewsBtn) {
    moreNewsBtn.addEventListener('click', () => {
      window.newsFilter = 'school-today';
      setActiveTab('news');
      renderNews();
    });
  }

  // ---------------------------------------------------------------------------
  // Communities render + join/create actions (already in demo state)
  // ---------------------------------------------------------------------------
  function renderCommunities(){
    const el = document.getElementById('communities-list');
    if(!el) return;
    const u = getUserProfile();
    const joined = u.joinedCommunities || [];
    el.innerHTML = '';
    communities.forEach(c => {
      const div = document.createElement('div');
      div.style.display = 'flex';
      div.style.justifyContent = 'space-between';
      div.style.alignItems = 'center';
      div.style.marginBottom = '8px';
      div.innerHTML = `<div><div style="font-weight:600">${escapeHtml(c.name)}</div><div class="muted" style="font-size:12px">${escapeHtml(c.description || '')}</div></div>
        <div>
          <button class="btn small join-comm-btn" data-id="${c.id}">${joined.includes(c.id) ? 'Joined' : 'Join'}</button>
        </div>`;
      el.appendChild(div);
    });

    el.querySelectorAll('.join-comm-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = Number(btn.dataset.id);
        toggleJoinCommunity(id);
      });
    });

    const createBtn = document.getElementById('create-community-btn');
    if(createBtn) {
      createBtn.onclick = () => {
        openModal({ title: 'Create community', input: true, placeholder: 'Community name', confirmText: 'Create' }).then(name => {
          if(!name || !name.trim()) return;
          const trimmed = name.trim();
          openModal({ title: 'Community description', input:true, placeholder: 'Short description', confirmText: 'Create' }).then(desc => {
            const id = Date.now();
            communities.push({ id, name: trimmed, members: 1, description: (desc||'').trim() });
            const u = getUserProfile();
            u.joinedCommunities = u.joinedCommunities || [];
            u.joinedCommunities.push(id);
            u.communitiesJoined = (u.communitiesJoined || 0) + 1;
            setUserProfile(u);
            saveState(); renderCommunities();
            toast('Community created and joined');
          });
        });
      };
    }
  }

  function toggleJoinCommunity(id){
    const u = getUserProfile();
    u.joinedCommunities = u.joinedCommunities || [];
    const idx = u.joinedCommunities.indexOf(id);
    const comm = communities.find(c => c.id === id);
    if(idx === -1){
      u.joinedCommunities.push(id);
      if(comm) comm.members = (comm.members||0)+1;
      u.communitiesJoined = (u.communitiesJoined || 0) + 1;
    } else {
      u.joinedCommunities.splice(idx,1);
      if(comm) comm.members = Math.max(0,(comm.members||0)-1);
      u.communitiesJoined = Math.max(0,(u.communitiesJoined||0)-1);
    }
    setUserProfile(u);
    saveState();
    renderCommunities();
  }

  // ---------------------------------------------------------------------------
  // Clear notifications action
  // ---------------------------------------------------------------------------
  if(clearNotifsBtn) {
    clearNotifsBtn.addEventListener('click', () => {
      if(!confirm('Clear all notifications?')) return;
      notifications = [];
      saveState();
      renderNotifications();
      toast('Notifications cleared');
    });
  }

  // ---------------------------------------------------------------------------
  // Expose debug helpers for console / testing
  // ---------------------------------------------------------------------------
  window.feedApp = {
    getPosts: () => posts,
    getCategories: () => categories,
    getNotifications: () => notifications,
    getAnonymousPosts: () => anonymousPosts,
    getCommunities: () => communities,
    saveState,
    setActiveTab,
    doLogout,
    renderTopStories,
    renderNews,
    openProfileView // expose for testing
  };

  // ---------------------------------------------------------------------------
  // Initialization: wire everything up and show initial content
  // ---------------------------------------------------------------------------
  function init(){
    initTheme();
    renderTopRightUser();
    renderFriends();
    renderPostCategoryOptions();
    renderFeed();
    renderNotifications();
    renderCommunities();
    renderTopStories();
    renderPostCategoryOptionsForSelect(document.getElementById('write-category-select'));
    initNavAccessibility();
    restoreTabFromHashOrLast();
    initProfileIconShortcut();
    attachDelegatedLogout();
    toast('Welcome back!');
  }

  init();
})();