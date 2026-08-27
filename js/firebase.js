export const firebaseConfig = {
  apiKey: "AIzaSyBQ0zSJleSHBjmecj1Qe-kmhLu-GDYXWE8",
  authDomain: "license-mgmt-157ed.firebaseapp.com",
  projectId: "license-mgmt-157ed",
  storageBucket: "license-mgmt-157ed.firebasestorage.app",
  messagingSenderId: "20449962943",
  appId: "1:20449962943:web:35d36af2eb555d23760f0a"
};

export const DEFAULT_DATA = {
  intakes: {},
  // 🩺 관리할 검사항목 정의 (자유롭게 추가/수정 가능)
  metrics: [
    { id: 'ferritin', name: '페리틴(저장철)', unit: 'ng/mL', target: 50, color: '#F59E0B' },
    { id: 'hb', name: '헤모글로빈(Hb)', unit: 'g/dL', target: 12.0, color: '#F43F5E' },
    { id: 'iron', name: '혈청 철(Iron)', unit: 'μg/dL', target: 60.0, color: '#38BDF8' }
  ],
  labRecords: [
    { date: '2026-03-15', values: { ferritin: 12.4, hb: 10.8, iron: 42.0 }, memo: '초기 빈혈 진단' },
    { date: '2026-06-10', values: { ferritin: 28.6, hb: 12.1, iron: 58.5 }, memo: '수치 상승 중' },
    { date: '2026-08-20', values: { ferritin: 48.2, hb: 13.0, iron: 75.0 }, memo: '정상 수치 도달 직전' }
  ]
};

let db = null;
let isFirebaseReady = false;

if (window.firebase) {
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    db = firebase.firestore();
    isFirebaseReady = true;
  } catch (e) {
    console.error("Firebase Init Error:", e);
  }
}

export let ironData = JSON.parse(localStorage.getItem('iron_track_cloud_data_v2')) || DEFAULT_DATA;

function ensureDataStructure() {
  if (!ironData.intakes) ironData.intakes = {};
  if (!ironData.metrics || ironData.metrics.length === 0) ironData.metrics = DEFAULT_DATA.metrics;
  if (!ironData.labRecords) ironData.labRecords = [];

  // 이전 버전 데이터 하위 호환성 (단일 필드 -> values 객체로 마이그레이션)
  ironData.labRecords.forEach(r => {
    if (!r.values) {
      r.values = {};
      if (r.ferritin !== undefined) r.values.ferritin = r.ferritin;
      if (r.hb !== undefined) r.values.hb = r.hb;
    }
  });
}

export function initFirebase(onDataUpdate) {
  ensureDataStructure();
  if (isFirebaseReady) {
    db.collection("health_dashboard").doc("iron_data_v2").onSnapshot(docSnap => {
      if (docSnap.exists) {
        ironData = docSnap.data();
        ensureDataStructure();
      } else {
        db.collection("health_dashboard").doc("iron_data_v2").set(DEFAULT_DATA);
      }
      const statusEl = document.getElementById('sync-status');
      if (statusEl) statusEl.innerHTML = '<i class="fa-solid fa-cloud"></i> 실시간 동기화';
      onDataUpdate();
    }, error => {
      console.error("Firestore Error:", error);
      const statusEl = document.getElementById('sync-status');
      if (statusEl) statusEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation text-rose-400"></i> 로컬 모드';
      onDataUpdate();
    });
  } else {
    onDataUpdate();
  }
}

export function syncData(onRender) {
  ensureDataStructure();
  localStorage.setItem('iron_track_cloud_data_v2', JSON.stringify(ironData));
  if (isFirebaseReady) {
    db.collection("health_dashboard").doc("iron_data_v2").set(ironData);
  }
  if (onRender) onRender();
}
