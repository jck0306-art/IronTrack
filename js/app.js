import { initFirebase } from './firebase.js';
import { renderIntakeView, toggleTodayIntake, toggleDateIntake, changeCalendarMonth } from './intake.js';
import { 
  renderLabView, switchChartMetric, openLabModal, closeLabModal, saveLabRecord, deleteLabRecord,
  openMetricsManageModal, closeMetricsManageModal, updateMetricProp, addNewMetricPrompt, deleteMetric
} from './lab.js';
import { initAuthGuard, logoutAdmin } from './security.js';

function render() {
  renderIntakeView();
  renderLabView();
  import { renderThreeMonthHistory } from './tracker.js';

function render() {
  // 기존 통계 및 달력 렌더링 코드...
  
  // 🌟 최근 3개월 히스토리 및 복용율 갱신 추가
  const records = cloudData.records || {}; // 저장소 구조에 맞게 연결
  window.ironRecords = records;
  renderThreeMonthHistory(records);
}
}

// 좌측 복용 관리
window.toggleTodayIntake = () => toggleTodayIntake(render);
window.toggleDateIntake = dateKey => toggleDateIntake(dateKey, render);
window.changeCalendarMonth = delta => changeCalendarMonth(delta, render);

// 우측 검사결과 수치 & 차트
window.switchChartMetric = metricId => switchChartMetric(metricId);
window.openLabModal = idx => openLabModal(idx);
window.closeLabModal = closeLabModal;
window.saveLabRecord = () => saveLabRecord(render);
window.deleteLabRecord = idx => deleteLabRecord(idx, render);

// 🩺 동적 검사항목 & 기준치 관리 바인딩
window.openMetricsManageModal = openMetricsManageModal;
window.closeMetricsManageModal = closeMetricsManageModal;
window.updateMetricProp = (idx, prop, val) => updateMetricProp(idx, prop, val, render);
window.addNewMetricPrompt = () => addNewMetricPrompt(render);
window.deleteMetric = idx => deleteMetric(idx, render);

// 관리자 로그아웃 전역 바인딩
window.logoutAdmin = logoutAdmin;

// 🌟 로그인 인증 확인 후 안전하게 Firebase DB 로드
window.addEventListener('DOMContentLoaded', () => {
  initAuthGuard(false, () => {
    initFirebase(render);
  });
});
