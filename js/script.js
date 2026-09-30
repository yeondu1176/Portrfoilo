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
  works_swiper = new Swiper('#works_inner', {
    wrapperClass: "list",
    slideClass: "item",
    slidesPerView: "auto",
    spaceBetween: 80,
    speed: 900,
    nested: true,
    mousewheel: { enabled: true, sensitivity: 0.8, releaseOnEdges: true },
  });
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
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
    turnstileToken = "";
    status.textContent = '메시지가 전송되었습니다. 감사합니다.';
    if (window.turnstile) window.turnstile.reset();
  } catch (error) {
    status.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

loadWorks();
setupTurnstile();
