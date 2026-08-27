import { ironData, syncData } from './firebase.js';

let chartInstance = null;
let currentMetricId = 'ferritin';

export function renderLabView() {
  const metrics = ironData.metrics || [];
  if (metrics.length > 0 && !metrics.some(m => m.id === currentMetricId)) {
    currentMetricId = metrics[0].id;
  }

  renderMetricTabs();
  renderLabTable();
  renderLabChart();
}

// 📌 상단 동적 탭 렌더링
function renderMetricTabs() {
  const container = document.getElementById('metrics-tab-container');
  if (!container) return;

  const metrics = ironData.metrics || [];
  container.innerHTML = metrics.map(m => {
    const isActive = (m.id === currentMetricId);
    return `
      <button onclick="window.switchChartMetric('${m.id}')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
        isActive 
          ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 shadow-md' 
          : 'text-slate-400 hover:text-white hover:bg-slate-800'
      }">
        <span class="w-2 h-2 rounded-full" style="background-color: ${m.color || '#F59E0B'}"></span>
        <span>${m.name}</span>
      </button>
    `;
  }).join('');
}

export function switchChartMetric(metricId) {
  currentMetricId = metricId;
  renderMetricTabs();
  renderLabChart();
}

// 📌 피검사 수치 표 (등록된 모든 항목 동적 컬럼 렌더링)
function renderLabTable() {
  const thead = document.getElementById('lab-table-head');
  const tbody = document.getElementById('lab-table-body');
  if (!thead || !tbody) return;

  const metrics = ironData.metrics || [];
  const records = [...(ironData.labRecords || [])].sort((a, b) => b.date.localeCompare(a.date));

  // 테이블 헤더
  thead.innerHTML = `
    <tr>
      <th class="py-2.5 px-3">검사일자</th>
      ${metrics.map(m => `<th class="py-2.5 px-3">${m.name}<br><span class="text-[10px] text-slate-500 font-normal">(${m.unit})</span></th>`).join('')}
      <th class="py-2.5 px-3">병원 / 메모</th>
      <th class="py-2.5 px-3 text-right">관리</th>
    </tr>
  `;

  if (records.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${metrics.length + 3}" class="py-8 text-center text-xs text-slate-500">등록된 피검사 결과가 없습니다.</td></tr>`;
    return;
  }

  tbody.innerHTML = records.map((r, originalIdx) => {
    return `
      <tr class="hover:bg-slate-900/40 text-xs transition">
        <td class="py-2.5 px-3 font-mono font-semibold text-slate-200">${r.date}</td>
        ${metrics.map(m => {
          const val = (r.values && r.values[m.id] !== undefined && r.values[m.id] !== '') ? Number(r.values[m.id]) : null;
          const isGood = val !== null && m.target !== undefined && val >= Number(m.target);
          return `
            <td class="py-2.5 px-3 font-mono font-bold ${val === null ? 'text-slate-600' : isGood ? 'text-emerald-400' : 'text-amber-400'}">
              ${val !== null ? `${val} ${m.unit}` : '-'}
            </td>
          `;
        }).join('')}
        <td class="py-2.5 px-3 text-slate-400">${r.memo || '-'}</td>
        <td class="py-2.5 px-3 text-right space-x-1.5">
          <button onclick="window.openLabModal(${originalIdx})" class="text-slate-400 hover:text-indigo-400"><i class="fa-solid fa-pen text-[11px]"></i></button>
          <button onclick="window.deleteLabRecord(${originalIdx})" class="text-slate-500 hover:text-rose-400"><i class="fa-solid fa-trash text-[11px]"></i></button>
        </td>
      </tr>
    `;
  }).join('');
}

// 📌 Chart.js 기준선 꺾은선 차트
function renderLabChart() {
  const ctx = document.getElementById('labChart');
  if (!ctx) return;

  const metrics = ironData.metrics || [];
  const currentMetric = metrics.find(m => m.id === currentMetricId) || metrics[0];
  if (!currentMetric) return;

  const sorted = [...(ironData.labRecords || [])].sort((a, b) => a.date.localeCompare(b.date));
  const labels = sorted.map(r => r.date);
  const dataValues = sorted.map(r => (r.values && r.values[currentMetric.id] !== undefined && r.values[currentMetric.id] !== '') ? Number(r.values[currentMetric.id]) : null);

  const targetThreshold = Number(currentMetric.target) || 0;
  const targetLineData = labels.map(() => targetThreshold);

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: `${currentMetric.name} (${currentMetric.unit})`,
          data: dataValues,
          borderColor: currentMetric.color || '#F59E0B',
          backgroundColor: `${currentMetric.color || '#F59E0B'}22`,
          borderWidth: 3,
          fill: true,
          tension: 0.3,
          pointBackgroundColor: '#FFFFFF',
          pointBorderWidth: 2,
          pointRadius: 5
        },
        {
          label: `적정 목표선 (${targetThreshold} ${currentMetric.unit})`,
          data: targetLineData,
          borderColor: '#10B981',
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94A3B8', font: { size: 10 } } },
        y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94A3B8', font: { size: 10 } } }
      },
      plugins: {
        legend: { labels: { color: '#E2E8F0', font: { size: 11 } } }
      }
    }
  });
}

// 📌 1. 피검사 기록 모달
export function openLabModal(idx = -1) {
  document.getElementById('edit-lab-idx').value = idx;
  const inputContainer = document.getElementById('dynamic-metric-inputs');
  const metrics = ironData.metrics || [];

  let recordValues = {};
  if (idx >= 0) {
    const r = ironData.labRecords[idx];
    document.getElementById('lab-modal-title').innerText = '피검사 결과 수정';
    document.getElementById('lab-date').value = r.date || '';
    document.getElementById('lab-memo').value = r.memo || '';
    recordValues = r.values || {};
  } else {
    document.getElementById('lab-modal-title').innerText = '새 피검사 결과 등록';
    document.getElementById('lab-date').value = new Date().toISOString().slice(0, 10);
    document.getElementById('lab-memo').value = '';
  }

  // 동적 검사항목 필드 생성
  inputContainer.innerHTML = metrics.map(m => `
    <div>
      <label class="text-xs text-slate-400 block mb-1">${m.name} (${m.unit})</label>
      <input type="number" step="0.1" id="metric-input-${m.id}" value="${recordValues[m.id] !== undefined ? recordValues[m.id] : ''}" placeholder="목표: ${m.target}" class="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500" />
    </div>
  `).join('');

  document.getElementById('lab-modal').classList.replace('hidden', 'flex');
}

export function closeLabModal() {
  document.getElementById('lab-modal').classList.replace('flex', 'hidden');
}

export function saveLabRecord(onRender) {
  const idx = parseInt(document.getElementById('edit-lab-idx').value);
  const date = document.getElementById('lab-date').value;
  const memo = document.getElementById('lab-memo').value.trim();
  if (!date) return alert('검사 일자를 입력하세요.');

  const metrics = ironData.metrics || [];
  const values = {};
  metrics.forEach(m => {
    const inputEl = document.getElementById(`metric-input-${m.id}`);
    if (inputEl && inputEl.value !== '') {
      values[m.id] = parseFloat(inputEl.value);
    }
  });

  const payload = { date, values, memo };
  if (idx >= 0) ironData.labRecords[idx] = payload;
  else ironData.labRecords.push(payload);

  closeLabModal();
  syncData(onRender);
}

export function deleteLabRecord(idx, onRender) {
  if (!confirm('이 피검사 기록을 삭제하시겠습니까?')) return;
  ironData.labRecords.splice(idx, 1);
  syncData(onRender);
}

// 📌 2. 검사항목 & 기준치 관리 모달
export function openMetricsManageModal() {
  renderMetricsManageList();
  document.getElementById('metrics-manage-modal').classList.replace('hidden', 'flex');
}

export function closeMetricsManageModal() {
  document.getElementById('metrics-manage-modal').classList.replace('flex', 'hidden');
}

function renderMetricsManageList() {
  const listEl = document.getElementById('metrics-manage-list');
  if (!listEl) return;

  const metrics = ironData.metrics || [];
  listEl.innerHTML = metrics.map((m, idx) => `
    <div class="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80 flex items-center justify-between gap-2">
      <div class="flex items-center gap-2.5 flex-1">
        <input type="color" value="${m.color || '#F59E0B'}" onchange="window.updateMetricProp(${idx}, 'color', this.value)" class="w-7 h-7 rounded-lg border-0 bg-transparent cursor-pointer" title="차트 색상" />
        <div class="flex-1 grid grid-cols-3 gap-2 text-xs">
          <div>
            <label class="text-[10px] text-slate-500 block">항목명</label>
            <input type="text" value="${m.name}" onchange="window.updateMetricProp(${idx}, 'name', this.value)" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-bold" />
          </div>
          <div>
            <label class="text-[10px] text-slate-500 block">단위</label>
            <input type="text" value="${m.unit}" onchange="window.updateMetricProp(${idx}, 'unit', this.value)" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white" />
          </div>
          <div>
            <label class="text-[10px] text-slate-500 block">목표 기준선</label>
            <input type="number" step="0.1" value="${m.target}" onchange="window.updateMetricProp(${idx}, 'target', this.value)" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-amber-300 font-bold" />
          </div>
        </div>
      </div>
      <button onclick="window.deleteMetric(${idx})" class="text-slate-500 hover:text-rose-400 p-1.5"><i class="fa-solid fa-trash text-xs"></i></button>
    </div>
  `).join('');
}

export function updateMetricProp(idx, prop, val, onRender) {
  if (!ironData.metrics[idx]) return;
  ironData.metrics[idx][prop] = (prop === 'target') ? parseFloat(val) || 0 : val.trim();
  syncData(() => {
    renderLabView();
    if (onRender) onRender();
  });
}

export function addNewMetricPrompt(onRender) {
  const name = prompt('새로 추가할 검사 항목명을 입력하세요 (예: 비타민D, 백혈구수):');
  if (!name || !name.trim()) return;
  const unit = prompt('수치 단위를 입력하세요 (예: ng/mL, 10^3/μL):', 'ng/mL') || '';
  const target = parseFloat(prompt('적정 목표 기준선을 입력하세요 (숫자):', '30.0')) || 0;

  const newId = 'm_' + Date.now();
  const colors = ['#38BDF8', '#A855F7', '#EC4899', '#10B981', '#F59E0B', '#6366F1'];
  const color = colors[ironData.metrics.length % colors.length];

  if (!ironData.metrics) ironData.metrics = [];
  ironData.metrics.push({ id: newId, name: name.trim(), unit: unit.trim(), target, color });

  syncData(() => {
    renderMetricsManageList();
    renderLabView();
    if (onRender) onRender();
  });
}

export function deleteMetric(idx, onRender) {
  if (ironData.metrics.length <= 1) return alert('최소 1개 이상의 검사 항목이 남아있어야 합니다.');
  if (!confirm(`[${ironData.metrics[idx].name}] 항목을 목록에서 삭제하시겠습니까?`)) return;

  ironData.metrics.splice(idx, 1);
  syncData(() => {
    renderMetricsManageList();
    renderLabView();
    if (onRender) onRender();
  });
}
