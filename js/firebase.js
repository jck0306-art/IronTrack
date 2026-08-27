export const firebaseConfig = {
  apiKey: "AIzaSyBQ0zSJleSHBjmecj1Qe-kmhLu-GDYXWE8", 
  authDomain: "license-mgmt-157ed.firebaseapp.com",
  projectId: "license-mgmt-157ed",
  storageBucket: "license-mgmt-157ed.firebasestorage.app",
  messagingSenderId: "20449962943",
  appId: "1:20449962943:web:35d36af2eb555d23760f0a"
};

export const DEFAULT_DATA = {
  // YYYY-MM-DD 키에 true/false 기록
  intakes: {},
  // 피검사 기록 배열
  labRecords: [
    { date: '2026-03-15', ferritin: 12.4, hb: 10.8, memo: '초기 빈혈 진단 / 철분제 복용 시작' },
    { date: '2026-06-10', ferritin: 28.6, hb: 12.1, memo: '수치 상승 중' },
    { date: '2026-08-20', ferritin: 48.2, hb: 13.0, memo: '정상 수치 도달 직전' }
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

export let ironData = JSON.parse(localStorage.getItem('iron_track_cloud_data_v1')) || DEFAULT_DATA;

function ensureDataStructure() {
  if (!ironData.intakes) ironData.intakes = {};
  if (!ironData.labRecords) ironData.labRecords = [];
}

export function initFirebase(onDataUpdate) {
  ensureDataStructure();
  if (isFirebaseReady) {
    db.collection("health_dashboard").doc("iron_data").onSnapshot(docSnap => {
      if (docSnap.exists) {
        ironData = docSnap.data();
        ensureDataStructure();
      } else {
        db.collection("health_dashboard").doc("iron_data").set(DEFAULT_DATA);
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
  localStorage.setItem('iron_track_cloud_data_v1', JSON.stringify(ironData));
  if (isFirebaseReady) {
    db.collection("health_dashboard").doc("iron_data").set(ironData);
  }
  if (onRender) onRender();
}
