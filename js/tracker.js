let currentHistoryFilter = 'all';

// 날짜를 YYYY-MM-DD 형식으로 반환하는 헬퍼
function formatDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 요일 반환 헬퍼
function getDayName(d) {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[d.getDay()];
}

/**
 * 🌟 최근 3개월(90일) 복용율 통계 및 히스토리 렌더링 함수
 * @param {Object|Array} records - 날짜별 복용 데이터 (예: { "2026-09-23": { taken: true, time: "09:30", note: "식후" } })
 */
export function renderThreeMonthHistory(records = {}) {
  const statRateEl = document.getElementById('stat-3month-rate');
  const statCountEl = document.getElementById('stat-3month-count');
  const rangeEl = document.getElementById('history-3month-range');
  const tbodyEl = document.getElementById('history-3month-table-body');

  if (!tbodyEl) return;

  const today = new Date();
  const past90Days = [];
  let takenCount = 0;

  // 90일 전부터 오늘까지 역순(최신순)으로 날짜 생성
  for (let i = 0; i < 90; i++) {
    const targetDate = new Date();
    targetDate.setDate(today.getDate() - i);
    const dateStr = formatDate(targetDate);
    
    // 기록이 배열인지 객체인지에 맞춰 데이터 추출
    let entry = null;
    if (Array.isArray(records)) {
      entry = records.find(r => r.date === dateStr);
    } else if (records[dateStr]) {
      entry = records[dateStr];
    }

    const isTaken = Boolean(entry && (entry.taken === true || entry.taken === 'true'));
    if (isTaken) takenCount++;

    past90Days.push({
      dateStr,
      dateObj: targetDate,
      dayName: getDayName(targetDate),
      isTaken,
      time: entry?.time || '-',
      note: entry?.note || entry?.memo || '-'
    });
  }

  // 1. 3개월 복용율 통계 업데이트
  const totalDays = past90Days.length;
  const rate = Math.round((takenCount / totalDays) * 100);

  if (statRateEl) statRateEl.innerText = `${rate}%`;
  if (statCountEl) statCountEl.innerText = `(${takenCount} / ${totalDays}일)`;

  const startDateStr = past90Days[past90Days.length - 1].dateStr;
  const endDateStr = past90Days[0].dateStr;
  if (rangeEl) {
    rangeEl.innerText = `${startDateStr} ~ ${endDateStr} (총 90일간)`;
  }

  // 2. 필터링 적용 (전체 / 복용완료 / 미복용)
  let filteredList = past90Days;
  if (currentHistoryFilter === 'taken') {
    filteredList = past90Days.filter(item => item.isTaken);
  } else if (currentHistoryFilter === 'missed') {
    filteredList = past90Days.filter(item => !item.isTaken);
  }

  // 3. 테이블 렌더링
  if (filteredList.length === 0) {
    tbodyEl.innerHTML = `
      <tr>
        <td colspan="5" class="py-8 text-center text-xs text-slate-500">
          해당 조건의 복용 히스토리가 없습니다.
        </td>
      </tr>
    `;
    return;
  }

  tbodyEl.innerHTML = filteredList.map(item => {
    const isWeekend = item.dayName === '토' || item.dayName === '일';
    const dayColor = item.dayName === '일' ? 'text-rose-400' : (item.dayName === '토' ? 'text-indigo-400' : 'text-slate-400');

    return `
      <tr class="hover:bg-slate-800/30 text-xs transition border-b border-slate-800/50">
        <td class="py-2.5 px-3 text-center font-mono font-medium text-slate-300">
          ${item.dateStr}
        </td>
        <td class="py-2.5 px-3 text-center font-bold ${dayColor}">
          ${item.dayName}
        </td>
        <td class="py-2.5 px-3 text-center">
          ${item.isTaken 
            ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">복용 완료</span>`
            : `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">미복용</span>`
          }
        </td>
        <td class="py-2.5 px-3 font-mono text-[11px] text-slate-300">
          ${item.isTaken ? item.time : '<span class="text-slate-600">-</span>'}
        </td>
        <td class="py-2.5 px-3 text-slate-400 text-[11px] break-words">
          ${item.note !== '-' ? item.note : '<span class="text-slate-600">-</span>'}
        </td>
      </tr>
    `;
  }).join('');
}

// 🌟 필터 변경 핸들러
window.filter3MonthHistory = function(filterType) {
  currentHistoryFilter = filterType;

  ['all', 'taken', 'missed'].forEach(type => {
    const btn = document.getElementById(`btn-hist-${type}`);
    if (btn) {
      if (type === filterType) {
        btn.className = "px-2.5 py-1 rounded-lg font-bold bg-slate-800 text-white transition";
      } else {
        btn.className = "px-2.5 py-1 rounded-lg text-slate-400 hover:text-white transition";
      }
    }
  });

  // 전역 데이터(cloudData 또는 localRecords)로 다시 렌더링 호출
  if (window.ironRecords) {
    renderThreeMonthHistory(window.ironRecords);
  }
};
