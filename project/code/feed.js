(() => {
  const KEY = {
    CATEGORIES: 'amu_categories',
    POSTS: 'amu_posts',
    NOTIFS: 'amu_notifications',
    PROFILE: 'userProfile',
    THEME: 'theme',
    ANON: 'amu_anonymous_posts',
    LAST_TAB: 'amu_last_tab',
    SETTINGS: 'amu_settings',
    COMMUNITIES: 'amu_communities',
    ANON_PROFILE: 'amu_anon_profile'
  };

  // seed/default data (comments are arrays with replies)
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
   // Logo refresh functionality - Updated with better visual feedback
// Logo refresh functionality - Now also scrolls to top
// Logo refresh functionality - Now also scrolls to top and resets profile
function initLogoRefresh() {
  const logo = document.getElementById('logo-refresh');
  if (!logo) return;
  
  logo.addEventListener('click', () => {
    // Reset profile view
    viewedProfileUser = null;
    
    // Add refreshing class for animation
    logo.classList.add('refreshing');
    
    // Scroll to top first
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    
    // Clear any active category filter
    activeCategoryId = null;
    
    // Reset search if active
    if (globalSearch && globalSearch.value.trim()) {
      globalSearch.value = '';
    }
    
    // Force a re-render of the feed after a short delay
    setTimeout(() => {
      renderFeed();
      toast('Feed refreshed!');
      
      // Add a small shake effect for extra feedback
      logo.style.transform = 'scale(0.95)';
      setTimeout(() => {
        logo.style.transform = 'scale(1)';
      }, 150);
    }, 300); // Slight delay to allow scroll animation to complete
    
    // Remove refreshing class after animation
    setTimeout(() => {
      logo.classList.remove('refreshing');
    }, 1000);
  });
  
  // Make logo keyboard accessible
  logo.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      logo.click();
    }
  });
  
  // Set proper ARIA attributes
  logo.setAttribute('role', 'button');
  logo.setAttribute('tabindex', '0');
  logo.setAttribute('aria-label', 'Refresh feed - Click to refresh and scroll to top');
  
  // Add hover title
  logo.title = 'Refresh feed and scroll to top';
}
  // Hamburger menu functionality
const hamburger = document.getElementById('hamburger');
const body = document.body;

if (hamburger) {
    hamburger.addEventListener('click', () => {
        body.classList.toggle('menu-open');
        hamburger.setAttribute('aria-expanded', body.classList.contains('menu-open'));
    });
    
    // Close menu when clicking outside or on a link
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.left') && !e.target.closest('#hamburger') && body.classList.contains('menu-open')) {
            body.classList.remove('menu-open');
            hamburger.setAttribute('aria-expanded', false);
        }
    });
    
    // Close menu when clicking a nav item
    const navItems = document.querySelectorAll('.left .navcard li');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            body.classList.remove('menu-open');
            hamburger.setAttribute('aria-expanded', false);
        });
    });
}

  // state (persisted)
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

  // NEW: currently viewed profile (null = current user). When you click another user's avatar, set this to that user object (with name/avatar/bio optional)
  let viewedProfileUser = null;

  // anonymous avatar palette - four cute avatar choices
  const ANON_AVATARS = [
    { id: 'anon-1', name: 'Kitty', src: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><rect width='100%' height='100%' fill='#fff7f7'/><text x='50%' y='58%' dominant-baseline='middle' text-anchor='middle' font-size='28' fill='#ff6b81'>🐱</text></svg>`) },
    { id: 'anon-2', name: 'Puppy', src: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><rect width='100%' height='100%' fill='#f7fff6'/><text x='50%' y='58%' dominant-baseline='middle' text-anchor='middle' font-size='28' fill='#3fb24a'>🐶</text></svg>`) },
    { id: 'anon-3', name: 'Foxy', src: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><rect width='100%' height='100%' fill='#fff8ec'/><text x='50%' y='58%' dominant-baseline='middle' text-anchor='middle' font-size='26' fill='#ff7a2d'>🦊</text></svg>`) },
    { id: 'anon-4', name: 'Bunny', src: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><rect width='100%' height='100%' fill='#eef9ff'/><text x='50%' y='58%' dominant-baseline='middle' text-anchor='middle' font-size='26' fill='#2b9bd6'>🐰</text></svg>`) }
  ];

  // dom refs (queried once)
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

  // Top stories DOM refs (new)
  const topStoriesList = document.getElementById('top-stories-list');
  const moreNewsBtn = document.getElementById('more-news-btn');

  // settings menu buttons
  const settingsBtn = document.getElementById('settings-btn');
  const settingsMenu = document.getElementById('settings-menu');
  const settingPrivBtn = document.getElementById('settingPriv');
  const helpBtn = document.getElementById('helpBtn');
  const modeBtn = document.getElementById('modeBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  // keep anonymous preview data in outer scope
  let anonPreviewData = null;

  // helpers
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
  function escapeHtml(s){ if(!s && s!==0) return ''; return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function timeAgo(ts){ const s=Math.floor((Date.now()-ts)/1000); if(s<10) return 'just now'; if(s<60) return s+'s'; const m=Math.floor(s/60); if(m<60) return m+'m'; const h=Math.floor(m/60); if(h<24) return h+'h'; const d=Math.floor(h/24); if(d<7) return d+'d'; return new Date(ts).toLocaleDateString(); }
  function debounce(fn, wait=220){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), wait); }; }

  // small svg icon helpers (returns inline SVG string)
  function svgLike(fill = 'none', stroke = 'currentColor') {
    return `<svg viewBox="0 0 24 24" fill="${fill}" stroke="${stroke}" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.69l-1.06-1.08a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;
  }
  function svgComment() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
  }
  function svgShare() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>`;
  }
  function svgMenu() {
    return `
      <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden="true">
        <circle cx="6" cy="12" r="2"></circle>
        <circle cx="12" cy="12" r="2"></circle>
        <circle cx="18" cy="12" r="2"></circle>
      </svg>
    `;
  }
  function resetPostForm() {
  if(postText) postText.value = '';
  if(postImage) postImage.value = '';
  if(preview) {
    preview.src = '';
    preview.style.display = 'none';
  }
  if(postCategorySelect) postCategorySelect.value = '';
}

  // -- toast (small notification) --
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

  // ensure settings menu toggling keeps ARIA in sync
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
    settingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = settingsMenu.style.display === 'block';
      setSettingsOpen(!isOpen);
    });
    document.addEventListener('click', function(e) {
      if (!settingsBtn.contains(e.target) && !settingsMenu.contains(e.target)) {
        setSettingsOpen(false);
      }
    });
    settingsBtn.addEventListener('keydown', (e) => {
      if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); setSettingsOpen(!(settingsMenu.style.display === 'block')); }
      if(e.key === 'Escape') setSettingsOpen(false);
    });
  }

  // -- modal (accessible, returns promise) --
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

      // attach synchronously
      modalRoot.appendChild(backdrop);
      modalRoot.appendChild(box);
      modalRoot.setAttribute('aria-hidden','false');
      requestAnimationFrame(()=> {
        backdrop.style.opacity = '1';
        box.classList.add('show');
      });

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

  // -- lightbox for images (uses modal) --
  function openImageLightbox(src, alt='') {
    openModal({ title: '', html: `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" class="lightbox-img" />`, confirmText: 'Close', cancelText: '' , width: 980});
  }

  // ---------- Comments modal for regular posts ----------
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
                  <div style="margin-top:6px"><button class="btn small reply-to-comment" data-cid="${c.id}" data-pid="${postId}">Reply</button></div>
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

  // ---------- Anonymous Room (with avatar chooser + visible image preview) ----------
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

  function renderAnonymousRoom(){
    const el = document.getElementById('anonymous-content');
    if(!el) return;

    const savedAnon = getSavedAnonProfile();
    const selectedId = savedAnon.avatarId || ANON_AVATARS[0].id;

    // create UI: a card with create-anon-post form and then a feed list of anonymous posts
    /* --- In feed.js, inside function renderAnonymousRoom() --- */
// Replace the el.innerHTML assignment with this updated version:

el.innerHTML = `
  <div class="card" style="margin-bottom:12px">
    <form id="anon-create-form" style="position:relative;">
      <textarea id="anon-text" placeholder="Share anonymously..." rows="3" aria-label="Anonymous post text" style="width:100%;padding:12px;border-radius:10px;border:1px solid rgba(255,255,255,0.04);background:transparent;"></textarea>

      <div class="anon-row-responsive" style="display:flex;gap:12px;align-items:flex-start;margin-top:8px;">
        <div style="flex:1">
          <div class="anon-avatar-chooser" aria-hidden="false">
            ${ANON_AVATARS.map(a => `
              <button type="button" class="anon-avatar-btn" data-id="${a.id}" title="${escapeHtml(a.name)}" aria-pressed="${a.id===selectedId}">
                <img src="${a.src}" alt="${escapeHtml(a.name)}" />
              </button>
            `).join('')}
          </div>
        </div>

        <div class="anon-controls-responsive" style="width:240px;flex-shrink:0;">
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

    // get references for preview + image input
    const anonImageInput = document.getElementById('anon-image');
    const anonAddImageBtn = document.getElementById('anon-add-image');
    const anonPreviewEl = document.getElementById('anon-preview');
    const anonRemoveBtn = document.getElementById('anon-remove-preview');

    // initialize preview UI if a preview was selected earlier in the session (keeps it until submit)
    if(anonPreviewData) {
      anonPreviewEl.src = anonPreviewData;
      anonPreviewEl.style.display = 'block';
      if(anonRemoveBtn) anonRemoveBtn.style.display = 'inline-block';
    } else {
      anonPreviewEl.style.display = 'none';
      if(anonRemoveBtn) anonRemoveBtn.style.display = 'none';
    }

    // wire avatar chooser + image input
    el.querySelectorAll('.anon-avatar-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        el.querySelectorAll('.anon-avatar-btn').forEach(b => b.setAttribute('aria-pressed','false'));
        btn.setAttribute('aria-pressed','true');
        const id = btn.dataset.id;
        setSavedAnonProfile({ avatarId: id });
      });
    });

    if(anonAddImageBtn) {
      anonAddImageBtn.addEventListener('click', () => {
        if(anonImageInput) anonImageInput.click();
      });
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

    // click preview to view lightbox (bigger)
    anonPreviewEl && anonPreviewEl.addEventListener('click', () => {
      if(anonPreviewData) openImageLightbox(anonPreviewData, 'Anonymous preview');
    });

    // Render anonymous posts (most recent first)
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
              <button class="action-inline anon-share-btn" data-id="${p.id}" aria-label="Share anonymous post">${svgShare()}<span class="sr-only">Share</span><span class="count" aria-hidden="true">${p.shares||0}</span></button>
            </div>
          </div>
        </article>`;
      }).join('');
      // attach handlers (images + actions)
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

    // create anon post handler
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
        // reset
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

  // Anonymous comments modal (unchanged from earlier behavior)
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

  // anon menu for owner actions (delete only, since all posts are anonymous there is no owner transformation)
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

  // anonymous like/share toggles
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

  // -- renderers for main UI --
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

  function getCategoryName(id){ if(!id) return 'Uncategorized'; const c = categories.find(x=>x.id===id); return c ? c.name : 'Uncategorized'; }

  function renderPostCategoryOptions(){
    if(!postCategorySelect) return;
    postCategorySelect.innerHTML='';
    const none = document.createElement('option'); none.value=''; none.textContent='— None —'; postCategorySelect.appendChild(none);
    categories.forEach(c => { const o=document.createElement('option'); o.value=c.id; o.textContent=c.name; postCategorySelect.appendChild(o); });
  }

  // NEW helper: openProfileView(user) sets the viewedProfileUser and navigates to profile tab
  function openProfileView(user) {
  console.log('openProfileView called with:', user);
  console.log('Previous viewedProfileUser:', viewedProfileUser);
  
  viewedProfileUser = user;
  
  console.log('New viewedProfileUser:', viewedProfileUser);
  
  setActiveTab('profile');
  renderProfile(false);
}

function setActiveTab(tab) {
  console.log('setActiveTab called with tab:', tab);
  console.log('Current viewedProfileUser:', viewedProfileUser);
}

  // Profile gallery (Instagram-like) for any author (keeps modal gallery but now "Open profile" goes to the profile tab)
  function openProfileGallery(author) {
    const current = getUserProfile();
    const viewed = author && author.name ? author : current;
    const viewedName = viewed.name;
    const avatar = viewed.avatar || (function(){
      const p = posts.find(pp => (pp.author && pp.author.name === viewedName) || (pp.author_name && pp.author_name === viewedName));
      return p ? (p.author && p.author.avatar) || p.author_avatar || current.avatar : current.avatar;
    })();

    // Find posts authored by this viewed person — check different fields
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

    // "Open profile" button now takes you to the profile page (stalk mode)
    const openProfileBtn = modal.querySelector('#openProfileFromGallery');
    if(openProfileBtn) openProfileBtn.addEventListener('click', () => {
      const closeBtn = modal.querySelector('.modal-close');
      if(closeBtn) closeBtn.click();
      setTimeout(() => {
        // view current user's profile
        viewedProfileUser = null;
        setActiveTab('profile');
        renderProfile(false);
      }, 160);
    });

    const openProfileOtherBtn = modal.querySelector('#openProfileFromGalleryOther');
    if(openProfileOtherBtn) openProfileOtherBtn.addEventListener('click', () => {
      const closeBtn = modal.querySelector('.modal-close');
      if(closeBtn) closeBtn.click();
      setTimeout(() => {
        // view the profile of the 'viewed' author from the gallery
        viewedProfileUser = { name: viewedName, avatar: avatar };
        setActiveTab('profile');
        renderProfile(false);
      }, 160);
    });
  }

  // Minimalist renderFeed: icons (SVG) in action buttons
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

      const headImg = art.querySelector('.post-head img');
      if(headImg) {
        headImg.style.cursor = 'pointer';
        // Clicking another user's avatar should navigate to their profile page (view their posts)
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

    feedEl.querySelectorAll('.post-body img').forEach(img => img.onclick = (e) => {
      const src = e.currentTarget.getAttribute('src');
      openImageLightbox(src, e.currentTarget.getAttribute('alt') || '');
    });

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

  // actions for regular posts
  function toggleLike(id){
    posts = posts.map(p => p.id===id ? {...p, liked: !p.liked, likes: (!p.liked ? p.likes+1 : Math.max(0,p.likes-1)) } : p);
    saveState();
    renderFeed();
    updateSideBadges();
  }

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

  // post menu for regular posts
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

  // post creation & preview for regular posts
  if(addImageBtn) addImageBtn.onclick = () => postImage && postImage.click();
  if(postImage) postImage.onchange = (e) => {
  const f = e.target.files && e.target.files[0];
  if(!f){ 
    if(preview){ 
      preview.style.display='none'; 
      preview.src=''; 
    } 
    return; 
  }
  const r = new FileReader();
  r.onload = (ev) => { 
    if(preview){ 
      preview.src = ev.target.result; 
      preview.style.display='block'; 
    } 
  };
  r.readAsDataURL(f);
};

  function createPost(e){
  if(e && e.preventDefault) e.preventDefault();
  const text = (postText && postText.value || '').trim();
  const file = (postImage && postImage.files && postImage.files[0]);
  const cat = postCategorySelect && postCategorySelect.value ? Number(postCategorySelect.value) : null;
  
  // Check if there's text or a file
  if(!text && !file) {
    toast('Add text or image');
    return;
  }
  
  if(file){
    const fr = new FileReader();
    fr.onload = (ev) => { actuallyCreatePost(text, ev.target.result, cat); };
    fr.readAsDataURL(file);
  } else {
    // Only pass null for image if there's no file selected
    actuallyCreatePost(text, null, cat);
  }
}

  function actuallyCreatePost(text, image, categoryId){
  const u = getUserProfile();
  const p = { 
    id: Date.now(), 
    author:{name:u.name, avatar:u.avatar}, 
    createdAt: Date.now(), 
    text: text, 
    image: image,  // Will be null if no image
    categoryId: categoryId, 
    likes:0, 
    comments: [], 
    shares:0, 
    liked:false 
  };
  
  posts.unshift(p);
  notifications.unshift({id:Date.now(), text:'You posted to the feed.', createdAt: Date.now(), avatar:u.avatar});
  
  resetPostForm(); // Use the helper function
  
  saveState(); 
  renderFeed(); 
  renderNotifications();
  toast('Posted to your feed');
}

  if(postForm) postForm.onsubmit = createPost;
  if(newCategoryBtn) newCategoryBtn.onclick = addCategoryPrompt;

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

  // categories page
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

  // profile helpers
 /* --- In feed.js, REPLACE the entire getUserProfile function with this: --- */

function getUserProfile() {
  const raw = localStorage.getItem(KEY.PROFILE);
  
  // 1. Existing Profile / Parsed
  if (raw) {
    try {
      const profile = JSON.parse(raw);
      if (profile && profile.name) {
        return {
          name: profile.name,
          // Ensures existing users who never had this property get an empty array
          myFollowers: profile.myFollowers || [], 
          following: profile.following || [],
          avatar: profile.avatar || "https://i.pravatar.cc/80?img=12", 
          bio: profile.bio || "",
          joined: profile.joined || new Date().toLocaleDateString(),
          communitiesJoined: profile.communitiesJoined || 0,
          joinedCommunities: profile.joinedCommunities || []
        };
      }
    } catch (e) {
      console.warn('Error parsing user profile', e);
    }
  }

  // 2. Legacy Fallback (Registered Name)
  const savedName = localStorage.getItem("registeredName");
  
  if (savedName) {
    return {
      name: savedName,
      avatar: "https://i.pravatar.cc/80?img=12", 
      bio: "",
      joined: new Date().toLocaleDateString(),
      communitiesJoined: 0,
      joinedCommunities: [],
      // NEW ACCOUNTS START HERE: 0 Followers and 0 Following
      following: [],
      myFollowers: [] 
    };
  }

  // 3. Guest Fallback (Brand New User)
  return {
    name: "Guest User",
    avatar: "https://i.pravatar.cc/80?img=12",
    bio: "",
    joined: new Date().toLocaleDateString(),
    communitiesJoined: 0,
    joinedCommunities: [],
    // NEW ACCOUNTS START HERE: 0 Followers and 0 Following
    following: [],
    myFollowers: []
  };
}
// Replace the existing getUserProfile function with this corrected version:
  function setUserProfile(upd){ localStorage.setItem(KEY.PROFILE, JSON.stringify(upd)); renderTopRightUser(); renderProfile(false); saveState(); }
  function renderTopRightUser(){ const u=getUserProfile(); const img = document.querySelector('.user img'); const nm = document.querySelector('.username'); if(img) img.src = u.avatar; if(nm) nm.textContent = u.name; }

 /* --- feed.js (Add this helper function) --- */

function toggleFollowUser(targetUsername) {
  const currentUser = getUserProfile();
  
  // Ensure following array exists
  if (!currentUser.following) currentUser.following = [];
  
  const index = currentUser.following.indexOf(targetUsername);
  
  if (index > -1) {
    // Already following -> Unfollow
    currentUser.following.splice(index, 1);
    toast(`Unfollowed ${targetUsername}`);
  } else {
    // Not following -> Follow
    currentUser.following.push(targetUsername);
    
    // Check if we just followed back a friend
    const isFriend = friends.some(f => f.name === targetUsername);
    if(isFriend) {
      toast(`You and ${targetUsername} are now following each other!`);
    } else {
      toast(`Following ${targetUsername}`);
    }
    
    // Add a notification for simulation purposes
    notifications.unshift({
        id: Date.now(), 
        text: `You started following ${targetUsername}`, 
        createdAt: Date.now(), 
        avatar: getUserProfile().avatar
    });
    renderNotifications();
  }
  
  // Save and Refresh UI
  setUserProfile(currentUser);
  renderProfile(false); // Re-render profile to update button state
}
/* --- Updated renderProfile function with Back Button --- */
function renderProfile(editMode = false) {
  const cont = document.getElementById('profile-content');
  if (!cont) return;

  const currentUser = getUserProfile();
  const viewed = viewedProfileUser || null; // null = current user
  const isViewingOwn = !viewed || (viewed && viewed.name === currentUser.name);

  // Determine correct user data to show
  let profileData = isViewingOwn ? currentUser : viewed;

  // Logic to find a better avatar if viewing a stranger
  if (!isViewingOwn) {
    const p = posts.find(pp => {
      const an = (pp.author && pp.author.name) || pp.author_name || '';
      return an && an.toLowerCase() === viewed.name.toLowerCase();
    });
    if (p) {
      const foundAvatar = (p.author && p.author.avatar) || p.author_avatar;
      profileData = { ...viewed, avatar: foundAvatar || viewed.avatar, bio: viewed.bio || "Community Member" };
    }
  }

  // Filter posts for this specific user
  const userPosts = posts.filter(p => {
    const authorName = (p.author && p.author.name) || p.author_name || '';
    return authorName.toLowerCase() === String(profileData.name).toLowerCase();
  });

  // --- BACK BUTTON LOGIC ---
  let backButtonHtml = '';
  if (!isViewingOwn) {
    backButtonHtml = `
      <button class="btn small back-to-profile-btn" id="back-to-my-profile" 
              style="margin-bottom: 16px; background: rgba(0, 180, 216, 0.1); 
                     border: 1px solid rgba(0, 180, 216, 0.2); color: var(--accent);">
        ← Back to My Profile
      </button>
    `;
  }

  // --- FOLLOW BUTTON LOGIC ---
  let actionButtonHtml = '';
  
  // Ensure following array exists for safety
  currentUser.following = currentUser.following || []; 

  if (isViewingOwn) {
    actionButtonHtml = `<button class="btn small" id="btn-edit-profile">Edit Profile</button>`;
  } else {
    const isFollowing = currentUser.following.includes(profileData.name);
    
    // Simulating "Follow Back": 
    // We assume people in the 'friends' list follow the user.
    // If they are in 'friends' but we don't follow them yet, show "Follow Back".
    const isFollower = friends.some(f => f.name === profileData.name); 

    if (isFollowing) {
      actionButtonHtml = `<button class="btn small following-state" id="btn-toggle-follow">Following</button>`;
    } else if (isFollower) {
      actionButtonHtml = `<button class="btn primary small follow-back-state" id="btn-toggle-follow">Follow Back</button>`;
    } else {
      actionButtonHtml = `<button class="btn primary small" id="btn-toggle-follow">Follow</button>`;
    }
  }

  // --- STATS LOGIC ---
  const amIFollowing = currentUser.following.includes(profileData.name) ? 1 : 0;
  const baseFollowers = isViewingOwn ? 0 : 0; // Fake base numbers
  const followersCount = baseFollowers + amIFollowing;
  
  // For 'Following', we use the real array length if viewing own profile
  const followingCount = isViewingOwn ? currentUser.following.length : 15; // 15 is fake number for others

  // 1. EDIT MODE
  if (editMode && isViewingOwn) {
    renderEditProfileForm(cont, currentUser);
    return;
  }

  // 2. VIEW MODE
  const defaultAvatar = "https://i.pravatar.cc/150?u=default";
  
  cont.innerHTML = `
    ${backButtonHtml}
    
    <div class="profile-header">
      <img src="${escapeHtml(profileData.avatar || defaultAvatar)}" class="profile-avatar-large" alt="Profile">
      
      <div class="profile-info">
        <div class="profile-identity-row">
          <div>
            <h2 style="margin:0; font-size:22px; font-weight:700;">
              ${escapeHtml(profileData.name)}
            </h2>
            ${!isViewingOwn ? `<div style="font-size:13px; color:var(--accent); margin-top:4px;">@${escapeHtml(profileData.username || profileData.name.toLowerCase().replace(/\s+/g, ''))}</div>` : ''}
          </div>
          ${actionButtonHtml}
        </div>
        
        <div class="profile-stats">
  <div class="stat-item">
    <span class="stat-value">${userPosts.length}</span> <span class="stat-label">Posts</span>
  </div>
  
  <div class="stat-item">
    <span class="stat-value">${followersCount}</span> <span class="stat-label">Followers</span>
  </div>
  
  <div class="stat-item">
    <span class="stat-value">${followingCount}</span> <span class="stat-label">Following</span>
  </div>
</div>
        
        <div style="font-size:14px; margin-top:4px; line-height:1.4;">
          ${escapeHtml(profileData.bio || (isViewingOwn ? "Add a bio in your profile settings" : "No bio available"))}
        </div>
      </div>
    </div>
    <div style="border-top:1px solid rgba(255,255,255,0.05); padding-top:2px;"></div>
    <div class="insta-grid">
      ${userPosts.length === 0 
        ? `<div class="muted" style="grid-column: 1/-1; text-align:center; padding:60px 0;">No posts yet.<br>Share your first moment!</div>` 
        : userPosts.map(p => {
            const content = p.image 
              ? `<img src="${escapeHtml(p.image)}" loading="lazy" />`
              : `<div class="insta-text-preview">${escapeHtml(p.text)}</div>`;
              
            return `
              <button class="insta-item" onclick="window.feedApp.openPostDetail(${p.id})" aria-label="View post">
                ${content}
                <div class="insta-overlay">
                  <span>❤️ ${p.likes || 0}</span>
                </div>
              </button>
            `;
          }).join('')
      }
    </div>
  `;

  // Hook up Back button
  const backBtn = document.getElementById('back-to-my-profile');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      viewedProfileUser = null;
      renderProfile(false);
    });
  }

  // Hook up Edit button
  const editBtn = document.getElementById('btn-edit-profile');
  if (editBtn) editBtn.onclick = () => renderProfile(true);

  // Hook up Follow button
  const followBtn = document.getElementById('btn-toggle-follow');
  if (followBtn) {
    followBtn.onclick = () => toggleFollowUser(profileData.name);
  }
}
  /* --- NEW: Helper for Post Detail Modal --- */
  /* --- feed.js --- */

/* FIND the openPostDetail function (usually near the bottom) and REPLACE it with this updated version: */

/* --- NEW: Helper for Post Detail Modal --- */
/* --- NEW: Helper for Post Detail Modal (Updated Fix) --- */
function openPostDetail(postId) {
  const post = posts.find(p => p.id === postId);
  if (!post) return;

  // Modal Content
  const html = `
    <div class="post-detail-modal">
      ${post.image 
        ? `<img src="${escapeHtml(post.image)}" class="post-detail-img" />`
        : `<div style="padding:24px; background:rgba(255,255,255,0.05); border-radius:8px; font-size:16px; line-height:1.5;">${escapeHtml(post.text)}</div>`
      }
      
      ${post.image && post.text 
        ? `<div style="margin-top:8px; font-size:14px;"><strong>${escapeHtml((post.author && post.author.name) || post.author_name)}</strong> ${escapeHtml(post.text)}</div>` 
        : ''}

      <div class="actions-row" style="margin-top:12px; border-top:1px solid rgba(255,255,255,0.1); padding-top:12px;">
         <button class="action-inline like-btn ${post.liked?'liked':''}" id="modal-like-btn">
            ${svgLike(post.liked ? 'currentColor' : 'none')} <span style="margin-left:6px">${post.likes}</span>
         </button>
         
         <button class="action-inline" id="modal-comment-btn">
            ${svgComment()} <span style="margin-left:6px">${post.comments ? post.comments.length : 0}</span>
         </button>
      </div>
    </div>
  `;

  openModal({ 
    title: post.image ? 'Photo' : 'Post', 
    html: html, 
    confirmText: 'Close', 
    cancelText: '' 
  });

  // Make buttons interactive immediately inside modal
  setTimeout(() => {
    // 1. Like Button Logic
    const likeBtn = document.querySelector('#modal-like-btn');
    if(likeBtn) {
      likeBtn.onclick = function() {
        toggleLike(post.id); 
        
        // Manually update modal button state
        const updatedPost = posts.find(p => p.id === postId);
        const icon = likeBtn.querySelector('svg');
        const count = likeBtn.querySelector('span');
        
        if (updatedPost.liked) {
          likeBtn.classList.add('liked');
          icon.setAttribute('fill', 'currentColor');
        } else {
          likeBtn.classList.remove('liked');
          icon.setAttribute('fill', 'none');
        }
        count.textContent = updatedPost.likes;
      };
    }

    // 2. Comment Button Logic
    const commentBtn = document.querySelector('#modal-comment-btn');
    if(commentBtn) {
      commentBtn.onclick = function() {
        // Close the current detail modal
        const closeBtn = document.querySelector('.modal-close');
        if(closeBtn) closeBtn.click();

        // WAIT 350ms (Critical Fix): Ensures the old modal is fully gone 
        // before opening the comments, so the code attaches to the correct window.
        setTimeout(() => {
          openComments(post.id);
        }, 350);
      };
    }
  }, 50);
}

  /* --- NEW: Helper for Edit Form --- */
  /* --- REPLACE renderEditProfileForm in feed.js with this --- */
/* --- REPLACE renderEditProfileForm in feed.js with this --- */
function renderEditProfileForm(cont, currentUser) {
  let currentAvatar = currentUser.avatar;
  
  cont.innerHTML = `
        <form id="editProfileForm" style="display:flex;flex-direction:column;gap:16px;">
          <h3 style="margin:0;">Edit Profile</h3>
          
          <div style="display:flex; align-items:center; gap:20px;">
            <img id="edit-avatar-preview" 
                 src="${escapeHtml(currentAvatar)}" 
                 class="profile-avatar-large" 
                 style="width:80px; height:80px; flex-shrink:0;" 
                 alt="Current Avatar">
            <div>
              <input type="file" id="avatar-upload" accept="image/*" style="display:none;">
              <button type="button" class="btn small" onclick="document.getElementById('avatar-upload').click()">
                Change Profile Photo
              </button>
              <div class="muted" style="font-size:12px; margin-top:4px;">Max size 2MB (Simulated)</div>
            </div>
          </div>
          
          <label style="display:block;">
            <span class="muted" style="font-size:12px;display:block;margin-bottom:6px;">Display Name</span>
            <input name="name" value="${escapeHtml(currentUser.name)}" style="width:100%;padding:10px;border-radius:6px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.03);color:inherit;">
          </label>
          
          <label style="display:block;">
            <span class="muted" style="font-size:12px;display:block;margin-bottom:6px;">Bio</span>
            <textarea name="bio" rows="3" style="width:100%;padding:10px;border-radius:6px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.03);color:inherit;">${escapeHtml(currentUser.bio)}</textarea>
          </label>
          
          <input type="hidden" id="new-avatar-url" name="avatar" value="${escapeHtml(currentAvatar)}">

          <div style="display:flex; gap:12px; margin-top:8px;">
             <button class="btn primary small" type="submit">Save Changes</button>
             <button class="btn small" type="button" onclick="renderProfile(false)">Cancel</button>
          </div>
        </form>
  `;

  // --- Profile Picture Update Logic ---
  const avatarUpload = document.getElementById('avatar-upload');
  const avatarPreview = document.getElementById('edit-avatar-preview');
  const newAvatarUrl = document.getElementById('new-avatar-url');

  avatarUpload.onchange = function(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        // 1. Update the preview image
        avatarPreview.src = e.target.result; 
        // 2. Update the hidden input value which gets submitted
        newAvatarUrl.value = e.target.result; 
      };
      reader.readAsDataURL(file);
    }
  };
  
  // --- Form Submission Logic ---
  const form = document.getElementById('editProfileForm');
  form.onsubmit = function(ev){
    ev.preventDefault();
    const fd = new FormData(form);
    
    // Create new profile object using form data, including the updated 'avatar' value
    const np = {
      ...currentUser,
      name: (fd.get('name') || currentUser.name).trim(),
      bio: (fd.get('bio') || '').trim(),
      avatar: fd.get('avatar') // This pulls the base64 URL from the hidden input
    };
    
    // Save, re-render, and notify
    setUserProfile(np); 
    renderTopRightUser(); 
    renderProfile(false);
    toast('Profile updated successfully!');
  };

    // viewing someone else's profile OR editing own profile
    if(isViewingOwn && editMode) {
      // show edit UI for own profile (existing behavior)
      let currentAvatar = currentUser.avatar || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='8' r='4' fill='%23b3cde0'/%3E%3Cpath d='M2 20c0-4 4-6 10-6s10 2 10 6' fill='%23dbeef6'/%3E%3C/svg%3E";
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

      // Remove photo and use default SVG
      removePhotoBtn.onclick = () => {
        if(confirm('Are you sure you want to remove your profile photo?')){
          currentAvatar = defaultAvatar;
          avatarPreview.src = defaultAvatar;
          toast('Profile photo removed');
        }
      };

      // Save profile
      form.onsubmit = function(ev){
        ev.preventDefault();
        const fd = new FormData(form), prev = getUserProfile();
        const np = {
          name: (fd.get('name')||prev.name).trim(),
          avatar: currentAvatar, // dataURL or SVG
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

    // Viewing another user's profile (read-only)
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

      // wire gallery items
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

    // default fallback: show current user summary if somehow none matched
    const u = currentUser;
    cont.innerHTML = `<div><strong>${escapeHtml(u.name)}</strong><div class="muted">${escapeHtml(u.bio)}</div></div>`;
  }

  // tabs plumbing (unchanged mapping)
  const TAB_TO_PANEL_ID = {
    feed: 'tab-feed',
    news: 'tab-news',
    profile: 'tab-profile',
    write: 'tab-write',
    mystories: 'tab-mystories',
    categories: 'tab-categories',
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

 function activateNavItem(li) {
  const tab = li.dataset.tab;
  
  // Reset to own profile ONLY when clicking profile tab in navigation
  if (tab === 'profile') {
    viewedProfileUser = null;
  }
  
  setActiveTab(tab);
  li.focus();
}

 function setActiveTab(tab) {
  if (!navList) return;
  
  navList.querySelectorAll('li').forEach(li => {
    const is = li.dataset.tab === tab;
    li.classList.toggle('active', is);
    li.setAttribute('aria-selected', is ? 'true' : 'false');
    li.setAttribute('tabindex', is ? '0' : '-1');
  });

  document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));

  const panelId = TAB_TO_PANEL_ID[tab] || TAB_TO_PANEL_ID['feed'];
  const panelEl = document.getElementById(panelId);
  if (panelEl) panelEl.classList.remove('hidden');

  if (tab === 'feed') {
    const feedCard = document.getElementById('tab-feed');
    if (feedCard) feedCard.classList.remove('hidden');
    if (feedEl) feedEl.classList.remove('hidden');
  } else {
    const feedList = document.getElementById('feed');
    if (feedList) feedList.classList.add('hidden');
    const feedCard = document.getElementById('tab-feed');
    if (feedCard) feedCard.classList.add('hidden');
  }

  if (tab === 'profile') renderProfile(false);
  if (tab === 'categories') renderCategoriesPage();
  if (tab === 'news') renderNews();
  if (tab === 'write') renderWrite();
  if (tab === 'mystories') renderMyStories();
  if (tab === 'anonymous') renderAnonymousRoom();
  if (tab === 'findpeople') renderFindPeople(); // Add this if you have findpeople tab

  try {
    const newHash = `#${tab}`;
    if (location.hash !== newHash) history.replaceState(null, '', newHash);
  } catch (e) {}
  
  try {
    localStorage.setItem(KEY.LAST_TAB, tab);
  } catch (e) {}
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

  /* =========================================
     NEW DYNAMIC SCHOOL NEWS LOGIC
     ========================================= */

  // 1. Data Pool: A large collection of realistic school headlines & summaries
  const SCHOOL_NEWS_DATA = [
    {
      title: "Ministry of Education announces new digital curriculum for 2025",
      summary: "Schools nationwide will adopt a new AI-integrated syllabus starting next semester to boost tech literacy.",
      image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80"
    },
    {
      title: "University entrance exams to be fully digitalized by year-end",
      summary: "The examination board confirms that pen-and-paper testing will be phased out in favor of secure tablet-based exams.",
      image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80"
    },
    {
      title: "Student mental health days now mandatory in all high schools",
      summary: "New legislation requires schools to provide at least 3 mental health days per semester for senior students.",
      image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80"
    },
    {
      title: "Local district cancels classes due to severe weather warning",
      summary: "Superintendent announces closure of all K-12 campuses tomorrow due to the approaching storm front.",
      image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80"
    },
    {
      title: "Breakthrough: High school science team discovers plastic-eating bacteria",
      summary: "A group of senior students has won the National Science Fair with their eco-friendly discovery.",
      image: "https://images.unsplash.com/photo-1564981797816-1043664bf78d?auto=format&fit=crop&w=800&q=80"
    },
    {
      title: "Teachers Union strikes deal for increased classroom resources",
      summary: "After weeks of negotiation, educators have secured funding for new textbooks and smartboards.",
      image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80"
    },
    {
      title: "Debate Club finals: City High vs. North Academy tonight",
      summary: "The annual inter-school debate championship takes place this evening at the municipal auditorium.",
      image: "https://images.unsplash.com/photo-1544531586-fde5298cdd40?auto=format&fit=crop&w=800&q=80"
    },
    {
      title: "New scholarship program launched for Arts & Music students",
      summary: "Applications are now open for the 'Creative Minds' grant, offering full tuition for talented artists.",
      image: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=800&q=80"
    },
    {
      title: "Campus cafeteria overhaul: Healthy options menu revealed",
      summary: "Students voted to replace fast food options with fresh salad bars and smoothie stations.",
      image: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80"
    },
    {
      title: "Coding now a required subject for elementary students",
      summary: "To prepare for the future economy, basic Python and Scratch will be taught starting from Grade 3.",
      image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80"
    },
    {
      title: "Summer camp registration opens with record demand",
      summary: "Parents are advised to sign up early as spots for the Science and Adventure camps are filling up fast.",
      image: "https://images.unsplash.com/photo-1472162072942-cd5147eb3902?auto=format&fit=crop&w=800&q=80"
    },
    {
      title: "Library renovation complete: Quiet pods and e-readers added",
      summary: "The school library reopens Monday with modern facilities designed for deep study sessions.",
      image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=800&q=80"
    }
  ];

  // 2. Helper: Shuffle array to randomize news order
  function shuffleNews(array) {
    let currentIndex = array.length, randomIndex;
    // While there remain elements to shuffle.
    while (currentIndex != 0) {
      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
  }

  // 3. Helper: Generate dynamic timestamps (Just now, 5m ago, etc.)
  function getDynamicTime(index) {
    // Index 0 is newest (minutes ago), higher index is older (hours ago)
    const now = Date.now();
    if(index === 0) return now - (1000 * 60 * 2); // 2 mins ago
    if(index === 1) return now - (1000 * 60 * 15); // 15 mins ago
    if(index === 2) return now - (1000 * 60 * 45); // 45 mins ago
    return now - (1000 * 60 * 60 * (index + 1)); // 1+ hours ago
  }

  // 4. MAIN NEWS RENDERER
  async function renderNews(){
    const el = document.getElementById('news-content');
    if(!el) return;

    // A. Show Loading State
    el.innerHTML = `
      <div style="padding: 20px; text-align: center; color: var(--muted);">
        <svg style="animation: rotateRefresh 1s infinite linear; width:24px; height:24px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
        </svg>
        <div style="margin-top:8px">Fetching trending school updates...</div>
      </div>
    `;

    // B. Simulate Network Delay (for realism)
    await new Promise(r => setTimeout(r, 600));

    // C. Get Data
    // We shuffle the static pool to make it look "updated" every time the user visits
    const freshNews = shuffleNews([...SCHOOL_NEWS_DATA]); 

    // D. Render Layout
    el.innerHTML = `<div class="muted" style="margin-bottom:12px; display:flex; justify-content:space-between; align-items:center;">
        <span>Trending in Education</span>
        <span style="font-size:11px; background:rgba(0,180,216,0.1); color:var(--accent); padding:2px 6px; border-radius:4px;">LIVE</span>
      </div>`;

    el.innerHTML += freshNews.map((item, index) => {
      const realTime = getDynamicTime(index);
      
      return `
        <article class="news-item card" style="margin-bottom:12px; padding:10px; display:flex; gap:12px; align-items:start; border:1px solid rgba(255,255,255,0.03);">
          
          <div style="flex-shrink:0; width:100px; height:70px; border-radius:8px; overflow:hidden; background:#222;">
            <img src="${item.image}" alt="News thumbnail" style="width:100%; height:100%; object-fit:cover;" loading="lazy">
          </div>

          <div style="flex:1; min-width:0;">
            <h4 style="margin:0 0 6px 0; font-size:15px; font-weight:700; line-height:1.3; color:inherit;">
              ${escapeHtml(item.title)}
            </h4>
            <div class="muted" style="font-size:13px; line-height:1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
              ${escapeHtml(item.summary)}
            </div>
            <div style="margin-top:8px; display:flex; gap:8px; align-items:center; font-size:11px; color:var(--muted); opacity:0.8;">
              <span style="color:var(--accent); font-weight:600;">School News</span>
              <span>•</span>
              <span>${timeAgo(realTime)}</span>
            </div>
          </div>

        </article>
      `;
    }).join('');
  }

  /* =========================================
     END DYNAMIC SCHOOL NEWS LOGIC
     ========================================= */
  // write story
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

  // my stories
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



  // populate writer selects quickly
  function renderPostCategoryOptionsForSelect(selectEl){
    if(!selectEl) return;
    selectEl.innerHTML = `<option value="">— None —</option>${categories.map(c=>`<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('')}`;
  }

  // UI bindings
  if(globalSearch){
    globalSearch.addEventListener('input', debounce(()=>renderFeed(), 180));
  }

  // THEME & MODE BUTTON LOGIC
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

  if(themeToggle) themeToggle.addEventListener('click', ()=>{
    toggleTheme();
  });

  if(modeBtn) {
    modeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleTheme();
      setSettingsOpen(false);
    });
  }

  // Settings modal: Settings & Privacy
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

  // Help & Support modal
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

  // wire settings menu actions
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

  // LOGOUT / resolveLoginPath / doLogout
  const LOGIN_PATH_CANDIDATES = [
    'login.html',
    'log in.html',
    '/login',
    '/signin',
    '/sign-in',
    'index.html'
  ];

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

  // Delegated logout
  // Keep this function (around line 1550) and remove the duplicate at the end:
function attachDelegatedLogout() {
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-action="logout"]')) {
      e.preventDefault();
      localStorage.removeItem("loggedInUser");
      window.location.href = "login.html";
    }
  });
}

  // side-icons wiring and helpers (new)
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

  // Profile avatar shortcut (modified so clicking profile opens profile tab and shows user's posts)
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

  // Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) return;
  
  if (e.key === '/') { 
    e.preventDefault(); 
    globalSearch && globalSearch.focus(); 
  }
  
  // Escape key to go back to your profile when viewing someone else
  if (e.key === 'Escape' && viewedProfileUser) {
    viewedProfileUser = null;
    renderProfile(false);
    toast('Returned to your profile');
  }
  
  if (e.key === 'n') { 
    e.preventDefault(); 
    postText && postText.focus(); 
  }
  
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    setActiveTab('write');
  }
});

  // theme & init
  function initTheme(){
    try {
      const t = localStorage.getItem(KEY.THEME);
      if(t === 'light') { document.body.classList.add('theme-light'); if(themeToggle) { themeToggle.textContent = 'Dark'; themeToggle.setAttribute('aria-pressed','true'); } }
      else { document.body.classList.remove('theme-light'); if(themeToggle) { themeToggle.textContent = 'Light'; themeToggle.setAttribute('aria-pressed','false'); } }
      updateModeButtonLabel();
    } catch(e){}
  }

  // Top stories
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

  // Communities: render and actions (join/create)
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

  // Top-level helpers: clear notifs, show notifications
  if(clearNotifsBtn) {
    clearNotifsBtn.addEventListener('click', () => {
      if(!confirm('Clear all notifications?')) return;
      notifications = [];
      saveState();
      renderNotifications();
      toast('Notifications cleared');
    });
  }

  // expose debug & tools
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
    openProfileView,
    openPostDetail // <--- THIS is required for the new profile grid to work
  };
  // initialization
  function initScrollTracking() {
  const topbar = document.querySelector('.topbar');
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      topbar.classList.add('scrolled');
    } else {
      topbar.classList.remove('scrolled');
    }
  });
}

/* --- feed.js --- */

function initMobileSearch() {
  const searchContainer = document.querySelector('.center-search');
  const searchInput = document.getElementById('global-search');
  const body = document.body;
  
  if (!searchContainer || !searchInput) return;

  // 1. Create and Inject a "Cancel" button dynamically
  // We check if it exists first to avoid duplicates
  let cancelBtn = searchContainer.querySelector('.mobile-search-cancel');
  if (!cancelBtn) {
    cancelBtn = document.createElement('button');
    cancelBtn.className = 'mobile-search-cancel btn small';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.type = 'button';
    cancelBtn.setAttribute('aria-label', 'Close search');
    // Append it after the search input wrapper
    searchContainer.appendChild(cancelBtn);
  }

  // Helper to open search
  function openSearch() {
    body.classList.add('search-active');
    searchInput.focus();
  }

  // Helper to close search
  function closeSearch() {
    body.classList.remove('search-active');
    searchInput.value = ''; // Clear text
    searchInput.blur();
    // Reset the feed to show all posts again
    if (window.feedApp && window.feedApp.renderFeed) {
      window.feedApp.renderFeed();
    }
  }

  // 2. Event Listener: Click the Search Icon (or container) to OPEN
  // We target the .search wrapper which contains the icon and input
  const searchWrapper = searchContainer.querySelector('.search');
  if (searchWrapper) {
    searchWrapper.addEventListener('click', (e) => {
      // Only trigger on mobile
      if (window.innerWidth <= 768) {
        // If search isn't active yet, open it
        if (!body.classList.contains('search-active')) {
          e.stopPropagation(); // Prevent bubbling
          openSearch();
        }
      }
    });
  }

  // 3. Event Listener: Click the Cancel Button to CLOSE
  cancelBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeSearch();
  });

  // 4. Event Listener: Press "Enter" on keyboard
  // This fixes the "Can't search" feeling by hiding the keyboard to show results
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchInput.blur(); // Hides virtual keyboard
    }
    if (e.key === 'Escape') {
      closeSearch();
    }
  });
}
  function init(){
    initTheme();
    initLogoRefresh();
    initScrollTracking();
    initMobileSearch()
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
  
  // Initialize hamburger menu
  if (document.getElementById('hamburger')) {
    body.classList.remove('menu-open');
  }
  
  toast('Welcome back!');
}

  // Function to handle logout from any button/link
function attachDelegatedLogout() {
  // We use event delegation to find all elements with the 'data-action="logout"' attribute
  document.addEventListener('click', (e) => {
    // Check if the clicked element has the logout data attribute
    if (e.target.closest('[data-action="logout"]')) {
      e.preventDefault(); // Stop any default link behavior

      // 1. Remove the saved login state
      localStorage.removeItem("loggedInUser");
      
      // 2. Redirect the user back to the login page
      window.location.href = "login.html";
    }
  });
}

  init();
})();