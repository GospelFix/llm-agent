/* ========================================
   Pipeline Editor JS — 파이프라인 편집기 로직
   크로스 에이전시 혼합 구성 + 드래그 정렬
   ======================================== */

'use strict';

/* ─── 상태 ─── */
let agentsPool = [];     // 전체 에이전시 에이전트 병합 풀
let currentSteps = [];   // 편집 중인 스텝 배열
let dragSrcIdx = -1;     // 드래그 중인 스텝 인덱스

/* ─── 경로 ─── */
const IS_SUB = window.location.pathname.includes('/pages/');
const DATA_ROOT = IS_SUB ? '../data/' : './data/';

/* ─── 로드할 에이전시 목록 ─── */
const AGENCY_SOURCES = [
  { file: 'agents.json',           label: '기본 파이프라인', icon: '⚡' },
  { file: 'marketing-agents.json', label: '마케팅회사',      icon: '🎯' },
  { file: 'design-agents.json',    label: '디자인 에이전시', icon: '🎨' },
  { file: 'dev-agents.json',       label: 'SI 에이전시',    icon: '🏗' },
];

/* ─── 모델 목록 ─── */
const ALL_MODELS = [
  { value: 'claude-haiku-4-5',  label: 'Claude Haiku 4.5' },
  { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
  { value: 'claude-opus-4-6',   label: 'Claude Opus 4.6' },
  { value: 'gpt-4o',            label: 'GPT-4o' },
  { value: 'gpt-4o-mini',       label: 'GPT-4o Mini' },
  { value: 'o1-mini',           label: 'O1 Mini' },
  { value: 'custom',            label: '커스텀 (직접 입력)' },
];

/* ─── 직급 목록 ─── */
const RANK_LIST = [
  { value: '인턴',     icon: '🔰' },
  { value: '신입사원', icon: '🌱' },
  { value: '대리',     icon: '🖥' },
  { value: '과장',     icon: '⭐' },
  { value: '팀장',     icon: '👑' },
  { value: '부장',     icon: '🏆' },
];

/* ─── JSON fetch 헬퍼 ─── */
const fetchJSON = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch 실패: ${url}`);
  return res.json();
};

/* ─── 전체 에이전시 에이전트 풀 로드 ─── */
const loadAgentsPool = async () => {
  /* 4개 에이전시 병렬 로드 */
  const results = await Promise.allSettled(
    AGENCY_SOURCES.map(src =>
      fetchJSON(`${DATA_ROOT}${src.file}`)
        .then(d => (d.agents || []).map(agent => ({
          ...agent,
          _agencyFile:  src.file,
          _agencyLabel: src.label,
          _agencyIcon:  src.icon,
          /* 에이전시+ID 조합으로 풀 내 고유 키 생성 (동명 ID 충돌 방지) */
          _poolKey: `${src.file}::${agent.id}`,
        })))
    )
  );

  /* 성공한 에이전시만 병합 */
  agentsPool = results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value);
};

/* ─── 현재 파이프라인 로드 ─── */
const loadCurrentPipeline = async () => {
  const stored = Store.get();
  const custom = stored.customPipeline;

  if (custom?.steps?.length) {
    /* 저장된 커스텀 에이전트 복원: agentData가 step에 임베드되어 있으면 그대로 사용 */
    currentSteps = custom.steps
      .slice()
      .sort((a, b) => a.order - b.order)
      .map(step => {
        /* agentData가 임베드된 경우 (크로스 에이전시 지원) */
        const base = step.agentData || agentsPool.find(a => a.id === step.agentId) || {};
        return {
          agentId:          step.agentId,
          _agencyFile:      step._agencyFile  || base._agencyFile  || '',
          _agencyLabel:     step._agencyLabel || base._agencyLabel || '',
          _agencyIcon:      step._agencyIcon  || base._agencyIcon  || '',
          name:             base.name         || step.agentId,
          icon:             base.icon         || '🤖',
          model:            step.model        || base.model        || 'claude-haiku-4-5',
          rank:             step.rank         || base.rank         || '팀장',
          outputFile:       step.outputFile   || base.outputFile   || step.agentId,
          inputContext:     step.inputContext || [],
          stepCustomModelId: step.stepCustomModelId || '',
          agentData:        base,
        };
      });

    /* 파이프라인 이름 복원 */
    const nameInput = document.getElementById('pipeline-name-input');
    if (nameInput) nameInput.value = custom.name || '';
  } else {
    /* 커스텀 없으면 빈 스텝으로 시작 (에이전시 종속 해제) */
    currentSteps = [];
  }
};

/* ─── 스텝 목록 렌더링 ─── */
const renderStepList = () => {
  const container = document.getElementById('step-list');
  if (!container) return;

  if (currentSteps.length === 0) {
    container.innerHTML = `
      <div class="step-empty" role="status">
        아직 스텝이 없습니다. <strong>+ 에이전트 추가</strong> 버튼으로 시작하세요.
      </div>
    `;
    return;
  }

  container.innerHTML = currentSteps.map((step, idx) => buildStepHTML(step, idx)).join('');

  /* 드래그 앤 드롭 초기화 */
  initDragDrop();

  /* 각 스텝 이벤트 바인딩 */
  currentSteps.forEach((_, idx) => {
    /* 모델 셀렉터 변경 (custom 전환 시 모델명 입력 필드 표시를 위해 리렌더링) */
    document.getElementById(`step-model-${idx}`)?.addEventListener('change', (e) => {
      currentSteps[idx].model = e.target.value;
      renderStepList(); // custom ↔ 일반 전환 시 커스텀 필드 표시 상태 갱신
    });

    /* 커스텀 모델명 입력 */
    document.getElementById(`step-custom-model-${idx}`)?.addEventListener('input', (e) => {
      currentSteps[idx].stepCustomModelId = e.target.value;
    });

    /* 직급 셀렉터 변경 */
    document.getElementById(`step-rank-${idx}`)?.addEventListener('change', (e) => {
      currentSteps[idx].rank = e.target.value;
    });

    /* 출력 키 입력 변경 */
    document.getElementById(`step-output-${idx}`)?.addEventListener('input', (e) => {
      const oldKey = currentSteps[idx].outputFile;
      const newKey = e.target.value.replace(/\s+/g, '_');
      currentSteps[idx].outputFile = newKey;

      /* 이후 스텝들의 inputContext에서 구키 → 신키 교체 */
      for (let j = idx + 1; j < currentSteps.length; j++) {
        const ctxIdx = currentSteps[j].inputContext.indexOf(oldKey);
        if (ctxIdx !== -1) currentSteps[j].inputContext[ctxIdx] = newKey;
      }
    });

    /* 컨텍스트 체크박스 변경 */
    container.querySelectorAll(`.ctx-checkbox[data-step="${idx}"]`).forEach(cb => {
      cb.addEventListener('change', () => {
        currentSteps[idx].inputContext = Array.from(
          container.querySelectorAll(`.ctx-checkbox[data-step="${idx}"]:checked`)
        ).map(el => el.value);
      });
    });

    /* 삭제 버튼 */
    document.getElementById(`step-remove-${idx}`)?.addEventListener('click', () => {
      removeStep(idx);
    });
  });
};

/* ─── 단일 스텝 카드 HTML 생성 ─── */
const buildStepHTML = (step, idx) => {
  /* 모델 셀렉터 옵션 */
  const modelOptions = ALL_MODELS.map(m =>
    `<option value="${m.value}" ${m.value === step.model ? 'selected' : ''}>${m.label}</option>`
  ).join('');

  /* 직급 셀렉터 옵션 */
  const rankOptions = RANK_LIST.map(r =>
    `<option value="${r.value}" ${r.value === step.rank ? 'selected' : ''}>${r.icon} ${r.value}</option>`
  ).join('');

  /* 커스텀 모델명 입력 필드 (model === 'custom'일 때만 표시) */
  const customModelInput = step.model === 'custom'
    ? `<input type="text" id="step-custom-model-${idx}" class="step-select brand-input"
              style="width:140px" value="${step.stepCustomModelId || ''}"
              placeholder="llama-3.1-70b" aria-label="커스텀 모델명" />`
    : '';

  /* 에이전시 출처 뱃지 */
  const agencyBadge = step._agencyLabel
    ? `<span class="step-agency-badge">${step._agencyIcon || ''} ${step._agencyLabel}</span>`
    : '';

  /* 컨텍스트 체크박스: 이전 스텝들의 outputFile 목록 */
  const prevOutputs = currentSteps.slice(0, idx).map(s => s.outputFile).filter(Boolean);
  const contextHTML = prevOutputs.length === 0
    ? '<span class="ctx-empty">(첫 번째 스텝 — 이전 출력 없음)</span>'
    : prevOutputs.map(key =>
        `<label class="ctx-checkbox-label">
           <input type="checkbox" class="ctx-checkbox" data-step="${idx}" value="${key}"
             ${(step.inputContext || []).includes(key) ? 'checked' : ''} />
           <code>${key}</code>
         </label>`
      ).join('');

  /* 스텝 간 화살표 (마지막 스텝 제외) */
  const arrowHTML = idx < currentSteps.length - 1
    ? '<div class="step-connector-arrow" aria-hidden="true">↓</div>'
    : '';

  return `
    <div class="step-item"
         draggable="true"
         data-idx="${idx}"
         role="listitem"
         aria-label="스텝 ${idx + 1}: ${step.name}">

      <!-- 드래그 핸들 + 스텝 번호 + 에이전트 이름 -->
      <div class="step-header">
        <span class="drag-handle" title="드래그하여 순서 변경" aria-hidden="true">≡</span>
        <span class="step-number">STEP ${idx + 1}</span>

        <!-- 에이전트 이름 (고정 표시 — 변경하려면 삭제 후 재추가) -->
        <span class="step-agent-name">
          <span class="step-agent-icon">${step.icon || '🤖'}</span>
          ${step.name}
        </span>
        ${agencyBadge}

        <!-- 모델 셀렉터 -->
        <select id="step-model-${idx}" class="step-select step-model-select"
                aria-label="모델 선택">
          ${modelOptions}
        </select>
        ${customModelInput}

        <!-- 직급 셀렉터 -->
        <select id="step-rank-${idx}" class="step-select step-rank-select"
                aria-label="직급 선택">
          ${rankOptions}
        </select>

        <!-- 삭제 버튼 -->
        <button id="step-remove-${idx}" class="step-remove-btn"
                aria-label="스텝 ${idx + 1} 삭제">× 삭제</button>
      </div>

      <!-- 출력 키 + 컨텍스트 -->
      <div class="step-body">
        <div class="step-field">
          <span class="step-field-label">출력 키</span>
          <input type="text" id="step-output-${idx}" class="step-output-input brand-input"
                 value="${step.outputFile || ''}"
                 placeholder="예) brand_strategy"
                 aria-label="출력 파일 키" />
        </div>
        <div class="step-field">
          <span class="step-field-label">컨텍스트</span>
          <div class="context-checkboxes">${contextHTML}</div>
        </div>
      </div>
    </div>
    ${arrowHTML}
  `;
};

/* ─── HTML5 Drag & Drop 초기화 ─── */
const initDragDrop = () => {
  const items = document.querySelectorAll('.step-item[draggable="true"]');

  items.forEach(item => {
    item.addEventListener('dragstart', (e) => {
      dragSrcIdx = parseInt(item.dataset.idx, 10);
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      document.querySelectorAll('.step-item').forEach(el => el.classList.remove('drag-over'));
    });

    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      document.querySelectorAll('.step-item').forEach(el => el.classList.remove('drag-over'));
      item.classList.add('drag-over');
    });

    item.addEventListener('dragleave', () => {
      item.classList.remove('drag-over');
    });

    item.addEventListener('drop', (e) => {
      e.preventDefault();
      item.classList.remove('drag-over');
      const dropIdx = parseInt(item.dataset.idx, 10);
      if (dragSrcIdx === -1 || dragSrcIdx === dropIdx) return;

      const moved = currentSteps.splice(dragSrcIdx, 1)[0];
      currentSteps.splice(dropIdx, 0, moved);
      updateAllContextValidity();
      dragSrcIdx = -1;
      renderStepList();
    });
  });
};

/* ─── 스텝 순서 변경 후 inputContext 유효성 재검사 ─── */
const updateAllContextValidity = () => {
  currentSteps.forEach((step, idx) => {
    const availableKeys = new Set(
      currentSteps.slice(0, idx).map(s => s.outputFile).filter(Boolean)
    );
    step.inputContext = (step.inputContext || []).filter(k => availableKeys.has(k));
  });
};

/* ─── 스텝 추가 (전체 에이전트 데이터 임베드) ─── */
const addStep = (agent) => {
  currentSteps.push({
    agentId:          agent.id,
    _agencyFile:      agent._agencyFile  || '',
    _agencyLabel:     agent._agencyLabel || '',
    _agencyIcon:      agent._agencyIcon  || '',
    name:             agent.name,
    icon:             agent.icon || '🤖',
    model:            agent.model || 'claude-haiku-4-5',
    rank:             agent.rank  || '팀장',
    outputFile:       `${agent.outputFile || agent.id}_${currentSteps.length + 1}`,
    inputContext:     [],
    stepCustomModelId: '',  // 커스텀 모델명 (model === 'custom'일 때 사용)
    agentData:        agent,   // 크로스 에이전시 식별을 위해 전체 데이터 임베드
  });
  closeModal();
  renderStepList();
};

/* ─── 스텝 삭제 ─── */
const removeStep = (idx) => {
  const removedKey = currentSteps[idx].outputFile;
  currentSteps.splice(idx, 1);

  currentSteps.forEach(step => {
    step.inputContext = (step.inputContext || []).filter(k => k !== removedKey);
  });

  renderStepList();
};

/* ─── 에이전트 풀 모달 (에이전시별 그룹핑) ─── */
const openModal = () => {
  const modal = document.getElementById('add-agent-modal');
  const poolList = document.getElementById('agent-pool-list');
  if (!modal || !poolList) return;

  /* 에이전시별로 그룹핑 */
  const groups = AGENCY_SOURCES.map(src => ({
    ...src,
    agents: agentsPool.filter(a => a._agencyFile === src.file),
  })).filter(g => g.agents.length > 0);

  poolList.innerHTML = groups.map(group => `
    <div class="agent-pool-group">
      <div class="agent-pool-group-label">${group.icon} ${group.label}</div>
      ${group.agents.map(agent => `
        <button class="agent-pool-item" data-poolkey="${agent._poolKey}"
                aria-label="${agent.name} 추가">
          <span class="agent-pool-icon">${agent.icon || '🤖'}</span>
          <div class="agent-pool-info">
            <div class="agent-pool-name">${agent.name}</div>
            <div class="agent-pool-desc">${agent.desc || ''}</div>
          </div>
        </button>
      `).join('')}
    </div>
  `).join('');

  poolList.querySelectorAll('.agent-pool-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const agent = agentsPool.find(a => a._poolKey === btn.dataset.poolkey);
      if (agent) addStep(agent);
    });
  });

  modal.style.display = 'flex';
};

const closeModal = () => {
  const modal = document.getElementById('add-agent-modal');
  if (modal) modal.style.display = 'none';
};

/* ─── 파이프라인 저장 ─── */
const savePipeline = () => {
  const name = (document.getElementById('pipeline-name-input')?.value || '').trim()
    || '커스텀 에이전트';

  const steps = currentSteps.map((step, idx) => ({
    agentId:          step.agentId,
    order:            idx,
    model:            step.model,
    rank:             step.rank,
    outputFile:       step.outputFile,
    inputContext:     step.inputContext || [],
    stepCustomModelId: step.stepCustomModelId || '',
    _agencyFile:      step._agencyFile,
    _agencyLabel:     step._agencyLabel,
    _agencyIcon:      step._agencyIcon,
    agentData:        step.agentData,  // 전체 에이전트 데이터 임베드 (pipeline.js에서 직접 사용)
  }));

  Store.set({
    customPipeline: {
      id:    `cp-${Date.now()}`,
      name,
      steps,
    },
  });

  showToast('✅ 커스텀 에이전트이 저장되었습니다!');
};

/* ─── 파이프라인 초기화 ─── */
const resetPipeline = () => {
  if (!confirm('커스텀 에이전트을 초기화할까요?')) return;

  Store.set({ customPipeline: null });
  currentSteps = [];

  const nameInput = document.getElementById('pipeline-name-input');
  if (nameInput) nameInput.value = '';

  renderStepList();
  showToast('🔄 파이프라인이 초기화되었습니다. 새로 구성하거나 파이프라인 페이지에서 기본 에이전시를 사용하세요.');
};

/* ─── 토스트 알림 ─── */
const showToast = (msg) => {
  document.getElementById('editor-toast')?.remove();

  const toast = document.createElement('div');
  toast.id = 'editor-toast';
  toast.className = 'editor-toast';
  toast.textContent = msg;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add('fade-out'), 2500);
  setTimeout(() => toast.remove(), 3000);
};

/* ─── DOM 준비 시 초기화 ─── */
document.addEventListener('DOMContentLoaded', async () => {
  await loadAgentsPool();
  await loadCurrentPipeline();
  renderStepList();

  document.getElementById('add-step-btn')?.addEventListener('click', openModal);
  document.getElementById('modal-close-btn')?.addEventListener('click', closeModal);
  document.getElementById('add-agent-modal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  document.getElementById('save-btn')?.addEventListener('click', savePipeline);
  document.getElementById('reset-btn')?.addEventListener('click', resetPipeline);
});
