import { initFirebase } from './firebase.js';
import { renderIntakeView, toggleTodayIntake, toggleDateIntake, changeCalendarMonth } from './intake.js';
import { renderLabView, switchChartMetric, openLabModal, closeLabModal, saveLabRecord, deleteLabRecord } from './lab.js';

function render() {
  renderIntakeView();
  renderLabView();
}

// 글로벌 핸들러 바인딩
window.toggleTodayIntake = () => toggleTodayIntake(render);
window.toggleDateIntake = dateKey => toggleDateIntake(dateKey, render);
window.changeCalendarMonth = delta => changeCalendarMonth(delta, render);

window.switchChartMetric = metric => switchChartMetric(metric);
window.openLabModal = idx => openLabModal(idx);
window.closeLabModal = closeLabModal;
window.saveLabRecord = () => saveLabRecord(render);
window.deleteLabRecord = idx => deleteLabRecord(idx, render);

window.addEventListener('DOMContentLoaded', () => {
  initFirebase(render);
});
