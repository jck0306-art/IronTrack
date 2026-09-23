let currentHistoryFilter = 'all';

function formatDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDayName(d) {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[d.getDay()];
}

/**
 * 🌟 최근 3개월(90일) 복용율 통계 및 히스토리 렌더링
 * @param {Object} intakes - { "2026-09-23": true, "2026-09-22": true, ... }
 */
export function renderThreeMonthHistory(intakes = {}) {
  const statRateEl = document.getElementById('stat-3month-rate');
  const rangeEl = document.getElementById('history-3month-range');
  const tbodyEl = document.getElementById('history-3month-table-body');

  const today = new Date();
  const past90Days = [];
  let takenCount = 0;

  // 오늘부터 90일 전까지 역순(최신순)으로 날짜 생성
  for (let i = 0; i < 90; i++) {
    const targetDate = new Date();
    targetDate.setDate(today.getDate() - i);
    const dateStr = formatDate(targetDate);
    
    // 🌟 intakes 객체에서 정확히 boolean 값 판정
    const isTaken = Boolean(intakes && intakes[dateStr]);
    if (isTaken) takenCount++;

    past90Days.push({
      dateStr,
      dayName: getDayName(targetDate),
      isTaken
    });
  }

  // 1. 최근 3개월 복용율 계산 (90일 기준)
  const totalDays = past90Days.length;
  const rate = Math.round((takenCount / totalDays) * 100);

  if (statRateEl) {
    statRateEl.innerText = `${rate}%`;
    statRateEl.title = `최근 90일 중 ${takenCount}일 복용`;
  }

  const startDateStr = past90Days[past90Days.length - 1].dateStr;
  const endDateStr = past90Days[0].dateStr;
  if (rangeEl) {
    rangeEl.innerText = `${startDateStr} ~ ${endDateStr} (90일 중 ${takenCount}일 복용완료)`;
  }

  if (!tbodyEl) return;

  // 2. 필터링 적용
  let filteredList = past90Days;
  if (currentHistoryFilter === 'taken') {
    filteredList = past90Days.filter(item => item.isTaken);
  } else if (currentHistoryFilter === 'missed') {
    filteredList = past90Days.filter(item => !item.isTaken);
  }

  // 3. 테이블 출력
  if (filteredList.length === 0) {
    tbodyEl.innerHTML = `
      <tr>
        <td colspan="4" class="py-8 text-center text-xs text-slate-500">
          해당 조건의 기록이 없습니다.
        </td>
      </tr>
    `;
    return;
  }

  tbodyEl.innerHTML = filteredList.map(item => {
    const dayColor = item.dayName === '일' ? 'text-rose-400' : (item.dayName === '토' ? 'text-indigo-400' : 'text-slate-400');

    return `
      <tr class="hover:bg-slate-800/30 text-xs transition border-b border-slate-800/50">
        <td class="py-2.5 px-4 text-center font-mono font-medium text-slate-300">
          ${item.dateStr}
        </td>
        <td class="py-2.5 px-4 text-center font-bold ${dayColor}">
          ${item.dayName}
        </td>
        <td class="py-2.5 px-4 text-center">
          ${item.isTaken 
            ? `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">복용 완료</span>`
            : `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-500 border border-slate-700">미복용</span>`
          }
        </td>
        <td class="py-2.5 px-4 text-center">
          <button onclick="window.toggleDateIntake('${item.dateStr}')" class="px-2.5 py-1 text-[11px] rounded-lg border transition ${
            item.isTaken 
              ? 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20' 
              : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20'
          }">
            ${item.isTaken ? '취소' : '복용 체크'}
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// 🌟 필터 토글 핸들러
window.filter3MonthHistory = function(filterType) {
  currentHistoryFilter = filterType;

  ['all', 'taken', 'missed'].forEach(type => {
    const btn = document.getElementById(`btn-hist-${type}`);
    if (btn) {
      if (type === filterType) {
        btn.className = "px-3 py-1 rounded-lg font-bold bg-slate-800 text-white transition";
      } else {
        btn.className = "px-3 py-1 rounded-lg text-slate-400 hover:text-white transition";
      }
    }
  });

  if (window.ironRecords) {
    renderThreeMonthHistory(window.ironRecords);
  }
};
