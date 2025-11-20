// feed.js - Full app script with delegated logout handler (works even if logout button is rendered/replaced dynamically)
// All previous features preserved: posts, threaded comments, post actions, likes/shares, categories, stories, anonymous room,
// accessible modals with focus trap, side icons, theme toggle, and the fixed logout behavior (delegated).
(() => {
  const KEY = {
    CATEGORIES: 'amu_categories',
    POSTS: 'amu_posts',
    NOTIFS: 'amu_notifications',
    PROFILE: 'userProfile',
    THEME: 'theme',
    ANON: 'amu_anonymous_posts',
    LAST_TAB: 'amu_last_tab'
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

  // default posts now include comments arrays with nested replies
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

  // state
  let categories = JSON.parse(localStorage.getItem(KEY.CATEGORIES) || 'null') || defaultCategories.slice();
  let posts = JSON.parse(localStorage.getItem(KEY.POSTS) || 'null') || defaultPosts.slice();
  let notifications = JSON.parse(localStorage.getItem(KEY.NOTIFS) || 'null') || [{ id:1, text:'Welcome to your feed!', createdAt: Date.now()-3600*1000, avatar:'https://i.pravatar.cc/36?img=10' }];
  const friends = seedFriends.slice();
  let anonymousPosts = JSON.parse(localStorage.getItem(KEY.ANON) || 'null') || [];
  let activeCategoryId = null;

  // dom refs (queried once on load)
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

  // side icons
  const sideIconsRoot = document.getElementById('sideIcons');
  const badgeNotifsEl = document.getElementById('badge-notifs');
  const badgeLikesEl = document.getElementById('badge-likes');

  // modal & toast roots
  const modalRoot = document.getElementById('modal-root');
  const toastRoot = document.getElementById('toast-container');

  // helpers
  function saveState(){
    try {
      localStorage.setItem(KEY.CATEGORIES, JSON.stringify(categories));
      localStorage.setItem(KEY.POSTS, JSON.stringify(posts));
      localStorage.setItem(KEY.NOTIFS, JSON.stringify(notifications));
      localStorage.setItem(KEY.ANON, JSON.stringify(anonymousPosts));
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

  // Settings menu toggle
  const settingsBtn = document.getElementById('settings-btn');
  const settingsMenu = document.getElementById('settings-menu');
  if(settingsBtn && settingsMenu) {
    settingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      settingsMenu.style.display = (settingsMenu.style.display === "block") ? "none" : "block";
    });
    document.addEventListener('click', function(e) {
      if (!settingsBtn.contains(e.target) && !settingsMenu.contains(e.target)) {
        settingsMenu.style.display = 'none';
      }
    });
  }

  // Logout inside settings menu
  // -- modal (accessible, returns promise) --
  // Note: modal is appended synchronously, so callers can query modalRoot.querySelector('.modal') immediately after calling openModal(...)
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

  // ---------- NEW: Comments modal & reply support ----------
  // Opens a modal showing threaded comments for a post and allows adding replies and new comments
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

    // open modal and attach handlers immediately (modal elements exist synchronously)
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
        // close and re-open to refresh comments content
        const closeBtn = modal.querySelector('.modal-close');
        if(closeBtn) closeBtn.click();
        setTimeout(()=> openComments(postId), 120);
        toast('Comment added');
      });
    }

    // attach reply button handlers
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
          // refresh
          const closeBtn = modal.querySelector('.modal-close');
          if(closeBtn) closeBtn.click();
          setTimeout(()=> openComments(pid), 120);
          toast('Reply posted');
        }
      });
    });
  }

  // ---------- end comments modal ----------

  // -- renderers --
  function renderFriends(){
    if(!friendsList) return;
    friendsList.innerHTML = '';
    friends.forEach(f=>{
      const d = document.createElement('div'); d.className='friend';
      d.style.cursor = 'pointer';
      d.setAttribute('role','button');
      d.setAttribute('tabindex','0');
      d.innerHTML = `<img src="${f.avatar}" alt="${escapeHtml(f.name)}"/><div style="flex:1"><div style="font-weight:600">${escapeHtml(f.name)}</div><div class="muted">${f.online?'Online':'Offline'}</div></div><div style="width:10px;height:10px;border-radius:50%;background:${f.online?'#34d399':'#94a3b8'}"></div>`;
      // clicking a friend opens that friend's profile gallery
      d.addEventListener('click', () => openProfileGallery(f));
      d.addEventListener('keydown', (e) => { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openProfileGallery(f); } });
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

  // Profile gallery (Instagram-like square grid) for any author
  // author: optional object { name, avatar, bio } - if omitted, shows current user's gallery
  function openProfileGallery(author) {
    const current = getUserProfile();
    const viewed = author && author.name ? author : current;
    const viewedName = viewed.name;
    // choose avatar: prefer provided author.avatar else fallback to current user avatar or first matching post author avatar
    const avatar = viewed.avatar || (function(){
      const p = posts.find(pp => pp.author && pp.author.name === viewedName);
      return p ? (p.author.avatar || current.avatar) : current.avatar;
    })();

    const userPosts = posts.filter(p => p.author && p.author.name === viewedName);
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
          ${ viewedName === current.name ? '<button class="btn small" id="openProfileFromGallery">Open profile</button>' : '' }
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
    // open modal (modal exists synchronously)
    openModal({ title: `${escapeHtml(viewedName)} — Gallery`, html, confirmText: 'Close', cancelText: '' });

    const modal = modalRoot.querySelector('.modal');
    if(!modal) return;

    // attach handlers to gallery items
    modal.querySelectorAll('.profile-gallery-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = Number(btn.dataset.id);
        const post = posts.find(p => p.id === id);
        if(!post) return;
        if(post.image) {
          // open image in lightbox
          openImageLightbox(post.image, post.text || '');
        } else {
          // open a small post detail modal
          openModal({
            title: `${escapeHtml(timeAgo(post.createdAt || Date.now()))}`,
            html: `<div style="margin-top:8px">${escapeHtml(post.text || '')}</div>`,
            confirmText: 'Close',
            cancelText: ''
          });
        }
      });
    });

    // If gallery opened for current user, the "Open profile" button navigates to profile panel
    const openProfileBtn = modal.querySelector('#openProfileFromGallery');
    if(openProfileBtn) openProfileBtn.addEventListener('click', () => {
      const closeBtn = modal.querySelector('.modal-close');
      if(closeBtn) closeBtn.click();
      setTimeout(() => {
        setActiveTab('profile');
        renderProfile(false);
      }, 160);
    });
  }

  // Minimalist renderFeed: icons (SVG) in action buttons, icon-only visual with sr-only accessible labels
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
          <img src="${escapeHtml(post.author.avatar)}" alt="${escapeHtml(post.author.name)}" />
          <div style="flex:1">
            <div style="font-weight:600">${escapeHtml(post.author.name)}</div>
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

      // make the author avatar clickable to open that author's gallery/profile (visible to anyone)
      const headImg = art.querySelector('.post-head img');
      if(headImg) {
        headImg.style.cursor = 'pointer';
        headImg.addEventListener('click', () => openProfileGallery(post.author));
        headImg.addEventListener('keydown', (e) => { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openProfileGallery(post.author); } });
      }
    });

    // image lightbox
    feedEl.querySelectorAll('.post-body img').forEach(img => img.onclick = (e) => {
      const src = e.currentTarget.getAttribute('src');
      openImageLightbox(src, e.currentTarget.getAttribute('alt') || '');
    });

    // like button handler
    feedEl.querySelectorAll('.like-btn').forEach(b => b.onclick = () => {
      const id = Number(b.dataset.id);
      toggleLike(id);
      b.classList.add('liked');
      setTimeout(()=> b.classList.remove('liked'), 700);
    });

    // share
    feedEl.querySelectorAll('.share-btn').forEach(b => b.onclick = () => {
      const id = Number(b.dataset.id);
      sharePost(id);
    });

    // comment button now opens threaded comments modal
    feedEl.querySelectorAll('.comment-btn').forEach(b => b.onclick = () => {
      const id = Number(b.dataset.id);
      openComments(id);
    });

    // post menu
    feedEl.querySelectorAll('.menu-btn').forEach(b => b.onclick = (e) => openPostMenu(e.currentTarget, Number(b.dataset.id)));
  }

  // actions
  function toggleLike(id){
    posts = posts.map(p => p.id===id ? {...p, liked: !p.liked, likes: (!p.liked ? p.likes+1 : Math.max(0,p.likes-1)) } : p);
    saveState();
    renderFeed();
    updateSideBadges();
    if(badgeLikesEl) { badgeLikesEl.classList.add('pulse'); setTimeout(()=> badgeLikesEl.classList.remove('pulse'), 1400); }
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

  // Make the three-dots menu show contextual options for everyone and owner-only actions for post owner
  function openPostMenu(btn, postId){
    const user = getUserProfile();
    const post = posts.find(p=>p.id===postId);
    if(!post) return;

    const isOwner = post.author.name === user.name;

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

    // open modal then attach handlers immediately
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
      // close actions modal if still open
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

  // post creation & preview
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
  function getUserProfile(){ const raw = localStorage.getItem(KEY.PROFILE); if(raw) try { return JSON.parse(raw); } catch(e){} return { name:'Marjohn', avatar:'https://i.pravatar.cc/80?img=7', bio:'Frontend dev. Loves design & coffee.', joined:'Feb 2024', communitiesJoined:2 }; }
  function setUserProfile(upd){ localStorage.setItem(KEY.PROFILE, JSON.stringify(upd)); renderTopRightUser(); renderProfile(false); saveState(); }
  function renderTopRightUser(){ const u=getUserProfile(); const img = document.querySelector('.user img'); const nm = document.querySelector('.username'); if(img) img.src = u.avatar; if(nm) nm.textContent = u.name; }

  function renderProfile(editMode=false){
    const cont = document.getElementById('profile-content'); if(!cont) return;
    const u = getUserProfile();
    const postCount = posts.filter(p=>p.author.name===u.name).length;
    if(!editMode){
      cont.innerHTML = `<div style="display:flex;gap:16px;align-items:center;margin-bottom:12px;"><img src="${escapeHtml(u.avatar)}" style="width:80px;height:80px;border-radius:50%;"><div><div style="font-size:22px;font-weight:700;">${escapeHtml(u.name)}</div><div class="muted">${escapeHtml(u.bio)}</div><div style="margin-top:6px;font-size:13px;">Joined: ${escapeHtml(u.joined)}</div></div></div><div><strong>Posts:</strong> ${postCount}<br><strong>Communities:</strong> ${u.communitiesJoined}</div><div style="margin-top:12px;"><button class="btn small" id="editProfileBtn">Edit Profile</button></div>`;
      const eb = document.getElementById('editProfileBtn'); if(eb) eb.onclick = () => renderProfile(true);
    } else {
      cont.innerHTML = `<form id="editProfileForm" style="display:flex;flex-direction:column;gap:10px;"><label>Name:<br><input name="name" value="${escapeHtml(u.name)}" style="width:100%;padding:6px;border-radius:6px;border:1px solid rgba(255,255,255,0.04);"></label><label>Avatar URL:<br><input name="avatar" value="${escapeHtml(u.avatar)}" style="width:100%;padding:6px;border-radius:6px;border:1px solid rgba(255,255,255,0.04);"></label><label>Bio:<br><textarea name="bio" rows="3" style="width:100%;padding:6px;border-radius:6px;border:1px solid rgba(255,255,255,0.04);">${escapeHtml(u.bio)}</textarea></label><div style="margin-top:12px;"><button class="btn small" type="submit">Save</button><button class="btn small" type="button" id="cancelProfileBtn" style="margin-left:8px">Cancel</button></div></form>`;
      const form = document.getElementById('editProfileForm'); form.onsubmit = (ev) => { ev.preventDefault(); const fd = new FormData(form); const prev = getUserProfile(); const np = { name: (fd.get('name')||prev.name).trim(), avatar:(fd.get('avatar')||prev.avatar).trim(), bio:(fd.get('bio')||'').trim(), joined: prev.joined, communitiesJoined: prev.communitiesJoined }; setUserProfile(np); renderTopRightUser(); renderFeed(); renderProfile(false); toast('Profile updated'); };
      const cancel = document.getElementById('cancelProfileBtn'); if(cancel) cancel.onclick = () => renderProfile(false);
    }
  }

  // tabs plumbing (unchanged mapping)
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

  function setActiveTab(tab){
    if(!navList) return;
    navList.querySelectorAll('li').forEach(li => {
      const is = li.dataset.tab === tab;
      li.classList.toggle('active', is);
      li.setAttribute('aria-selected', is ? 'true' : 'false');
      li.setAttribute('tabindex', is ? '0' : '-1');
    });

    document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));

    const panelId = TAB_TO_PANEL_ID[tab] || TAB_TO_PANEL_ID['feed'];
    const panelEl = document.getElementById(panelId);
    if(panelEl) panelEl.classList.remove('hidden');

    if(tab === 'feed'){
      const feedCard = document.getElementById('tab-feed'); if(feedCard) feedCard.classList.remove('hidden');
      if(feedEl) feedEl.classList.remove('hidden');
    } else {
      const feedList = document.getElementById('feed'); if(feedList) feedList.classList.add('hidden');
      const feedCard = document.getElementById('tab-feed'); if(feedCard) feedCard.classList.add('hidden');
    }

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

  // news (unchanged)
  async function fetchNews(limit = 6){
    try {
      const res = await fetch(`https://api.spaceflightnewsapi.net/v3/articles?_limit=${limit}`);
      if(!res.ok) throw new Error('Bad response');
      const json = await res.json();
      return json.map(i => ({ title: i.title, url: i.url, summary: i.summary }));
    } catch(e){
      return [
        { title: 'Local: New design patterns emerging', url:'#', summary:'A short curated story about design trends.' },
        { title: 'Tech: Web performance tips', url:'#', summary:'How to optimize images and deliver faster pages.' }
      ];
    }
  }

  async function renderNews(){
    const el = document.getElementById('news-content');
    if(!el) return;
    el.innerHTML = `<div class="muted">Loading news…</div>`;
    try {
      const items = await fetchNews(6);
      el.innerHTML = items.map(i => `<div style="margin-bottom:12px"><a href="${i.url}" target="_blank" rel="noopener">${escapeHtml(i.title)}</a><div class="muted" style="font-size:13px">${escapeHtml((i.summary||'').slice(0,220))}</div></div>`).join('');
    } catch(e){
      el.innerHTML = `<div class="muted">Couldn't load news.</div>`;
    }
  }

  // write story (simple inline editor)
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

  // trending
  function renderTrending(){
    const el = document.getElementById('trending-content');
    if(!el) return;
    const byScore = posts.slice().sort((a,b)=> ((b.likes||0)+( (b.comments && b.comments.length) || 0 )) - ((a.likes||0)+((a.comments && a.comments.length) || 0))).slice(0,5);
    const catCounts = {};
    posts.forEach(p => { const id = p.categoryId || 0; catCounts[id] = (catCounts[id] || 0) + 1; });
    const topCats = Object.keys(catCounts).map(k=>({ id: Number(k), count: catCounts[k]})).sort((a,b)=>b.count-a.count).slice(0,5);
    el.innerHTML = `<div style="display:flex;gap:12px"><div style="flex:1"><strong>Top posts</strong><div style="margin-top:8px">${byScore.map(p=>`<div style="margin-bottom:8px"><div style="font-weight:600">${escapeHtml((p.text||'').slice(0,80))}</div><div class="muted">${escapeHtml(getCategoryName(p.categoryId))} • ${escapeHtml(String(p.likes))} likes</div></div>`).join('')}</div></div><div style="width:220px"><strong>Top categories</strong><div class="muted" style="margin-top:8px">${topCats.map(c=>`${escapeHtml(getCategoryName(c.id))} — ${c.count} posts`).join('<br>')}</div></div></div>`;
  }

  // anonymous
  function renderAnonymousRoom(){
    const el = document.getElementById('anonymous-content');
    if(!el) return;
    el.innerHTML = `
      <div style="margin-bottom:10px">
        <form id="anonForm" style="display:flex;gap:8px;">
          <input name="anonText" placeholder="Say something anonymously..." style="flex:1;padding:8px;border-radius:6px;border:1px solid rgba(255,255,255,0.04)"/>
          <button class="btn small" type="submit">Post</button>
        </form>
      </div>
      <div id="anon-list"></div>
    `;
    const list = document.getElementById('anon-list');
    function refreshAnonList(){
      if(!list) return;
      list.innerHTML = anonymousPosts.slice().reverse().map(a => `<div class="card" style="margin-bottom:8px;padding:10px"><div class="muted" style="font-size:12px">${escapeHtml(timeAgo(a.createdAt))}</div><div style="margin-top:6px">${escapeHtml(a.text)}</div></div>`).join('');
    }
    refreshAnonList();
    const form = document.getElementById('anonForm');
    form.onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const text = (fd.get('anonText')||'').trim();
      if(!text) { toast('Write something first'); return; }
      anonymousPosts.push({ id: Date.now(), text, createdAt: Date.now() });
      saveState(); refreshAnonList();
      form.reset();
      toast('Anonymous post added');
    };
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

  if(themeToggle) themeToggle.addEventListener('click', ()=>{
    const is = document.body.classList.toggle('theme-light');
    // button text indicates action (pressing it will switch to that label)
    themeToggle.textContent = is ? 'Dark' : 'Light';
    themeToggle.setAttribute('aria-pressed', String(is));
    try { localStorage.setItem(KEY.THEME, is ? 'light' : 'dark'); } catch (e) {}
    toast(is ? 'Light theme' : 'Dark theme');
  });

  if(clearNotifsBtn) clearNotifsBtn.onclick = () => { notifications = []; saveState(); renderNotifications(); toast('Notifications cleared'); };

  document.addEventListener('keydown', (e) => {
    if(e.target && (e.target.tagName==='INPUT' || e.target.tagName==='TEXTAREA' || e.target.isContentEditable)) return;
    if(e.key === '/') { e.preventDefault(); globalSearch && globalSearch.focus(); }
    if(e.key === 'n') { e.preventDefault(); postText && postText.focus(); }
  });

  // side-icons wiring and helpers (new)
  function updateSideBadges(){
    if(badgeNotifsEl){
      if(notifications && notifications.length > 0){
        badgeNotifsEl.textContent = notifications.length > 9 ? '9+' : String(notifications.length);
        badgeNotifsEl.style.display = 'inline-flex';
        badgeNotifsEl.classList.add('pulse');
        setTimeout(()=> badgeNotifsEl.classList.remove('pulse'), 1400);
      } else {
        badgeNotifsEl.style.display = 'none';
      }
    }
    if(badgeLikesEl){
      const totalLikes = posts.reduce((s,p)=>s+(p.likes||0),0);
      if(totalLikes > 0){
        badgeLikesEl.style.display = 'inline-flex';
      } else {
        badgeLikesEl.style.display = 'none';
      }
    }
  }

  function showNotificationsModal(){
    const html = notifications.length === 0 ? `<div class="muted">No notifications</div>` : notifications.map(n => `<div style="display:flex;gap:8px;margin-bottom:10px"><img src="${escapeHtml(n.avatar)}" style="width:36px;height:36px;border-radius:50%"/><div><div style="font-weight:600">${escapeHtml(n.text)}</div><div class="muted" style="font-size:12px">${escapeHtml(timeAgo(n.createdAt||Date.now()))}</div></div></div>`).join('');
    openModal({ title: 'Notifications', html, confirmText:'Close', cancelText:'' });
  }

  function initSideIcons(){
    if(!sideIconsRoot) return;
    const map = {
      'btn-home': () => setActiveTab('feed'),
      'btn-search': () => { globalSearch && globalSearch.focus(); setActiveTab('news'); },
      'btn-reels': () => setActiveTab('news'),
      'btn-messenger': () => showNotificationsModal(),
      'btn-explore': () => setActiveTab('categories'),
      'btn-heart': () => setActiveTab('trending'),
      'btn-add': () => { setActiveTab('write'); },
      'btn-avatar': () => { setActiveTab('profile'); renderProfile(true); },
      'btn-menu': () => { document.body.classList.toggle('drawer-open'); },
      'btn-grid': () => setActiveTab('trending')
    };
    Object.keys(map).forEach(id => {
      const el = document.getElementById(id);
      if(!el) return;
      el.addEventListener('click', (e) => {
        e.preventDefault();
        try { map[id](); } catch(err){ console.error('side icon handler error', err); }
      });
      el.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); map[id](); } });
    });
    updateSideBadges();
  }

  // Profile avatar now opens an Instagram-like gallery showing all of the user's posts in square tiles.
  function initProfileIconShortcut() {
    const profileIcon = document.getElementById('profile-icon');
    if (profileIcon) {
      profileIcon.style.cursor = "pointer";
      profileIcon.tabIndex = 0;
      profileIcon.addEventListener('click', () => {
        // open the gallery modal for the current user
        openProfileGallery();
      });
      profileIcon.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openProfileGallery();
        }
      });
    }

    // Keep keyboard access to the username element to open profile editing if desired
    const usernameEl = document.querySelector('.username');
    if (usernameEl) {
      usernameEl.tabIndex = 0;
      usernameEl.addEventListener('click', () => {
        setActiveTab('profile');
        renderProfile(true);
      });
      usernameEl.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setActiveTab('profile');
          renderProfile(true);
        }
      });
    }
  }

  // keyboard shortcut to open write editor: Cmd/Ctrl+K (or Ctrl+K)
  document.addEventListener('keydown', (e) => {
    if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      setActiveTab('write');
    }
  });

  // LOGOUT: delegated handler (works even if logout button is added/removed dynamically)
  // Behavior:
  // - Click on element matching #logoutBtn anywhere in the document triggers logout
  // - Keyboard: when #logoutBtn is focused, Enter/Space triggers logout
  // - Clears demo localStorage keys and redirects to a resolved login path (best-effort)
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
        } catch (e) {
          // HEAD may fail on some servers - try GET
        }
        if (!ok) {
          try {
            const res2 = await fetch(encodeURI(candidate), { method: 'GET', cache: 'no-store' });
            ok = res2 && res2.ok;
          } catch (e) {
            ok = false;
          }
        }
        if (ok) return candidate;
      } catch (err) {
        // ignore and try next
      }
    }
    return LOGIN_PATH_CANDIDATES[0];
  }

  // doLogout is intentionally top-level so delegation can call it
  async function doLogout() {
    try {
      localStorage.removeItem('loggedIn');
      localStorage.removeItem(KEY.PROFILE);
      // any other demo keys can be removed here
    } catch (err) {
      console.warn('Error clearing storage on logout', err);
    }

    // close settings menu if present
    const settingsMenu = document.getElementById('settings-menu');
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsMenu) {
      settingsMenu.style.display = 'none';
      settingsMenu.setAttribute('aria-hidden', 'true');
    }
    if (settingsBtn) settingsBtn.setAttribute('aria-expanded', 'false');

    // determine a reachable login path and redirect
    try {
      const dest = await resolveLoginPath();
      try { location.replace(dest); } catch (e) { location.href = dest; }
    } catch (err) {
      try { location.replace('log in.html'); } catch (e) { location.href = 'login.html'; }
    }
  }

  // Delegated click and keyboard listeners - robust even if element is recreated
  function attachDelegatedLogout() {
    // Click delegation
    document.addEventListener('click', function delegatedLogoutClick(e) {
      const btn = e.target.closest && e.target.closest('#logoutBtn');
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        doLogout().catch(err => console.error('logout error', err));
      }
    }, true); // use capture to ensure we catch before other handlers if necessary

    // Keyboard: Enter/Space when focused on logout button
    document.addEventListener('keydown', function delegatedLogoutKey(e) {
      const active = document.activeElement;
      if (!active) return;
      if (active.id === 'logoutBtn' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        doLogout().catch(err => console.error('logout error', err));
      }
    });
  }

  // theme & init
  function initTheme(){
    try {
      const t = localStorage.getItem(KEY.THEME);
      if(t === 'light') { document.body.classList.add('theme-light'); if(themeToggle) { themeToggle.textContent = 'Dark'; themeToggle.setAttribute('aria-pressed','true'); } }
      else { document.body.classList.remove('theme-light'); if(themeToggle) { themeToggle.textContent = 'Light'; themeToggle.setAttribute('aria-pressed','false'); } }
    } catch(e){}
  }

  function init(){
    initTheme();
    renderTopRightUser();
    renderFriends();
    renderPostCategoryOptions();
    renderFeed();
    renderNotifications();
    renderCommunities();
    renderPostCategoryOptionsForSelect(document.getElementById('write-category-select'));
    initNavAccessibility();
    restoreTabFromHashOrLast();
    initSideIcons();
    initProfileIconShortcut();
    attachDelegatedLogout(); // delegation-based logout wiring
    toast('Welcome back!');
  }

  function renderCommunities(){
    const el = document.getElementById('communities-list');
    if(!el) return;
    el.innerHTML = `<div class="muted">UI/UX Designers — 54 members<br>Frontend Developers — 16 members</div>`;
  }

  // expose debug
  window.feedApp = {
    getPosts: () => posts,
    getCategories: () => categories,
    getNotifications: () => notifications,
    saveState,
    setActiveTab,
    doLogout // expose for manual testing
  };

  init();
})();