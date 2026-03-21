const API_URL = "http://127.0.0.1:5000/chat";

// ══════════════════════════════════════════════════════
// STORAGE HELPERS
// ══════════════════════════════════════════════════════
function getHistory()  { try { return JSON.parse(localStorage.getItem("bb_history") || "[]"); } catch(_){ return []; } }
function getSaved()    { try { return JSON.parse(localStorage.getItem("bb_saved")   || "[]"); } catch(_){ return []; } }
function saveHistory(h){ localStorage.setItem("bb_history", JSON.stringify(h)); }
function saveSaved(s)  { localStorage.setItem("bb_saved",   JSON.stringify(s)); }

function addHistory(query, bookCount) {
  const h = getHistory();
  h.unshift({ query, bookCount, time: Date.now() });
  if (h.length > 100) h.pop();
  saveHistory(h);
}

function isBookSaved(title, author) {
  return getSaved().some(b => b.title === title && b.author === author);
}

function toggleSave(book) {
  let saved = getSaved();
  const idx = saved.findIndex(b => b.title === book.title && b.author === book.author);
  if (idx >= 0) {
    saved.splice(idx, 1);
  } else {
    saved.unshift({
      title:    book.title,
      author:   book.author,
      rating:   book.rating,
      coverURL: book._coverURL || null,
    });
  }
  saveSaved(saved);
  updateSavedBadge();
  return idx < 0; // true = now saved
}

function updateSavedBadge() {
  const count = getSaved().length;
  const badge1 = document.getElementById("saved-count-badge");
  const badge2 = document.getElementById("nav-saved-badge");
  [badge1, badge2].forEach(el => {
    if (!el) return;
    if (count > 0) { el.textContent = count; el.style.display = ""; }
    else           { el.style.display = "none"; }
  });
}

// ══════════════════════════════════════════════════════
// SUGGESTIONS
// ══════════════════════════════════════════════════════
const suggestions = [
  "📚 Books like Harry Potter",
  "🔭 Best sci-fi novels",
  "👤 Books by Agatha Christie",
  "🌙 Dark fantasy recommendations",
  "💡 Self-improvement books",
  "🕵️ Mystery thriller novels",
];

function renderSuggestions() {
  const wrap = document.getElementById("suggestions");
  if (!wrap) return;
  wrap.innerHTML = suggestions
    .map(s => `<button class="suggestion-chip" onclick="useSuggestion(this)">${s}</button>`)
    .join("");
}

function useSuggestion(btn) {
  const input = document.getElementById("user-input");
  input.value = btn.textContent.replace(/^[\p{Emoji}\s]+/u, "").trim();
  hideSuggestions();
  sendMessage();
}

function hideSuggestions() {
  const hero = document.getElementById("hero");
  if (hero) {
    hero.classList.add("fade-out");
    setTimeout(() => (hero.style.display = "none"), 400);
  }
}

// ══════════════════════════════════════════════════════
// SEND / RECEIVE
// ══════════════════════════════════════════════════════
async function sendMessage() {
  const input = document.getElementById("user-input");
  const message = input.value.trim();
  if (!message) return;

  hideSuggestions();
  appendMessage(message, "user");
  input.value = "";
  autoResize(input);
  showTyping();

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const data = await response.json();
    removeTyping();

    if (data.type === "text") {
      appendMessage(data.response, "bot");
      addHistory(message, 0);
      return;
    }
    if (data.type === "books") {
      if (!data.response || data.response.length === 0) {
        appendMessage("No books found for that query.", "bot");
        addHistory(message, 0);
        return;
      }
      appendMessage(`Found <strong>${data.response.length}</strong> book${data.response.length > 1 ? "s" : ""} for you ✦`, "bot");
      addHistory(message, data.response.length);
      for (const book of data.response) {
        await appendBookCard(book);
      }
    }
  } catch (err) {
    removeTyping();
    console.error(err);
    appendMessage("⚠️ Something went wrong. Please try again.", "bot");
  }
}

// ══════════════════════════════════════════════════════
// MESSAGE BUBBLE
// ══════════════════════════════════════════════════════
function appendMessage(text, type) {
  const chatBox = document.getElementById("chat-box");
  const row = document.createElement("div");
  row.className = `msg-row ${type}`;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = type === "bot" ? "✦" : "you";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerHTML = text;

  if (type === "bot") { row.appendChild(avatar); row.appendChild(bubble); }
  else                { row.appendChild(bubble); row.appendChild(avatar); }

  chatBox.appendChild(row);
  scrollBottom();
}

// ══════════════════════════════════════════════════════
// BOOK CARDS
// ══════════════════════════════════════════════════════
const bookStore = {};

async function appendBookCard(book) {
  const chatBox = document.getElementById("chat-box");
  const wrapper = document.createElement("div");
  wrapper.className = "book-card-wrapper";
  const cardId = "card-" + Math.random().toString(36).slice(2, 9);
  book._cardId  = cardId;
  book._coverURL = null;
  bookStore[cardId] = book;

  wrapper.innerHTML = buildCardHTML(book, cardId);
  chatBox.appendChild(wrapper);
  scrollBottom();

  // Update save button state
  refreshCardSaveBtn(wrapper, book);

  // Fetch cover
  const coverURL = await fetchCoverURL(book.title, book.author);
  book._coverURL = coverURL || null;
  if (coverURL) {
    const coverWrap = wrapper.querySelector(".book-cover-wrap");
    if (coverWrap) {
      const img = document.createElement("img");
      img.className = "book-cover";
      img.alt = book.title;
      img.onload = () => { coverWrap.innerHTML = ""; coverWrap.appendChild(img); };
      img.onerror = () => {};
      img.src = coverURL;
    }
  }
}

function buildCardHTML(book, cardId) {
  const cover = fallbackCoverSVG(book.title);
  const stars  = renderStars(book.rating);
  const year   = book.year  ? `<span class="meta-pill">${book.year}</span>` : "";
  const pages  = book.pages ? `<span class="meta-pill">${book.pages} pp</span>` : "";
  const saved  = isBookSaved(book.title, book.author);

  return `
    <div class="book-card" data-card-id="${cardId}">
      <div class="book-cover-wrap">${cover}</div>
      <div class="book-body">
        <div class="book-top">
          <div>
            <div class="book-title">${esc(book.title)}</div>
            <div class="book-author">by ${esc(book.author)}</div>
          </div>
          <div class="book-rating">${stars}</div>
        </div>
        <p class="book-desc">${esc(book.description || "")}</p>
        <div class="book-footer">
          <div class="book-meta">${year}${pages}</div>
          <div style="display:flex;align-items:center;gap:6px;">
            <button class="book-save-btn ${saved ? "saved" : ""}" data-card-id="${cardId}" title="${saved ? "Remove from library" : "Save to library"}">
              <span class="material-symbols-outlined">${saved ? "bookmark" : "bookmark_border"}</span>
              ${saved ? "Saved" : "Save"}
            </button>
            <span class="book-expand-hint">
              <span class="material-symbols-outlined">open_in_full</span>
              Expand
            </span>
          </div>
        </div>
      </div>
    </div>`;
}

function refreshCardSaveBtn(wrapper, book) {
  const btn = wrapper.querySelector(".book-save-btn");
  if (!btn) return;
  const saved = isBookSaved(book.title, book.author);
  btn.className = `book-save-btn ${saved ? "saved" : ""}`;
  btn.title = saved ? "Remove from library" : "Save to library";
  btn.innerHTML = `<span class="material-symbols-outlined">${saved ? "bookmark" : "bookmark_border"}</span> ${saved ? "Saved" : "Save"}`;
}

async function fetchCoverURL(title, author) {
  try {
    const q = encodeURIComponent(title + " " + author);
    const r = await fetch(`https://openlibrary.org/search.json?q=${q}&limit=3&fields=cover_i,isbn`);
    const d = await r.json();
    for (const doc of (d.docs || [])) {
      if (doc.cover_i) return `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
    }
  } catch (_) {}
  try {
    const q = encodeURIComponent(title);
    const r = await fetch(`https://openlibrary.org/search.json?title=${q}&limit=5&fields=cover_i,isbn`);
    const d = await r.json();
    for (const doc of (d.docs || [])) {
      if (doc.cover_i) return `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
    }
    for (const doc of (d.docs || [])) {
      if (doc.isbn?.[0]) return `https://covers.openlibrary.org/b/isbn/${doc.isbn[0]}-L.jpg`;
    }
  } catch (_) {}
  return null;
}

// ══════════════════════════════════════════════════════
// BOOK DETAIL OVERLAY
// ══════════════════════════════════════════════════════
let currentOverlayCardId = null;

function openBookOverlay(cardId) {
  const book = bookStore[cardId];
  if (!book) return;
  currentOverlayCardId = cardId;

  const overlay = document.getElementById("book-overlay");

  // Cover
  const coverEl = document.getElementById("overlay-cover");
  coverEl.innerHTML = book._coverURL
    ? `<img src="${book._coverURL}" alt="${esc(book.title)}" style="width:100%;height:100%;object-fit:cover;display:block;">`
    : fallbackCoverHTML(book.title);

  // Meta
  document.getElementById("overlay-meta").innerHTML = [
    book.year   && `<div class="overlay-meta-row"><div class="overlay-meta-label">Published</div><div class="overlay-meta-value">${book.year}</div></div>`,
    book.pages  && `<div class="overlay-meta-row"><div class="overlay-meta-label">Pages</div><div class="overlay-meta-value">${book.pages}</div></div>`,
    book.rating && `<div class="overlay-meta-row"><div class="overlay-meta-label">Rating</div><div class="overlay-meta-value">${book.rating} / 5</div></div>`,
  ].filter(Boolean).join("");

  document.getElementById("overlay-genre").textContent  = "Book";
  document.getElementById("overlay-title").textContent  = book.title;
  document.getElementById("overlay-author").textContent = "by " + book.author;
  document.getElementById("overlay-stars").innerHTML    = renderStars(book.rating);
  document.getElementById("overlay-desc").textContent   = book.description || "";

  // Save button
  const saveBtn = document.getElementById("overlay-save-btn");
  refreshOverlaySaveBtn(saveBtn, book);
  saveBtn.onclick = () => {
    const nowSaved = toggleSave(book);
    refreshOverlaySaveBtn(saveBtn, book);
    // Also refresh card in chat
    const wrapper = document.querySelector(`[data-card-id="${cardId}"]`)?.closest(".book-card-wrapper");
    if (wrapper) refreshCardSaveBtn(wrapper, book);
    // Refresh saved tab if open
    if (document.getElementById("archive-overlay").style.display !== "none") renderSavedList();
    // Toast
    showToast(nowSaved ? "Saved to your library ✦" : "Removed from library");
  };

  // Explain button
  const explainPanel = document.getElementById("overlay-explain-panel");
  const explainBtn   = document.getElementById("overlay-explain-btn");
  explainPanel.style.display = "none";
  explainPanel.innerHTML     = "";
  explainBtn.className       = "overlay-explain-btn";
  explainBtn.innerHTML       = `<span class="material-symbols-outlined">auto_stories</span> What's this about?`;
  explainBtn.onclick         = () => generateExplanation(book.title, book.author, explainBtn, explainPanel);

  overlay.style.display = "flex";
  document.body.style.overflow = "hidden";
}

function refreshOverlaySaveBtn(btn, book) {
  const saved = isBookSaved(book.title, book.author);
  btn.className = `overlay-save-btn ${saved ? "saved" : ""}`;
  btn.innerHTML = saved
    ? `<span class="material-symbols-outlined">bookmark</span> Saved`
    : `<span class="material-symbols-outlined">bookmark_border</span> Save to Library`;
}

function closeBookOverlay() {
  const overlay = document.getElementById("book-overlay");
  overlay.style.opacity = "0";
  overlay.style.transition = "opacity .2s ease";
  setTimeout(() => {
    overlay.style.display = "none";
    overlay.style.opacity = "";
    overlay.style.transition = "";
    document.body.style.overflow = "";
    currentOverlayCardId = null;
  }, 200);
}

function fallbackCoverHTML(title) {
  const initials = (title || "?").split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
  const hue = [...(title || "")].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return `<div class="cover-fallback" style="--hue:${hue}deg">${initials}</div>`;
}

// ══════════════════════════════════════════════════════
// EXPLANATION GENERATOR
// ══════════════════════════════════════════════════════
async function generateExplanation(title, author, btn, panel) {
  if (panel.style.display !== "none") {
    panel.style.display = "none";
    btn.className = "overlay-explain-btn";
    btn.innerHTML = `<span class="material-symbols-outlined">auto_stories</span> What's this about?`;
    return;
  }

  btn.className = "overlay-explain-btn loading";
  btn.innerHTML = `<svg class="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Thinking…`;

  panel.style.display = "block";
  panel.innerHTML = `<div class="explain-skeleton"><span></span><span></span><span></span></div>`;

  try {
    const response = await fetch("/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, author }),
    });

    if (!response.ok) throw new Error(`Server error ${response.status}`);

    panel.innerHTML = `<div class="explain-text"></div>`;
    const textEl  = panel.querySelector(".explain-text");
    const reader  = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer    = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const chunk = line.slice(6);
        if (!chunk) continue;
        if (chunk.startsWith("ERROR:")) {
          panel.innerHTML = `<div class="explain-error">⚠️ ${chunk}</div>`;
          btn.className = "overlay-explain-btn";
          btn.innerHTML = `<span class="material-symbols-outlined">auto_stories</span> Try again`;
          return;
        }
        textEl.textContent += chunk.replace(/\{\{NL\}\}/g, "\n");
      }
    }

    btn.className = "overlay-explain-btn done";
    btn.innerHTML = `<span class="material-symbols-outlined">check_circle</span> Explained ✦`;

  } catch (err) {
    console.error(err);
    panel.innerHTML = `<div class="explain-error">⚠️ Couldn't load explanation. Please try again.</div>`;
    btn.className = "overlay-explain-btn";
    btn.innerHTML = `<span class="material-symbols-outlined">auto_stories</span> Try again`;
  }
}

// ══════════════════════════════════════════════════════
// ARCHIVE PANEL
// ══════════════════════════════════════════════════════
let activeArchiveTab = "history";

function openArchive(defaultTab = "history") {
  activeArchiveTab = defaultTab;
  document.getElementById("archive-overlay").style.display = "flex";
  document.body.style.overflow = "hidden";
  switchArchiveTab(defaultTab);
  updateSavedBadge();
}

function closeArchive() {
  const el = document.getElementById("archive-overlay");
  el.style.opacity = "0";
  el.style.transition = "opacity .2s ease";
  setTimeout(() => {
    el.style.display = "none";
    el.style.opacity = "";
    el.style.transition = "";
    document.body.style.overflow = "";
  }, 200);
}

function switchArchiveTab(tab) {
  activeArchiveTab = tab;
  document.querySelectorAll(".archive-tab").forEach(t => t.classList.toggle("active", t.dataset.tab === tab));
  document.getElementById("tab-history").style.display = tab === "history" ? "flex" : "none";
  document.getElementById("tab-saved").style.display   = tab === "saved"   ? "flex" : "none";
  if (tab === "history") renderHistoryList();
  else                   renderSavedList();
}

function renderHistoryList(filter = "") {
  const list = document.getElementById("archive-list");
  const h    = getHistory().filter(i => !filter || i.query.toLowerCase().includes(filter.toLowerCase()));

  if (h.length === 0) {
    list.innerHTML = `<div class="archive-empty">
      <span class="material-symbols-outlined">chat</span>
      <p>${filter ? "No matches found." : "Your chat history will appear here."}</p>
    </div>`;
    return;
  }

  list.innerHTML = h.map((item, idx) => `
    <div class="history-item" data-idx="${idx}">
      <div class="history-query">${esc(item.query)}</div>
      <div class="history-meta">
        <span class="history-time">${timeAgo(item.time)}</span>
        ${item.bookCount > 0 ? `<span class="history-count">${item.bookCount} book${item.bookCount > 1 ? "s" : ""}</span>` : ""}
      </div>
    </div>`).join("");

  list.querySelectorAll(".history-item").forEach(el => {
    el.addEventListener("click", () => {
      const item = h[+el.dataset.idx];
      closeArchive();
      const input = document.getElementById("user-input");
      input.value = item.query;
      sendMessage();
    });
  });
}

function renderSavedList(filter = "") {
  const list  = document.getElementById("saved-list");
  const saved = getSaved().filter(b => !filter ||
    b.title.toLowerCase().includes(filter.toLowerCase()) ||
    b.author.toLowerCase().includes(filter.toLowerCase())
  );

  if (saved.length === 0) {
    list.innerHTML = `<div class="archive-empty">
      <span class="material-symbols-outlined">bookmark_border</span>
      <p>${filter ? "No matches found." : "Books you save will appear here.\nClick any book card to save it."}</p>
    </div>`;
    return;
  }

  list.innerHTML = saved.map((book, idx) => `
    <div class="saved-book-item" data-idx="${idx}">
      <div class="saved-book-cover">
        ${book.coverURL
          ? `<img src="${book.coverURL}" alt="${esc(book.title)}" onerror="this.parentElement.innerHTML=fallbackCoverHTML('${esc(book.title)}')">`
          : fallbackCoverHTML(book.title)}
      </div>
      <div class="saved-book-info">
        <div class="saved-book-title">${esc(book.title)}</div>
        <div class="saved-book-author">by ${esc(book.author)}</div>
        <div class="saved-book-rating">${renderStars(book.rating)}</div>
      </div>
      <button class="saved-book-remove" data-idx="${idx}" title="Remove from library">
        <span class="material-symbols-outlined">close</span>
      </button>
    </div>`).join("");

  list.querySelectorAll(".saved-book-remove").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const allSaved = getSaved();
      allSaved.splice(+btn.dataset.idx, 1);
      saveSaved(allSaved);
      updateSavedBadge();
      renderSavedList(document.getElementById("saved-search").value);
    });
  });
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000)      return "just now";
  if (diff < 3600000)    return Math.floor(diff / 60000) + "m ago";
  if (diff < 86400000)   return Math.floor(diff / 3600000) + "h ago";
  return Math.floor(diff / 86400000) + "d ago";
}

// ══════════════════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════════════════
function showToast(msg) {
  let toast = document.getElementById("bb-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "bb-toast";
    toast.style.cssText = `
      position:fixed; bottom:28px; left:50%; transform:translateX(-50%);
      background:#1e1b17; border:1px solid rgba(247,189,86,.3); color:#f7bd56;
      font-family:'Manrope',sans-serif; font-size:13px; padding:9px 20px;
      border-radius:24px; z-index:200; box-shadow:0 4px 20px rgba(0,0,0,.5);
      pointer-events:none; transition:opacity .3s ease;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = "1";
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.style.opacity = "0"; }, 2200);
}

// ══════════════════════════════════════════════════════
// TYPING INDICATOR
// ══════════════════════════════════════════════════════
function showTyping() {
  const chatBox = document.getElementById("chat-box");
  const row = document.createElement("div");
  row.className = "msg-row bot";
  row.id = "typing-row";
  row.innerHTML = `
    <div class="avatar">✦</div>
    <div class="bubble typing-bubble">
      <span class="dot"></span><span class="dot"></span><span class="dot"></span>
    </div>`;
  chatBox.appendChild(row);
  scrollBottom();
}

function removeTyping() { document.getElementById("typing-row")?.remove(); }

// ══════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════
function renderStars(rating) {
  const r = parseFloat(rating) || 0;
  const full = Math.floor(r);
  const half = r - full >= 0.5;
  let s = "";
  for (let i = 0; i < 5; i++) {
    if (i < full)              s += `<span class="star full">★</span>`;
    else if (i === full && half) s += `<span class="star half">★</span>`;
    else                       s += `<span class="star empty">★</span>`;
  }
  return s;
}

function fallbackCoverSVG(title) {
  const initials = (title || "?").split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
  const hue = [...(title || "")].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return `<div class="cover-fallback" style="--hue:${hue}deg">${initials}</div>`;
}

function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function scrollBottom() {
  const c = document.getElementById("chat-box");
  c.scrollTo({ top: c.scrollHeight, behavior: "smooth" });
}

function autoResize(el) {
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 160) + "px";
}

// ══════════════════════════════════════════════════════
// EVENTS
// ══════════════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {
  renderSuggestions();
  updateSavedBadge();

  // Input
  const input = document.getElementById("user-input");
  input.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  input.addEventListener("input", () => autoResize(input));
  document.getElementById("send-btn").addEventListener("click", sendMessage);

  // Sidebar nav
  document.getElementById("nav-discover").addEventListener("click", () => {
    document.getElementById("nav-discover").classList.add("active");
    document.getElementById("nav-archive").classList.remove("active");
    document.getElementById("nav-saved").classList.remove("active");
  });
  document.getElementById("nav-archive").addEventListener("click", () => {
    document.getElementById("nav-archive").classList.add("active");
    document.getElementById("nav-discover").classList.remove("active");
    document.getElementById("nav-saved").classList.remove("active");
    openArchive("history");
  });
  document.getElementById("nav-saved").addEventListener("click", () => {
    document.getElementById("nav-saved").classList.add("active");
    document.getElementById("nav-discover").classList.remove("active");
    document.getElementById("nav-archive").classList.remove("active");
    openArchive("saved");
  });

  // Archive panel controls
  document.getElementById("archive-close").addEventListener("click", closeArchive);
  document.getElementById("archive-backdrop").addEventListener("click", closeArchive);
  document.querySelectorAll(".archive-tab").forEach(tab => {
    tab.addEventListener("click", () => switchArchiveTab(tab.dataset.tab));
  });

  // Search inputs
  document.getElementById("archive-search").addEventListener("input", e => renderHistoryList(e.target.value));
  document.getElementById("saved-search").addEventListener("input",   e => renderSavedList(e.target.value));

  // Clear button
  document.getElementById("archive-clear-btn").addEventListener("click", () => {
    if (activeArchiveTab === "history") {
      if (confirm("Clear all chat history?")) { saveHistory([]); renderHistoryList(); }
    } else {
      if (confirm("Remove all saved books?")) { saveSaved([]); updateSavedBadge(); renderSavedList(); }
    }
  });

  // Chat box click delegation
  document.getElementById("chat-box").addEventListener("click", e => {
    // Save button on card
    const saveBtn = e.target.closest(".book-save-btn");
    if (saveBtn) {
      e.stopPropagation();
      const cardId = saveBtn.dataset.cardId;
      const book   = bookStore[cardId];
      if (!book) return;
      const nowSaved = toggleSave(book);
      const wrapper  = saveBtn.closest(".book-card-wrapper");
      if (wrapper) refreshCardSaveBtn(wrapper, book);
      if (document.getElementById("archive-overlay").style.display !== "none") renderSavedList();
      showToast(nowSaved ? "Saved to your library ✦" : "Removed from library");
      return;
    }
    // Expand card → overlay
    const card = e.target.closest(".book-card");
    if (card) openBookOverlay(card.dataset.cardId);
  });

  // Book overlay close
  document.getElementById("overlay-close").addEventListener("click", closeBookOverlay);
  document.getElementById("overlay-backdrop").addEventListener("click", closeBookOverlay);
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      if (document.getElementById("book-overlay").style.display !== "none") closeBookOverlay();
      else closeArchive();
    }
  });
});