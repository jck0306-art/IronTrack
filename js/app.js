import { initFirebase } from './firebase.js';
import { renderIntakeView, toggleTodayIntake, toggleDateIntake, changeCalendarMonth } from './intake.js';
import { 
  renderLabView, switchChartMetric, openLabModal, closeLabModal, saveLabRecord, deleteLabRecord,
  openMetricsManageModal, closeMetricsManageModal, updateMetricProp, addNewMetricPrompt, deleteMetric
} from './lab.js';

function render() {
  renderIntakeView();
  renderLabView();
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

window.addEventListener('DOMContentLoaded', () => {
  initFirebase(render);
});
