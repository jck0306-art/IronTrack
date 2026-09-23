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

  // 스트릭 & 당월 / 1개월 / 2개월 복용율 계산
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

function calculateStats() {
  const intakes = ironData.intakes || {};
  const today = new Date();

  // 1. 연속 복용 스트릭 계산
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

  // 2. 당월 복용률 (1일 ~ 오늘 기준)
  let monthTaken = 0;
  const currentDay = today.getDate();
  for (let day = 1; day <= currentDay; day++) {
    const k = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (intakes[k]) monthTaken++;
  }
  const monthRate = Math.round((monthTaken / currentDay) * 100) || 0;
  const monthRateEl = document.getElementById('month-rate');
  if (monthRateEl) {
    monthRateEl.innerText = `${monthRate}%`;
    monthRateEl.title = `당월 ${monthTaken}/${currentDay}일 복용`;
  }

  // 3. 최근 1개월(30일) 복용율
  let count1M = 0;
  for (let i = 0; i < 30; i++) {
    const target = new Date();
    target.setDate(today.getDate() - i);
    const k = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`;
    if (intakes[k]) count1M++;
  }
  const rate1M = Math.round((count1M / 30) * 100);
  const rate1MEl = document.getElementById('rate-1month');
  if (rate1MEl) {
    rate1MEl.innerText = `${rate1M}%`;
    rate1MEl.title = `최근 30일 중 ${count1M}일 복용`;
  }

  // 4. 최근 2개월(60일) 복용율
  let count2M = 0;
  for (let i = 0; i < 60; i++) {
    const target = new Date();
    target.setDate(today.getDate() - i);
    const k = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`;
    if (intakes[k]) count2M++;
  }
  const rate2M = Math.round((count2M / 60) * 100);
  const rate2MEl = document.getElementById('rate-2month');
  if (rate2MEl) {
    rate2MEl.innerText = `${rate2M}%`;
    rate2MEl.title = `최근 60일 중 ${count2M}일 복용`;
  }
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
  renderCalendar();
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
