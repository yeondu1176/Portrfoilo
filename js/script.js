const video = document.getElementById('back');
const main_inner = document.getElementById('main_inner');
video.addEventListener('ended', () => main_inner.classList.add('active'));

const gnb_swiper = new Swiper('#gnb', {
  wrapperClass: "menu",
  slideClass: "btn",
  slidesPerView: "auto",
});

const wrap_swiper = new Swiper('#wrap', {
  wrapperClass: "container",
  slideClass: "section",
  direction: "vertical",
  speed: 600,
  thumbs: { swiper: gnb_swiper, slideThumbActiveClass: "active" },
  navigation: { nextEl: ".next", prevEl: ".prev" },
  pagination: { el: ".pager", clickable: true, bulletActiveClass: "active" },
  mousewheel: true
});

let works_swiper;

function initWorksSwiper() {
  if (works_swiper) works_swiper.destroy(true, true);
  const works = document.getElementById('works');
  if (!works.querySelector('.portfolio-bottom-deco')) works.insertAdjacentHTML('beforeend', `
    <div class="portfolio-bottom-deco" aria-hidden="true"><img class="portfolio-footer-art" src="./images/사이트 페이지.png" alt=""></div><div class="portfolio-controls"><button class="portfolio-prev" type="button" aria-label="이전 작품">◀</button><button class="portfolio-next" type="button" aria-label="다음 작품">▶</button></div>`);
  const isMobileWorks = window.matchMedia('(max-width: 700px)').matches;
  works_swiper = new Swiper('#works_inner', {
    wrapperClass:"list",
    slideClass:"item",
    slidesPerView:isMobileWorks ? 1 : "auto",
    slidesPerGroup:1,
    spaceBetween:isMobileWorks ? 0 : 15,
    centeredSlides:isMobileWorks,
    loop:true,
    speed:700,
    nested:true,
    watchSlidesProgress:true,
    navigation:isMobileWorks ? undefined : {nextEl:".portfolio-next",prevEl:".portfolio-prev"},
    breakpoints:isMobileWorks ? undefined : {
      700:{slidesPerView:"auto",spaceBetween:20},
      1100:{slidesPerView:"auto",spaceBetween:15}
    }
  });
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}

function normalizePortfolioSearch(value = "") {
  return String(value).toLocaleLowerCase("ko-KR").replace(/\s+/g, " ").trim();
}

function setupPortfolioSearch(allWorks, list) {
  const input = document.getElementById("portfolio-search-input");
  if (!input) return;

  const render = (query = "") => {
    const term = normalizePortfolioSearch(query);
    const filtered = term
      ? allWorks.filter(work => normalizePortfolioSearch([
          work.title, work.category, work.description,
          ...(Array.isArray(work.keywords) ? work.keywords : [])
        ].filter(Boolean).join(" ")).includes(term))
      : allWorks;

    list.innerHTML = filtered.map((work) => {
      const originalIndex = allWorks.indexOf(work);
      const href = work.detailPage ? escapeHtml(work.detailPage) : '#';
      const fancybox = work.detailPage ? 'data-fancybox="portfolio" data-type="iframe"' : '';
      return `<div class="item">
        <a href="${href}" class="work-card" ${fancybox}>
          <div class="thumb-box"><img src="${escapeHtml(work.thumbnail)}" alt="${escapeHtml(work.title)}"></div>
          <div class="meta-info">
            <div class="top-row">
              <span class="index-num">No. ${String(originalIndex + 1).padStart(2, '0')}</span>
              <span class="category-stamp">${escapeHtml(work.category)}</span>
            </div>
            <h3 class="project-title">${escapeHtml(work.title)}</h3>
            <p class="project-desc">${escapeHtml(work.description)}</p>
          </div>
        </a>
      </div>`;
    }).join('');

    initWorksSwiper();
    Fancybox.bind("[data-fancybox]", {});
  };

  const button = document.querySelector(".portfolio-search-button");
  const runSearch = () => render(input.value);

  input.addEventListener("input", runSearch);
  input.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      runSearch();
    }
  });
  if (button) button.addEventListener("click", runSearch);
}

async function loadWorks() {
  const list = document.querySelector('#works_inner .list');
  try {
    const response = await fetch('./data/works.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('works.json load failed');
    const works = (await response.json())
      .filter(work => work.published !== false)
      .sort((a, b) => (Number(a.order) || 9999) - (Number(b.order) || 9999));

    list.innerHTML = works.map((work, index) => {
      const href = work.detailPage ? escapeHtml(work.detailPage) : '#';
      const fancybox = work.detailPage ? 'data-fancybox="portfolio" data-type="iframe"' : '';
      return `<div class="item">
        <a href="${href}" class="work-card" ${fancybox}>
          <div class="thumb-box"><img src="${escapeHtml(work.thumbnail)}" alt="${escapeHtml(work.title)}"></div>
          <div class="meta-info">
            <div class="top-row">
              <span class="index-num">No. ${String(index + 1).padStart(2, '0')}</span>
              <span class="category-stamp">${escapeHtml(work.category)}</span>
            </div>
            <h3 class="project-title">${escapeHtml(work.title)}</h3>
            <p class="project-desc">${escapeHtml(work.description)}</p>
          </div>
        </a>
      </div>`;
    }).join('');

    initWorksSwiper();
    Fancybox.bind("[data-fancybox]", {});
    setupPortfolioSearch(works, list);
  } catch (error) {
    console.warn('CMS 작품 데이터를 불러오지 못해 기존 카드 마크업을 사용합니다.', error);
    initWorksSwiper();
    Fancybox.bind("[data-fancybox]", {});
  }
}

let turnstileToken = "";
async function setupTurnstile() {
  try {
    const response = await fetch('/api/guestbook');
    if (!response.ok) return;
    const { turnstileSiteKey } = await response.json();
    if (!turnstileSiteKey) return;

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.turnstile.render('#turnstile-box', {
        sitekey: turnstileSiteKey,
        callback: token => { turnstileToken = token; },
        'expired-callback': () => { turnstileToken = ""; }
      });
    };
    document.head.appendChild(script);
  } catch (_) {}
}

const guestbookForm = document.getElementById('guestbook-form');
guestbookForm?.addEventListener('submit', async event => {
  event.preventDefault();
  const status = document.getElementById('guestbook-status');
  const button = guestbookForm.querySelector('button');
  const form = new FormData(guestbookForm);
  status.textContent = '전송 중...';
  button.disabled = true;

  try {
    const response = await fetch('/api/guestbook', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: form.get('name'),
        message: form.get('message'),
        website: form.get('website'),
        turnstileToken
      })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || '전송에 실패했습니다.');
    guestbookForm.reset();
    resizeGuestbookMessage();
    turnstileToken = "";
    status.textContent = '메시지가 전송되었습니다. 감사합니다.';
    if (window.turnstile) window.turnstile.reset();
    if (document.getElementById('guestbook-modal')?.classList.contains('is-open')) loadGuestbookEntries();
  } catch (error) {
    status.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

loadWorks();
setupTurnstile();


// Guestbook viewer: approved latest 10
const guestbookModal = document.getElementById('guestbook-modal');
const guestbookOpen = document.getElementById('guestbook-open');
const guestbookList = document.getElementById('guestbook-list');
const GUESTBOOK_SEEN_KEY = 'portfolioGuestbookLastSeen';

function formatGuestbookDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(date);
}

function newestGuestbookTime(entries = []) {
  return entries.reduce((latest, entry) => {
    const time = Date.parse(entry.createdAt || '');
    return Number.isNaN(time) ? latest : Math.max(latest, time);
  }, 0);
}

function markGuestbookSeen(entries = []) {
  const newest = newestGuestbookTime(entries);
  if (newest) localStorage.setItem(GUESTBOOK_SEEN_KEY, String(newest));
  guestbookOpen?.classList.remove('has-unread');
}

async function checkGuestbookUnread() {
  if (!guestbookOpen) return;
  try {
    const response = await fetch('/api/guestbook?list=1', { cache: 'no-store' });
    if (!response.ok) return;
    const result = await response.json();
    const entries = Array.isArray(result.entries) ? result.entries : [];
    const newest = newestGuestbookTime(entries);
    const lastSeen = Number(localStorage.getItem(GUESTBOOK_SEEN_KEY) || 0);

    if (!lastSeen && newest) {
      localStorage.setItem(GUESTBOOK_SEEN_KEY, String(newest));
      guestbookOpen.classList.remove('has-unread');
      return;
    }
    guestbookOpen.classList.toggle('has-unread', newest > lastSeen);
  } catch (_) {}
}

async function loadGuestbookEntries(markAsSeen = false) {
  if (!guestbookList) return;
  guestbookList.innerHTML = '<p class="guestbook-empty">방명록을 불러오는 중...</p>';
  try {
    const response = await fetch('/api/guestbook?list=1', { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || '방명록을 불러오지 못했습니다.');
    const entries = Array.isArray(result.entries) ? result.entries.slice(0, 10) : [];
    if (markAsSeen) markGuestbookSeen(entries);
    guestbookList.innerHTML = entries.length ? entries.map(entry => `
      <article class="guestbook-entry">
        <div class="guestbook-entry-head">
          <strong class="guestbook-entry-name">${escapeHtml(entry.name)}</strong>
          <time class="guestbook-entry-date" datetime="${escapeHtml(entry.createdAt)}">${formatGuestbookDate(entry.createdAt)}</time>
        </div>
        <p class="guestbook-entry-message">${escapeHtml(entry.message)}</p>
      </article>
    `).join('') : '<p class="guestbook-empty">아직 공개된 방명록이 없어요.</p>';
  } catch (error) {
    guestbookList.innerHTML = `<p class="guestbook-empty">${escapeHtml(error.message)}</p>`;
  }
}

function openGuestbookModal() {
  if (!guestbookModal) return;
  guestbookModal.classList.add('is-open');
  guestbookModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('guestbook-modal-open');
  loadGuestbookEntries(true);
  guestbookModal.querySelector('.guestbook-close')?.focus();
}

function closeGuestbookModal() {
  if (!guestbookModal) return;
  guestbookModal.classList.remove('is-open');
  guestbookModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('guestbook-modal-open');
  guestbookOpen?.focus();
}

guestbookOpen?.addEventListener('click', openGuestbookModal);
document.querySelectorAll('[data-guestbook-close]').forEach(el => el.addEventListener('click', closeGuestbookModal));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && guestbookModal?.classList.contains('is-open')) closeGuestbookModal();
});


checkGuestbookUnread();
window.setInterval(checkGuestbookUnread, 60000);


// Guestbook message textarea auto-resize
const guestbookMessage = guestbookForm?.querySelector('textarea[name="message"]');

function resizeGuestbookMessage() {
  if (!guestbookMessage) return;
  const maxHeight = 126;
  const minHeight = 20;
  if (!guestbookMessage.value) {
    guestbookMessage.style.setProperty('height', `${minHeight}px`, 'important');
    guestbookMessage.classList.remove('is-scrollable');
    return;
  }
  guestbookMessage.style.setProperty('height', `${minHeight}px`, 'important');
  const nextHeight = Math.max(minHeight, Math.min(guestbookMessage.scrollHeight, maxHeight));
  guestbookMessage.style.setProperty('height', `${nextHeight}px`, 'important');
  guestbookMessage.classList.toggle('is-scrollable', guestbookMessage.scrollHeight > maxHeight);
}

guestbookMessage?.addEventListener('input', resizeGuestbookMessage);
resizeGuestbookMessage();
