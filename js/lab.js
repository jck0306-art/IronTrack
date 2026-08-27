import { ironData, syncData } from './firebase.js';

let chartInstance = null;
let currentMetric = 'ferritin'; // 'ferritin' | 'hb'

export function renderLabView() {
  renderLabTable();
  renderLabChart();
}

function renderLabTable() {
  const listEl = document.getElementById('lab-table-body');
  if (!listEl) return;

  const records = [...(ironData.labRecords || [])].sort((a, b) => b.date.localeCompare(a.date));

  if (records.length === 0) {
    listEl.innerHTML = `<tr><td colspan="5" class="py-6 text-center text-xs text-slate-500">등록된 피검사 결과가 없습니다.</td></tr>`;
    return;
  }

  listEl.innerHTML = records.map((r, originalIdx) => {
    // 적정 기준치 판별 (페리틴: 50 이상 권장, Hb: 12.0 이상 정상)
    const isFerritinGood = (Number(r.ferritin) || 0) >= 50;
    const isHbGood = (Number(r.hb) || 0) >= 12.0;

    return `
      <tr class="hover:bg-slate-900/40 text-xs transition">
        <td class="py-2.5 px-3 font-mono font-semibold text-slate-200">${r.date}</td>
        <td class="py-2.5 px-3 font-mono font-bold ${isFerritinGood ? 'text-emerald-400' : 'text-amber-400'}">
          ${r.ferritin !== undefined && r.ferritin !== '' ? `${r.ferritin} ng/mL` : '-'}
        </td>
        <td class="py-2.5 px-3 font-mono font-bold ${isHbGood ? 'text-emerald-400' : 'text-rose-400'}">
          ${r.hb !== undefined && r.hb !== '' ? `${r.hb} g/dL` : '-'}
        </td>
        <td class="py-2.5 px-3 text-slate-400">${r.memo || '-'}</td>
        <td class="py-2.5 px-3 text-right space-x-1.5">
          <button onclick="window.openLabModal(${originalIdx})" class="text-slate-400 hover:text-indigo-400"><i class="fa-solid fa-pen text-[11px]"></i></button>
          <button onclick="window.deleteLabRecord(${originalIdx})" class="text-slate-500 hover:text-rose-400"><i class="fa-solid fa-trash text-[11px]"></i></button>
        </td>
      </tr>
    `;
  }).join('');
}

export function switchChartMetric(metric) {
  currentMetric = metric;
  const tabFerritin = document.getElementById('chart-tab-ferritin');
  const tabHb = document.getElementById('chart-tab-hb');

  if (metric === 'ferritin') {
    tabFerritin.className = "px-3 py-1 rounded-lg font-bold transition bg-amber-500 text-slate-950 shadow";
    tabHb.className = "px-3 py-1 rounded-lg font-semibold text-slate-400 hover:text-white transition";
  } else {
    tabHb.className = "px-3 py-1 rounded-lg font-bold transition bg-rose-500 text-white shadow";
    tabFerritin.className = "px-3 py-1 rounded-lg font-semibold text-slate-400 hover:text-white transition";
  }
  renderLabChart();
}

function renderLabChart() {
  const ctx = document.getElementById('labChart');
  if (!ctx) return;

  const sorted = [...(ironData.labRecords || [])].sort((a, b) => a.date.localeCompare(b.date));
  const labels = sorted.map(r => r.date);

  const isFerritin = (currentMetric === 'ferritin');
  const dataValues = sorted.map(r => isFerritin ? (Number(r.ferritin) || null) : (Number(r.hb) || null));
  
  // 적정 권장 기준선 (페리틴: 50 ng/mL, Hb: 12.0 g/dL)
  const targetThreshold = isFerritin ? 50 : 12.0;
  const targetLineData = labels.map(() => targetThreshold);

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: isFerritin ? '페리틴 수치 (ng/mL)' : '헤모글로빈 수치 (g/dL)',
          data: dataValues,
          borderColor: isFerritin ? '#F59E0B' : '#F43F5E',
          backgroundColor: isFerritin ? 'rgba(245, 158, 11, 0.15)' : 'rgba(244, 63, 94, 0.15)',
          borderWidth: 3,
          fill: true,
          tension: 0.3,
          pointBackgroundColor: '#FFFFFF',
          pointBorderWidth: 2,
          pointRadius: 5
        },
        {
          label: `적정 기준선 (${targetThreshold}${isFerritin ? ' ng/mL' : ' g/dL'})`,
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
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94A3B8', font: { size: 10 } }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94A3B8', font: { size: 10 } }
        }
      },
      plugins: {
        legend: {
          labels: { color: '#E2E8F0', font: { size: 11 } }
        }
      }
    }
  });
}

// 모달 제어
export function openLabModal(idx = -1) {
  document.getElementById('edit-lab-idx').value = idx;
  if (idx >= 0) {
    const r = ironData.labRecords[idx];
    document.getElementById('lab-modal-title').innerText = '피검사 결과 수정';
    document.getElementById('lab-date').value = r.date || '';
    document.getElementById('lab-ferritin').value = r.ferritin !== undefined ? r.ferritin : '';
    document.getElementById('lab-hb').value = r.hb !== undefined ? r.hb : '';
    document.getElementById('lab-memo').value = r.memo || '';
  } else {
    document.getElementById('lab-modal-title').innerText = '새 피검사 결과 등록';
    document.getElementById('lab-date').value = new Date().toISOString().slice(0, 10);
    document.getElementById('lab-ferritin').value = '';
    document.getElementById('lab-hb').value = '';
    document.getElementById('lab-memo').value = '';
  }
  document.getElementById('lab-modal').classList.replace('hidden', 'flex');
}

export function closeLabModal() {
  document.getElementById('lab-modal').classList.replace('flex', 'hidden');
}

export function saveLabRecord(onRender) {
  const idx = parseInt(document.getElementById('edit-lab-idx').value);
  const date = document.getElementById('lab-date').value;
  const ferritin = document.getElementById('lab-ferritin').value !== '' ? parseFloat(document.getElementById('lab-ferritin').value) : '';
  const hb = document.getElementById('lab-hb').value !== '' ? parseFloat(document.getElementById('lab-hb').value) : '';
  const memo = document.getElementById('lab-memo').value.trim();

  if (!date) return alert('검사 일자를 입력하세요.');

  const payload = { date, ferritin, hb, memo };

  if (idx >= 0) {
    ironData.labRecords[idx] = payload;
  } else {
    ironData.labRecords.push(payload);
  }

  closeLabModal();
  syncData(onRender);
}

export function deleteLabRecord(idx, onRender) {
  if (!confirm('이 피검사 기록을 삭제하시겠습니까?')) return;
  ironData.labRecords.splice(idx, 1);
  syncData(onRender);
}
