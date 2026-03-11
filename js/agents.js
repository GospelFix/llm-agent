/* ========================================
   Agents JS — 에이전트 설정 페이지 로직
   Provider/Model 캐스케이딩 + 직급별 토큰 제한
   + System Prompt + API Key 편집
   ======================================== */

'use strict';

let agentsData = [];
let selectedAgentId = null;

/* ─── Provider → Model 계층 구조 ─── */
const PROVIDER_MODELS = {
  anthropic: {
    label: 'Anthropic',
    icon: '🤖',
    models: [
      { value: 'claude-haiku-4-5',  label: 'Claude Haiku 4.5',  desc: '빠름 · 저비용' },
      { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', desc: '균형 · 추천' },
      { value: 'claude-opus-4-6',   label: 'Claude Opus 4.6',   desc: '최고성능 · 고비용' },
    ],
  },
  openai: {
    label: 'OpenAI',
    icon: '◆',
    models: [
      { value: 'gpt-4o',      label: 'GPT-4o',      desc: '멀티모달 · 최신' },
      { value: 'gpt-4o-mini', label: 'GPT-4o Mini', desc: '경량 · 저비용' },
      { value: 'o1-mini',     label: 'O1 Mini',     desc: '추론 특화' },
    ],
  },
  custom: {
    label: '커스텀',
    icon: '🔌',
    models: [
      { value: 'custom', label: '커스텀 모델', desc: '직접 입력 · OpenAI-compatible' },
    ],
  },
};

/* ─── 직급 옵션 (토큰 제한 포함) ─── */
const RANK_OPTIONS = [
  { value: 'intern',     label: '인턴',     icon: '🔰', tokenLimit: 500,   colorVar: '--text-dim',      desc: '짧은 초안 · 단순 요약 · 빠른 응답' },
  { value: 'junior',     label: '신입사원', icon: '🌱', tokenLimit: 1000,  colorVar: '--accent-dev',    desc: '단락 수준 카피 · 기본 분석 보고서' },
  { value: 'associate',  label: '대리',     icon: '🖥',  tokenLimit: 2000,  colorVar: '--accent-design', desc: '1~2페이지 전략서 · 상세 카피 덱' },
  { value: 'manager',    label: '과장',     icon: '⭐', tokenLimit: 4000,  colorVar: '--accent-pm',     desc: '멀티 섹션 보고서 · 완성도 높은 브리프' },
  { value: 'lead',       label: '팀장',     icon: '👑', tokenLimit: 8000,  colorVar: '--accent-qa',     desc: '장문 전략 문서 · 종합 캠페인 플랜' },
  { value: 'director',   label: '부장',     icon: '🏆', tokenLimit: null,  colorVar: '--accent-pipe',   desc: '제한 없음 · 최대 품질 · 고비용' },
];

/* ─── 에이전시 유형 목록 ─── */
const AGENCY_OPTIONS = [
  {
    file:    'agents.json',
    label:   '기본 파이프라인',
    icon:    '⚡',
    desc:    '전략가·카피라이터·아트디렉터·콘텐츠 플래너',
    color:   'var(--accent-pipe)',
    glow:    'rgba(225, 29, 72, 0.08)',
  },
  {
    file:    'marketing-agents.json',
    label:   '마케팅회사',
    icon:    '🎯',
    desc:    'STRATEGIST · COPYWRITER · MEDIA PLANNER · ANALYST',
    color:   'var(--accent-pm)',
    glow:    'var(--glow-pm)',
  },
  {
    file:    'design-agents.json',
    label:   '디자인 에이전시',
    icon:    '🎨',
    desc:    'CREATIVE DIR · BRAND DESIGNER · UX · UI · MOTION',
    color:   'var(--accent-design)',
    glow:    'var(--glow-design)',
  },
  {
    file:    'dev-agents.json',
    label:   'SI 에이전시',
    icon:    '🏗',
    desc:    'PM · UI DESIGNER · BACKEND DEV · FRONTEND DEV · QA',
    color:   'var(--accent-dev)',
    glow:    'var(--glow-dev)',
  },
];

/* ─── URL 파라미터에서 에이전시 파일명 읽기 (없으면 Store에서) ─── */
const URL_PARAMS  = new URLSearchParams(window.location.search);
let   AGENTS_FILE = URL_PARAMS.get('agents') || Store.get().selectedAgency || 'agents.json';

/* 에이전시 유형별 메타 정보 (제목·서브타이틀·돌아가기 링크) */
const AGENCY_META = {
  'agents.json':           {
    title:    '마케팅 파이프라인',
    subtitle: '전략가·카피라이터·아트디렉터·콘텐츠 플래너의 AI 모델과 직급을 조정합니다',
    back:     '../index.html',
    backLabel: '← 파이프라인',
  },
  'marketing-agents.json': {
    title:    '마케팅회사',
    subtitle: 'STRATEGIST·COPYWRITER·MEDIA PLANNER·ANALYST의 AI 모델과 직급을 조정합니다',
    back:     './marketing-agency.html',
    backLabel: '← 마케팅회사',
  },
  'design-agents.json':    {
    title:    '디자인 에이전시',
    subtitle: 'CREATIVE DIR·BRAND DESIGNER·UX·UI DESIGNER·MOTION DESIGNER의 AI 모델과 직급을 조정합니다',
    back:     './design-agency.html',
    backLabel: '← 디자인 에이전시',
  },
  'dev-agents.json':       {
    title:    'SI 에이전시',
    subtitle: 'PM·UI DESIGNER·BACKEND DEV·FRONTEND DEV·QA ENGINEER의 AI 모델과 직급을 조정합니다',
    back:     './dev-agency.html',
    backLabel: '← SI 에이전시',
  },
};

/* ─── 초기화 ─── */
const init = async () => {
  try {
    await loadAgency(AGENTS_FILE);

    const agentParam = URL_PARAMS.get('agent');
    if (agentParam) selectAgent(agentParam);
    else renderEmptyPanel();
  } catch (e) {
    console.error('에이전트 데이터 로드 실패:', e);
  }
};

/** 에이전시 파일 로드 + 전체 렌더링 (에이전시 전환 시에도 재사용) */
const loadAgency = async (file) => {
  const data = await fetchJSON(`../data/${file}`);
  agentsData  = data.agents;
  AGENTS_FILE = file;

  /* Store에 선택된 에이전시 저장 → 모든 페이지가 참조 */
  Store.set({ selectedAgency: file });

  renderAgencySelector();
  updatePageHeader();
  renderAgentList();
  renderEmptyPanel();
  selectedAgentId = null;
};

/** 에이전시 유형 선택 카드 렌더링 */
const renderAgencySelector = () => {
  const container = document.getElementById('agency-selector');
  if (!container) return;

  const cardsHTML = AGENCY_OPTIONS.map(opt => {
    const isActive = opt.file === AGENTS_FILE;
    return `
      <button
        class="agency-select-card${isActive ? ' active' : ''}"
        data-file="${opt.file}"
        style="
          --agency-color: ${opt.color};
          --agency-glow: ${opt.glow};
          border-color: ${isActive ? opt.color : 'var(--border)'};
          background: ${isActive ? opt.glow : 'var(--surface)'};
        "
        aria-label="${opt.label} 선택"
        aria-pressed="${isActive}"
      >
        <span class="agency-card-icon">${opt.icon}</span>
        <div class="agency-card-body">
          <div class="agency-card-label" style="color:${isActive ? opt.color : 'var(--text)'}">
            ${opt.label}
          </div>
          <div class="agency-card-desc">${opt.desc}</div>
        </div>
        ${isActive ? '<span class="agency-card-check">✓</span>' : ''}
      </button>
    `;
  }).join('');

  container.innerHTML = `
    <div class="agency-selector-wrap">
      <div class="agency-selector-label">에이전시 유형 선택</div>
      <div class="agency-selector-grid">${cardsHTML}</div>
    </div>
  `;

  /* 클릭 → 해당 에이전시 로드 */
  container.querySelectorAll('.agency-select-card').forEach(card => {
    card.addEventListener('click', () => {
      if (card.dataset.file !== AGENTS_FILE) loadAgency(card.dataset.file);
    });
  });
};

/** 에이전시 유형에 따라 페이지 제목·서브타이틀·돌아가기 링크 갱신 */
const updatePageHeader = () => {
  const meta = AGENCY_META[AGENTS_FILE] || AGENCY_META['agents.json'];

  const titleEl    = document.querySelector('.page-title span');
  const subtitleEl = document.querySelector('.page-subtitle');
  const backBtn    = document.querySelector('.header-actions .btn-ghost');

  if (titleEl)    titleEl.textContent      = meta.title;
  if (subtitleEl) subtitleEl.textContent   = meta.subtitle;
  if (backBtn) {
    backBtn.href        = meta.back;
    backBtn.textContent = meta.backLabel;
  }
};

/** JSON fetch 헬퍼 */
const fetchJSON = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch 실패: ${url}`);
  return res.json();
};

/* ─── 모델 값에서 provider 자동 감지 ─── */
const detectProvider = (modelValue) => {
  if (!modelValue) return 'anthropic';
  if (modelValue.startsWith('claude'))  return 'anthropic';
  if (modelValue.startsWith('gpt') || modelValue.startsWith('o1') || modelValue.startsWith('o3')) return 'openai';
  return 'anthropic';
};

/* ─── 저장된 API 키로 허용 프로바이더 배열 반환 ─── */
/* null = 제한 없음 (키 미입력), string[] = 키가 있는 프로바이더만 허용 */
const getAllowedProviders = () => {
  const apiKeys = Store.get().apiKeys || {};
  const allowed = [];
  if (apiKeys.claude) allowed.push('anthropic');
  if (apiKeys.openai) allowed.push('openai');
  if (apiKeys.custom) allowed.push('custom');
  return allowed.length > 0 ? allowed : null; // null = 모두 허용
};

/* ─── Provider 툴팁 HTML 생성 ─── */
const buildProviderTooltip = () => {
  const rows = Object.values(PROVIDER_MODELS).map(p => `
    <div class="tt-provider">
      <div class="tt-provider-name">${p.icon} ${p.label}</div>
      ${p.models.map(m => `
        <div class="tt-model-row">
          <span class="tt-model-label">${m.label}</span>
          <span class="tt-model-desc">${m.desc}</span>
        </div>
      `).join('')}
    </div>
  `).join('');
  return `<div class="tt-header">AI Provider 안내</div>${rows}`;
};

/* ─── 직급 툴팁 HTML 생성 ─── */
const buildRankTooltip = () => {
  const rows = RANK_OPTIONS.map(r => {
    const limitText = r.tokenLimit ? `${r.tokenLimit.toLocaleString()} 토큰` : '무제한';
    return `
      <div class="tt-model-row">
        <span class="tt-model-label">${r.icon} ${r.label}</span>
        <span class="tt-model-desc">${limitText}</span>
      </div>
      <div class="tt-rank-desc">${r.desc}</div>
    `;
  }).join('');
  return `
    <div class="tt-header">직급 & 토큰 할당</div>
    <div class="tt-rank-intro">토큰은 AI가 한 번에 생성할 수 있는 텍스트 양입니다. 직급이 높을수록 더 긴 결과물을 생성하지만 API 비용이 증가합니다.</div>
    ${rows}
  `;
};

/* ─── 직급 라벨 → value 변환 ─── */
const rankLabelToValue = (label) => {
  const found = RANK_OPTIONS.find(r => r.label === label);
  return found ? found.value : 'junior';
};

/* ─── 에이전트 목록 렌더링 ─── */
const renderAgentList = () => {
  const container = document.getElementById('agent-list');
  if (!container) return;

  const state = Store.get();

  const listHTML = agentsData.map(agent => {
    const override = state.agentOverrides[agent.id] || {};
    const modelName = override.model || agent.model;
    const provider = PROVIDER_MODELS[override.provider || detectProvider(modelName)];
    const rankValue = override.rank || rankLabelToValue(agent.rank);
    const rankOption = RANK_OPTIONS.find(r => r.value === rankValue) || RANK_OPTIONS[1];
    const tokenText = rankOption.tokenLimit ? `${rankOption.tokenLimit.toLocaleString()} 토큰 제한` : '무제한';
    const isSelected = agent.id === selectedAgentId;

    return `
      <div class="agent-setting-card ${agent.colorClass}${isSelected ? ' selected' : ''}"
           data-agent="${agent.id}" role="button" tabindex="0" aria-label="${agent.name} 에이전트 설정">
        <div class="setting-card-icon" style="background:var(${agent.glowVar})">${agent.icon}</div>
        <div class="setting-card-info">
          <div class="setting-card-name">
            <span style="color:var(${agent.accentVar})">${agent.name}</span>
            <span class="rank-badge" style="background:var(${agent.glowVar});color:var(${agent.accentVar})">
              ${rankOption.icon} ${rankOption.label}
            </span>
          </div>
          <div class="setting-card-desc">${agent.desc}</div>
        </div>
        <div class="setting-card-meta">
          <div class="setting-card-model">${provider?.icon || ''} ${modelName}</div>
          <div class="setting-card-multiplier" style="color:var(${rankOption.colorVar})">${tokenText}</div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = listHTML;

  container.querySelectorAll('.agent-setting-card').forEach(card => {
    card.addEventListener('click', () => selectAgent(card.dataset.agent));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') selectAgent(card.dataset.agent);
    });
  });
};

/** 에이전트 선택 → 편집 패널 열기 */
const selectAgent = (agentId) => {
  selectedAgentId = agentId;
  renderAgentList();
  renderEditPanel(agentId);
};

/* ─── 편집 패널 렌더링 ─── */
const renderEditPanel = (agentId) => {
  const panel = document.getElementById('edit-panel');
  if (!panel) return;

  const agent = agentsData.find(a => a.id === agentId);
  if (!agent) return;

  const state = Store.get();
  const override = state.agentOverrides[agentId] || {};

  /* 현재 값 결정 */
  const currentModel    = override.model      || agent.model;
  const currentRank     = override.rank       || rankLabelToValue(agent.rank);

  /* 저장된 API 키로 허용 프로바이더 결정 → 없으면 오버라이드/모델값 사용 */
  const allowedProviders  = getAllowedProviders();
  const effectiveProvider = override.provider || detectProvider(currentModel);

  /* Provider 옵션 HTML — 키가 있으면 해당 프로바이더만 표시, 없으면 전체 표시 */
  const providerOptionsHTML = Object.entries(PROVIDER_MODELS)
    .filter(([key]) => !allowedProviders || allowedProviders.includes(key))
    .map(([key, p]) => `
      <option value="${key}"${effectiveProvider === key ? ' selected' : ''}>${p.icon} ${p.label}</option>
    `).join('');

  /* 유효 프로바이더의 Model 옵션만 표시 */
  const modelOptionsHTML = buildModelOptions(effectiveProvider, currentModel);

  /* 직급 옵션 HTML */
  const rankOptionsHTML = RANK_OPTIONS.map(r => `
    <option value="${r.value}"${currentRank === r.value ? ' selected' : ''}>
      ${r.icon} ${r.label}${r.tokenLimit ? ` — ${r.tokenLimit.toLocaleString()} 토큰` : ' — 무제한'}
    </option>
  `).join('');

  /* 현재 직급의 토큰 제한 */
  const rankOption = RANK_OPTIONS.find(r => r.value === currentRank) || RANK_OPTIONS[1];

  panel.innerHTML = `
    <div class="edit-panel-header">
      <div>
        <div class="edit-panel-title">${agent.icon} ${agent.name} 설정</div>
        <div class="edit-panel-agent-label">${agent.desc}</div>
      </div>
      <button class="btn btn-ghost btn-sm" id="close-panel-btn" aria-label="패널 닫기">✕</button>
    </div>
    <div class="edit-panel-body">

      <!-- ① Provider -->
      <div class="panel-section">
        <div class="panel-section-title">AI 설정</div>

        <div class="form-group">
          <div class="form-label-row">
            <label class="form-label" for="provider-select">Provider</label>
            <span class="tooltip-wrap" aria-label="Provider 안내">
              <span class="tooltip-icon" tabindex="0">?</span>
              <div class="tooltip-popup" role="tooltip">${buildProviderTooltip()}</div>
            </span>
          </div>
          <select class="form-select" id="provider-select" aria-label="AI 제공자 선택">
            ${providerOptionsHTML}
          </select>
        </div>

        <!-- ② Model (Provider 변경 시 동적 갱신) -->
        <div class="form-group">
          <label class="form-label" for="model-select">Model</label>
          <select class="form-select" id="model-select" aria-label="모델 선택">
            ${modelOptionsHTML}
          </select>
          <div class="form-hint" id="model-hint">${getModelHint(effectiveProvider, currentModel)}</div>
        </div>
      </div>

      <!-- API 키 미입력 안내 -->
      <div class="no-api-key-notice" id="no-api-key-notice" style="display:none" role="alert">
        <span class="no-api-key-notice-icon">⚠</span>
        <span>API 키를 저장해야 온전한 아웃풋 파일을 사용하실 수 있습니다.</span>
        <a href="../index.html" class="no-api-key-notice-link">키 저장하러 가기 →</a>
      </div>

      <!-- ③ 직급 -->
      <div class="panel-section">
        <div class="panel-section-title">직급 & 토큰 제한</div>

        <div class="form-group">
          <div class="form-label-row">
            <label class="form-label" for="rank-select">직급</label>
            <span class="tooltip-wrap" aria-label="직급 안내">
              <span class="tooltip-icon" tabindex="0">?</span>
              <div class="tooltip-popup" role="tooltip">${buildRankTooltip()}</div>
            </span>
          </div>
          <select class="form-select" id="rank-select" aria-label="직급 선택">
            ${rankOptionsHTML}
          </select>
        </div>

        <!-- 토큰 제한 뱃지 -->
        <div class="rank-token-display" id="rank-token-display">
          ${buildRankTokenDisplay(rankOption)}
        </div>
      </div>

      <!-- 저장 버튼 -->
      <button class="save-btn" id="save-agent-btn" data-agent="${agentId}">
        저장하기
      </button>

    </div>
  `;

  /* ─── 이벤트 바인딩 ─── */

  /* API 키 미입력 안내 표시 헬퍼 */
  const showApiKeyNoticeIfNeeded = () => {
    const notice = panel.querySelector('#no-api-key-notice');
    if (!notice) return;
    const apiKeys = Store.get().apiKeys || {};
    const hasAnyKey = !!(apiKeys.claude || apiKeys.openai || apiKeys.custom);
    notice.style.display = hasAnyKey ? 'none' : 'flex';
  };

  /* Provider 변경 → Model 옵션 동적 갱신 + API 키 안내 */
  panel.querySelector('#provider-select').addEventListener('change', (e) => {
    const newProvider = e.target.value;
    const modelSelect = panel.querySelector('#model-select');
    const modelHint = panel.querySelector('#model-hint');
    modelSelect.innerHTML = buildModelOptions(newProvider, null);
    modelHint.textContent = getModelHint(newProvider, modelSelect.value);
    showApiKeyNoticeIfNeeded();
  });

  /* Model 변경 → 힌트 갱신 + API 키 안내 */
  panel.querySelector('#model-select').addEventListener('change', (e) => {
    const provider = panel.querySelector('#provider-select').value;
    panel.querySelector('#model-hint').textContent = getModelHint(provider, e.target.value);
    showApiKeyNoticeIfNeeded();
  });

  /* 직급 변경 → 토큰 제한 뱃지 갱신 */
  panel.querySelector('#rank-select').addEventListener('change', (e) => {
    const selectedRank = RANK_OPTIONS.find(r => r.value === e.target.value);
    const display = panel.querySelector('#rank-token-display');
    if (selectedRank && display) display.innerHTML = buildRankTokenDisplay(selectedRank);
  });

  /* 저장 */
  panel.querySelector('#save-agent-btn').addEventListener('click', () => saveAgent(agentId));

  /* 닫기 */
  panel.querySelector('#close-panel-btn').addEventListener('click', () => {
    selectedAgentId = null;
    renderAgentList();
    renderEmptyPanel();
  });
};

/** Provider에 따른 Model 옵션 HTML 생성 */
const buildModelOptions = (providerKey, selectedModel) => {
  const provider = PROVIDER_MODELS[providerKey];
  if (!provider) return '';
  return provider.models.map(m => `
    <option value="${m.value}"${selectedModel === m.value ? ' selected' : ''}>${m.label} — ${m.desc}</option>
  `).join('');
};

/** 모델 힌트 텍스트 반환 */
const getModelHint = (providerKey, modelValue) => {
  const provider = PROVIDER_MODELS[providerKey];
  if (!provider) return '';
  const model = provider.models.find(m => m.value === modelValue);
  return model ? `${provider.icon} ${provider.label} · ${model.desc}` : '';
};

/** 직급 토큰 제한 뱃지 HTML */
const buildRankTokenDisplay = (rankOption) => {
  const limitText = rankOption.tokenLimit
    ? `최대 ${rankOption.tokenLimit.toLocaleString()} 토큰`
    : '토큰 무제한';
  const barPct = rankOption.tokenLimit
    ? Math.min(100, Math.round((rankOption.tokenLimit / 8000) * 100))
    : 100;
  const fillColor = rankOption.colorVar;

  return `
    <div class="rank-token-card">
      <div class="rank-token-top">
        <span class="rank-token-icon">${rankOption.icon}</span>
        <span class="rank-token-label">${rankOption.label}</span>
        <span class="rank-token-limit" style="color:var(${fillColor})">${limitText}</span>
      </div>
      <div class="rank-token-bar">
        <div class="rank-token-fill" style="width:${barPct}%;background:var(${fillColor})"></div>
      </div>
    </div>
  `;
};

/** 토큰 추정: 글자 수 ÷ 4 */
const estimateTokens = (text) => Math.ceil((text || '').length / 4);

/** 빈 패널 표시 */
const renderEmptyPanel = () => {
  const panel = document.getElementById('edit-panel');
  if (!panel) return;
  panel.innerHTML = `
    <div class="empty-panel">
      <div class="empty-panel-icon">⚙️</div>
      <div class="empty-panel-text">에이전트를 선택하면<br>설정을 변경할 수 있습니다</div>
    </div>
  `;
};

/* ─── 에이전트 설정 저장 ─── */
const saveAgent = (agentId) => {
  const providerSelect = document.getElementById('provider-select');
  const modelSelect    = document.getElementById('model-select');
  const rankSelect     = document.getElementById('rank-select');
  if (!providerSelect || !modelSelect || !rankSelect) return;

  Store.setAgentOverride(agentId, {
    provider:     providerSelect.value,
    model:        modelSelect.value,
    rank:         rankSelect.value,
  });

  renderAgentList();
  showToast(`${agentsData.find(a => a.id === agentId)?.name} 설정이 저장되었습니다`);
};

/** 토스트 메시지 */
const showToast = (message) => {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = `✓ ${message}`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
};

/* ─── 전역 툴팁 오버레이 (overflow 클리핑 우회) ─── */
const initGlobalTooltip = () => {
  const overlay = document.createElement('div');
  overlay.id = 'tt-overlay';
  document.body.appendChild(overlay);

  /* 패널이 렌더링될 때마다 .tooltip-icon에 이벤트 위임 */
  document.addEventListener('mouseenter', (e) => {
    const icon = e.target.closest('.tooltip-icon');
    if (!icon) return;
    const popup = icon.parentElement?.querySelector('.tooltip-popup');
    if (!popup) return;

    overlay.innerHTML = popup.innerHTML;

    const rect = icon.getBoundingClientRect();
    const overlayW = 260;
    const gap = 8;

    /* 기본: 아이콘 아래 오른쪽 정렬 */
    let top  = rect.bottom + gap;
    let left = rect.right - overlayW;

    /* 뷰포트 하단 벗어나면 위로 */
    if (top + 300 > window.innerHeight) top = rect.top - gap - 300;
    /* 뷰포트 왼쪽 벗어나면 보정 */
    if (left < 8) left = 8;

    overlay.style.top  = `${top}px`;
    overlay.style.left = `${left}px`;
    overlay.classList.add('visible');
  }, true);

  document.addEventListener('mouseleave', (e) => {
    if (e.target.closest('.tooltip-icon')) {
      overlay.classList.remove('visible');
    }
  }, true);

  /* 포커스 접근성 */
  document.addEventListener('focusin', (e) => {
    const icon = e.target.closest('.tooltip-icon');
    if (!icon) return;
    icon.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
  });
  document.addEventListener('focusout', (e) => {
    if (e.target.closest('.tooltip-icon')) overlay.classList.remove('visible');
  });
};

document.addEventListener('DOMContentLoaded', () => {
  init();
  initGlobalTooltip();
});
