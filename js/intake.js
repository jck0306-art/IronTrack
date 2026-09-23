import { ironData, syncData } from './firebase.js'; 

let viewYear = new Date().getFullYear();
let viewMonth = new Date().getMonth(); // 0 ~ 11

export function getTodayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function renderIntakeView() {
  const todayKey = getTodayKey();
  const todayTaken = !!ironData.intakes[todayKey];

  const todayDateStrEl = document.getElementById('today-date-str');
  if (todayDateStrEl) todayDateStrEl.innerText = todayKey;

  const btn = document.getElementById('today-toggle-btn');
  if (btn) {
    if (todayTaken) {
      btn.className = "w-full py-4 rounded-2xl font-bold text-sm transition flex items-center justify-center gap-2.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30";
      btn.innerHTML = `<i class="fa-solid fa-circle-check text-lg"></i> 오늘 복용 완료! (클릭 시 취소)`;
    } else {
      btn.className = "w-full py-4 rounded-2xl font-bold text-sm transition flex items-center justify-center gap-2.5 bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-rose-600/30 hover:opacity-90";
      btn.innerHTML = `<i class="fa-solid fa-pills text-lg"></i> 오늘 철분제 복용 체크하기`;
    }
  }

  // 🌟 선택된 달(viewYear, viewMonth) 기준으로 통계 계산
  calculateStats();

  // 달력 렌더링
  renderCalendar();
}

export function toggleTodayIntake(onRender) {
  const todayKey = getTodayKey();
  ironData.intakes[todayKey] = !ironData.intakes[todayKey];
  syncData(onRender);
}

export function toggleDateIntake(dateKey, onRender) {
  ironData.intakes[dateKey] = !ironData.intakes[dateKey];
  syncData(onRender);
}

// 🌟 온전한 달력 '월(1일 ~ 말일)' 기준으로 복용률 계산
function calculateStats() {
  const intakes = ironData.intakes || {};
  const today = new Date();
  const isCurrentMonthView = (viewYear === today.getFullYear() && viewMonth === today.getMonth());

  // 1. 연속 복용 스트릭 계산 (오늘 기준)
  let streak = 0;
  let checkDate = new Date();
  const todayKey = getTodayKey();
  if (!intakes[todayKey]) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const y = checkDate.getFullYear();
    const m = String(checkDate.getMonth() + 1).padStart(2, '0');
    const d = String(checkDate.getDate()).padStart(2, '0');
    const k = `${y}-${m}-${d}`;
    if (intakes[k]) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  const streakEl = document.getElementById('current-streak');
  if (streakEl) streakEl.innerText = `${streak}일째 🔥`;

  // 🌟 특정 연/월의 온전한 1일 ~ 말일 복용율을 계산하는 헬퍼 함수
  function getMonthStats(targetYear, targetMonthIndex, isCurrent) {
    const totalDays = new Date(targetYear, targetMonthIndex + 1, 0).getDate();
    // 현재 이번 달을 보고 있다면 오늘 날짜까지만 분모로 계산, 지난달은 말일까지 계산
    const daysToCount = isCurrent ? today.getDate() : totalDays;

    let takenCount = 0;
    for (let day = 1; day <= daysToCount; day++) {
      const k = `${targetYear}-${String(targetMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (intakes[k]) takenCount++;
    }

    const rate = Math.round((takenCount / daysToCount) * 100) || 0;
    return { rate, takenCount, daysToCount, monthNum: targetMonthIndex + 1 };
  }

  // 2. 기준 월 (현재 보고 있는 달: 예: 9월)
  const baseStats = getMonthStats(viewYear, viewMonth, isCurrentMonthView);
  const monthRateEl = document.getElementById('month-rate');
  if (monthRateEl) {
    monthRateEl.innerText = `${baseStats.rate}%`;
    monthRateEl.title = `${baseStats.monthNum}월 ${baseStats.takenCount}/${baseStats.daysToCount}일 복용`;
    const labelEl = monthRateEl.previousElementSibling;
    if (labelEl) labelEl.innerText = isCurrentMonthView ? '당월 복용률' : `${baseStats.monthNum}월 복용률`;
  }

  // 3. 직전 1개월 (기준 월의 바로 전달 1일 ~ 말일: 예: 8월 1일 ~ 8월 31일)
  const prev1Date = new Date(viewYear, viewMonth - 1, 1);
  const prev1Stats = getMonthStats(prev1Date.getFullYear(), prev1Date.getMonth(), false);
  const rate1MEl = document.getElementById('rate-1month');
  if (rate1MEl) {
    rate1MEl.innerText = `${prev1Stats.rate}%`;
    rate1MEl.title = `${prev1Stats.monthNum}월 전체 ${prev1Stats.takenCount}/${prev1Stats.daysToCount}일 복용`;
    const labelEl = rate1MEl.previousElementSibling;
    if (labelEl) labelEl.innerText = `${prev1Stats.monthNum}월 복용률`;
  }

  // 4. 직전 2개월 (기준 월의 2달 전 1일 ~ 말일: 예: 7월 1일 ~ 7월 31일)
  const prev2Date = new Date(viewYear, viewMonth - 2, 1);
  const prev2Stats = getMonthStats(prev2Date.getFullYear(), prev2Date.getMonth(), false);
  const rate2MEl = document.getElementById('rate-2month');
  if (rate2MEl) {
    rate2MEl.innerText = `${prev2Stats.rate}%`;
    rate2MEl.title = `${prev2Stats.monthNum}월 전체 ${prev2Stats.takenCount}/${prev2Stats.daysToCount}일 복용`;
    const labelEl = rate2MEl.previousElementSibling;
    if (labelEl) labelEl.innerText = `${prev2Stats.monthNum}월 복용률`;
  }
}

function formatDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function changeCalendarMonth(delta, onRender) {
  viewMonth += delta;
  if (viewMonth < 0) {
    viewMonth = 11;
    viewYear--;
  } else if (viewMonth > 11) {
    viewMonth = 0;
    viewYear++;
  }

  // 🌟 달력 이동 시 달력과 상단 통계 수치를 함께 새로고침
  renderCalendar();
  calculateStats();
}

function renderCalendar() {
  const monthTitleEl = document.getElementById('cal-month-title');
  if (monthTitleEl) monthTitleEl.innerText = `${viewYear}년 ${viewMonth + 1}월`;

  const grid = document.getElementById('calendar-days-grid');
  if (!grid) return;

  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
  const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayKey = getTodayKey();

  let html = '';

  for (let i = 0; i < firstDayIndex; i++) {
    html += `<div class="h-10"></div>`;
  }

  for (let day = 1; day <= totalDays; day++) {
    const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isTaken = !!ironData.intakes[dateKey];
    const isToday = (dateKey === todayKey);

    html += `
      <button onclick="window.toggleDateIntake('${dateKey}')" class="h-10 rounded-xl text-xs font-semibold flex flex-col items-center justify-center transition relative ${
        isTaken ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold' : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 border border-slate-800/60'
      } ${isToday ? 'ring-2 ring-indigo-500' : ''}">
        <span>${day}</span>
        ${isTaken ? `<i class="fa-solid fa-circle text-[6px] text-rose-400 mt-0.5"></i>` : ''}
      </button>
    `;
  }

  grid.innerHTML = html;
}
