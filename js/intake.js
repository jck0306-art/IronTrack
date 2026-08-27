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

  // 오늘 날짜 표시
  const todayDateStrEl = document.getElementById('today-date-str');
  if (todayDateStrEl) todayDateStrEl.innerText = todayKey;

  // 원클릭 복용 버튼 렌더링
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

  // 스트릭 & 복용률 계산
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
  // 연속 복용 스트릭 계산
  let streak = 0;
  let checkDate = new Date();
  
  // 오늘 아직 안 먹었으면 어제부터 카운트 확인
  const todayKey = getTodayKey();
  if (!ironData.intakes[todayKey]) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const y = checkDate.getFullYear();
    const m = String(checkDate.getMonth() + 1).padStart(2, '0');
    const d = String(checkDate.getDate()).padStart(2, '0');
    const k = `${y}-${m}-${d}`;
    if (ironData.intakes[k]) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  document.getElementById('current-streak').innerText = `${streak}일째 🔥`;

  // 이번 달 복용률
  const now = new Date();
  const currentDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  let takenDaysThisMonth = 0;
  for (let day = 1; day <= currentDaysInMonth; day++) {
    const k = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (ironData.intakes[k]) takenDaysThisMonth++;
  }
  const rate = Math.round((takenDaysThisMonth / now.getDate()) * 100) || 0;
  document.getElementById('month-rate').innerText = `${Math.min(100, rate)}%`;
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

  // 빈 칸
  for (let i = 0; i < firstDayIndex; i++) {
    html += `<div class="h-10"></div>`;
  }

  // 날짜 박스
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
