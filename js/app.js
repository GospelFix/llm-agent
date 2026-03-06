/* ========================================
   App — 공통 초기화 및 사이드바 렌더링
   모든 페이지에서 공통으로 로드되는 모듈
   ======================================== */

/* 현재 페이지가 /pages/ 하위인지 판별하여 경로 prefix 결정 */
const isSubPage = window.location.pathname.includes('/pages/');
const ROOT = isSubPage ? '../' : './';

/** 내비게이션 항목 정의 */
const NAV_ITEMS = [
  {
    section: '워크스페이스',
    items: [
      { label: '파이프라인', href: `${ROOT}index.html`,          dot: 'var(--border)' },
      { label: '에이전트',   href: `${ROOT}pages/agents.html`,   dot: 'var(--border)' },
      { label: '프롬프트',   href: `${ROOT}pages/prompts.html`,  dot: 'var(--border)' },
    ],
  },
  {
    section: '실행',
    items: [
      { label: '히스토리', href: `${ROOT}pages/history.html`, dot: 'var(--border)' },
      { label: '아웃풋',   href: `${ROOT}pages/output.html`,  dot: 'var(--border)' },
    ],
  },
];

/** 사이드바 HTML 동적 생성 및 마운트 */
const renderSidebar = () => {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  const state = Store.get();
  const currentPath = window.location.pathname;

  /* 내비 섹션 HTML 생성 */
  const navHTML = NAV_ITEMS.map((section, idx) => {
    const itemsHTML = section.items.map((item) => {
      /* 현재 페이지 URL과 비교하여 active 여부 결정 */
      const isActive = currentPath.endsWith(item.href.replace(ROOT, '')) ||
        (item.href.includes('index.html') && (currentPath.endsWith('/') || currentPath.endsWith('index.html')));

      return `
        <a href="${item.href}" class="nav-item${isActive ? ' active' : ''}" aria-label="${item.label}">
          <div class="nav-dot" style="background:${isActive ? 'var(--accent-pipe)' : item.dot}"></div>
          ${item.label}
        </a>
      `;
    }).join('');

    return `
      <div class="nav-section" ${idx > 0 ? 'style="margin-top:12px"' : ''}>
        <div class="nav-label">${section.section}</div>
        ${itemsHTML}
      </div>
    `;
  }).join('');

  /* 크레딧 사용량 (80% 초과 시 경고색) */
  const usedCredits = state.tokenMax - state.tokenBalance;
  const usedPct = state.tokenMax > 0 ? Math.round((usedCredits / state.tokenMax) * 100) : 0;
  const creditColor = usedPct >= 80 ? 'var(--accent-pm)' : 'var(--accent-pipe)';
  const creditLabel = usedPct >= 80 ? '⚠ 크레딧 부족' : '크레딧 사용량';
  const tokenHTML = `
    <div class="sidebar-footer">
      <div class="token-balance">
        <span style="color:var(--text-dim);font-size:9px">${creditLabel}</span><br>
        <span class="token-balance-value" id="sidebar-token-balance" style="color:${creditColor}">${usedCredits.toLocaleString()}</span>
        <span style="color:var(--text-dim)"> / ${state.tokenMax.toLocaleString()} 크레딧</span>
        <div style="margin-top:6px;height:3px;background:var(--border);border-radius:2px;overflow:hidden">
          <div id="sidebar-credit-bar" style="height:100%;width:${usedPct}%;background:${creditColor};border-radius:2px;transition:width 0.4s ease"></div>
        </div>
      </div>
    </div>
  `;

  sidebar.innerHTML = `
    <div class="logo">
      <div class="logo-icon">⚡</div>
      <div class="logo-text">Multi-Agent<span class="beta-badge">BETA</span></div>
      <div class="logo-sub">Studio</div>
    </div>
    ${navHTML}
    ${tokenHTML}
  `;
};

/** 햄버거 메뉴 초기화 (모바일 전용) */
const initHamburger = () => {
  const btn = document.getElementById('hamburger-btn');
  const sidebar = document.getElementById('sidebar');
  if (!btn || !sidebar) return;

  btn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });

  /* 사이드바 외부 클릭 시 닫기 */
  document.addEventListener('click', (e) => {
    if (!sidebar.contains(e.target) && e.target !== btn) {
      sidebar.classList.remove('open');
    }
  });
};

/** 사이드바 크레딧 사용량 갱신 */
const updateTokenDisplay = () => {
  const el = document.getElementById('sidebar-token-balance');
  const bar = document.getElementById('sidebar-credit-bar');
  if (!el) return;
  const state = Store.get();
  const usedCredits = state.tokenMax - state.tokenBalance;
  const usedPct = state.tokenMax > 0 ? Math.round((usedCredits / state.tokenMax) * 100) : 0;
  const creditColor = usedPct >= 80 ? 'var(--accent-pm)' : 'var(--accent-pipe)';
  el.textContent = usedCredits.toLocaleString();
  el.style.color = creditColor;
  if (bar) { bar.style.width = `${usedPct}%`; bar.style.background = creditColor; }
};

/* DOM 준비 시 초기화 */
document.addEventListener('DOMContentLoaded', () => {
  renderSidebar();
  initHamburger();
});
