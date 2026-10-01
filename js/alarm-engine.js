// ==================== محرك التنبيهات، الأذان، و IndexedDB المتقدم ====================

const ALARM_DB_NAME = 'HayatAlarmDB';
const ALARM_DB_VERSION = 1;
let alarmDBInstance = null;

// 1. فتح وتهيئة مستودع الصوتيات الضخم IndexedDB للأوفلاين الدائم
function initAlarmDatabase() {
  return new Promise((resolve, reject) => {
    if (alarmDBInstance) return resolve(alarmDBInstance);
    const req = indexedDB.open(ALARM_DB_NAME, ALARM_DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('custom_audio')) {
        db.createObjectStore('custom_audio', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('user_alarms')) {
        db.createObjectStore('user_alarms', { keyPath: 'id' });
      }
    };

    req.onsuccess = (e) => {
      alarmDBInstance = e.target.result;
      resolve(alarmDBInstance);
    };

    req.onerror = () => reject('Failed to open Alarm IndexedDB');
  });
}

// حفظ ملف صوتي مرفوع في IndexedDB
async function saveCustomAudioBlob(id, fileBlob, fileName) {
  const db = await initAlarmDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('custom_audio', 'readwrite');
    const store = tx.objectStore('custom_audio');
    store.put({ id: id, blob: fileBlob, name: fileName, createdAt: Date.now() });
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(false);
  });
}

// استخراج ملف صوتي من IndexedDB
async function getCustomAudioBlob(id) {
  const db = await initAlarmDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('custom_audio', 'readonly');
    const store = tx.objectStore('custom_audio');
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result ? req.result.blob : null);
    req.onerror = () => reject(null);
  });
}

// 2. قائمة المؤذنين المدمجة
const MUEZZIN_LIST = [
  { id: 'makkah', name: 'أذان مكة المكرمة', country: 'السعودية 🇸🇦', url: 'https://cdn.aladhan.com/audio/adhans/1.mp3' },
  { id: 'madinah', name: 'أذان المسجد النبوي (المدينة)', country: 'السعودية 🇸🇦', url: 'https://cdn.aladhan.com/audio/adhans/2.mp3' },
  { id: 'aqsa', name: 'أذان المسجد الأقصى', country: 'فلسطين 🇵🇸', url: 'https://cdn.aladhan.com/audio/adhans/3.mp3' },
  { id: 'egypt', name: 'أذان مصر (الإذاعة)', country: 'مصر 🇪🇬', url: 'https://cdn.aladhan.com/audio/adhans/4.mp3' },
  { id: 'yemen', name: 'أذان صنعاء التراثي', country: 'اليمن 🇾🇪', url: 'https://cdn.aladhan.com/audio/adhans/5.mp3' },
  { id: 'turkey', name: 'أذان إسطنبول (الديانت)', country: 'تركيا 🇹🇷', url: 'https://cdn.aladhan.com/audio/adhans/6.mp3' }
];

// خلفيات شاشة الأذان الـ 4
const ADHAN_BG_PRESETS = [
  { id: 'bg1', url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80', title: 'جامع الشيخ زايد' },
  { id: 'bg2', url: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=800&q=80', title: 'الكعبة المشرفة' },
  { id: 'bg3', url: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=800&q=80', title: 'المسجد النبوي الشريف' },
  { id: 'bg4', url: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=800&q=80', title: 'محراب وقبة المسجد' }
];

// 3. إدارة الإعدادات الخاصة بكل صلاة و "كل الصلوات"
let currentActivePrayerAlarmContext = 'Maghrib'; // 'All' | 'Fajr' | 'Sunrise' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha' | 'Friday' | 'Eid'
let previewAudioPlayer = new Audio();

function getPrayerAlarmConfig(prayerKey) {
  const allConfigs = JSON.parse(localStorage.getItem('hayat_prayer_alarms_data')) || {};
  const def = {
    enabled: true,
    bgId: 'bg1',
    audioMode: 'muezzin', // 'muezzin' | 'system' | 'custom' | 'silent'
    selectedMuezzinId: 'makkah',
    customAudioId: null,
    vibrationEnabled: true,
    autoSilentPrayer: true, // وضع الهزاز التلقائي أثناء الصلاة
    autoSilentBufferMins: 15,
    preAlarms: [] // [{ id: 'p1', minutes: 15, position: 'before', tone: 'chime', sound: true, vibrate: true }]
  };
  return Object.assign({}, def, allConfigs[prayerKey]);
}

function savePrayerAlarmConfig(prayerKey, config) {
  const allConfigs = JSON.parse(localStorage.getItem('hayat_prayer_alarms_data')) || {};

  // منطق "كل الصلوات" (Global Override): تعميم التعديل على الفروض الخمسة واستثناء الجمعة والعيدين
  if (prayerKey === 'All') {
    const dailyPrayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    dailyPrayers.forEach(pk => {
      allConfigs[pk] = Object.assign({}, allConfigs[pk] || {}, config);
    });
  } else {
    allConfigs[prayerKey] = config;
  }

  localStorage.setItem('hayat_prayer_alarms_data', JSON.stringify(allConfigs));
  syncAllAlarmsToHub();
}

// 4. فتح شاشة إعدادات الأذان بصياغ محدد (Contextual Opening)
function openPrayerAlarmSettings(prayerKey) {
  currentActivePrayerAlarmContext = prayerKey;
  updatePrayerAlarmSettingsUI();
  const screen = document.getElementById('screen-prayer-alarm-detail');
  if (screen && typeof showScreen === 'function') {
    showScreen(screen);
  }
}
window.openPrayerAlarmSettings = openPrayerAlarmSettings;

function updatePrayerAlarmSettingsUI() {
  const pk = currentActivePrayerAlarmContext;
  const cfg = getPrayerAlarmConfig(pk);

  const titleSelector = document.getElementById('alarmHeaderContextTitle');
  if (titleSelector) {
    const names = {
      All: 'كل الصلوات (تطبيق شامل)',
      Fajr: 'إشعار صلاة الفجر',
      Sunrise: 'تنبيه الشروق',
      Dhuhr: 'إشعار صلاة الظهر',
      Asr: 'إشعار صلاة العصر',
      Maghrib: 'إشعار صلاة المغرب',
      Isha: 'إشعار صلاة العشاء',
      Friday: 'صلاة الجمعة',
      Eid: 'صلاة العيدين (الفطر والأضحى)'
    };
    titleSelector.textContent = names[pk] || 'إشعار الصلاة';
  }

  // المفتاح الرئيسي
  const masterToggle = document.getElementById('toggleMasterPrayerAlarm');
  if (masterToggle) masterToggle.checked = !!cfg.enabled;

  // تحديد الخلفية النشطة
  document.querySelectorAll('.adhan-bg-card').forEach(c => {
    c.classList.toggle('active', c.getAttribute('data-bg-id') === cfg.bgId);
  });

  // الصوت النشط
  const audioTitle = document.getElementById('currentSelectedAudioName');
  if (audioTitle) {
    if (cfg.audioMode === 'custom') audioTitle.textContent = 'أذان مخصص (من جهازي 📁)';
    else if (cfg.audioMode === 'silent') audioTitle.textContent = 'صامت (بدون صوت)';
    else {
      const m = MUEZZIN_LIST.find(x => x.id === cfg.selectedMuezzinId);
      audioTitle.textContent = m ? m.name : 'أذان مكة المكرمة';
    }
  }

  // الاهتزاز والوضع الهزاز التلقائي
  const vibToggle = document.getElementById('togglePrayerVibration');
  if (vibToggle) vibToggle.checked = !!cfg.vibrationEnabled;

  const autoSilentToggle = document.getElementById('toggleAutoSilentDuringPrayer');
  if (autoSilentToggle) autoSilentToggle.checked = !!cfg.autoSilentPrayer;
}

// 5. مزامنة وعرض مدير التنبيهات المركزي (Alarm Manager Hub)
function syncAllAlarmsToHub() {
  const container = document.getElementById('alarmsCardsStack');
  if (!container) return;
  container.innerHTML = '';

  const activeTab = localStorage.getItem('hayat_alarm_hub_tab') || 'prayers';
  document.querySelectorAll('.alarm-tab-chip').forEach(t => {
    t.classList.toggle('active', t.getAttribute('data-tab') === activeTab);
  });

  if (activeTab === 'prayers') {
    renderPrayerAlarmsList(container);
  } else if (activeTab === 'general') {
    renderGeneralAlarmsList(container);
  } else if (activeTab === 'calendar') {
    renderCalendarAlarmsList(container);
  }
}
window.syncAllAlarmsToHub = syncAllAlarmsToHub;

function renderPrayerAlarmsList(container) {
  const prayers = [
    { key: 'Fajr', name: 'صلاة الفجر' },
    { key: 'Dhuhr', name: 'صلاة الظهر' },
    { key: 'Asr', name: 'صلاة العصر' },
    { key: 'Maghrib', name: 'صلاة المغرب' },
    { key: 'Isha', name: 'صلاة العشاء' },
    { key: 'Friday', name: 'صلاة الجمعة' }
  ];

  prayers.forEach(p => {
    const cfg = getPrayerAlarmConfig(p.key);
    const card = document.createElement('div');
    card.className = 'alarm-card-unit';
    card.innerHTML = `
      <div class="alarm-unit-info" onclick="openPrayerAlarmSettings('${p.key}')" style="cursor: pointer;">
        <h4 class="alarm-unit-title">${p.name}</h4>
        <div class="alarm-unit-meta">
          <span class="badge-alarm-type type-prayer">صلاة</span>
          <span>${cfg.enabled ? 'الأذان مفعّل 🔊' : 'معطّل 🔕'}</span>
        </div>
      </div>
      <label class="ios-switch">
        <input type="checkbox" class="hub-prayer-switch" data-key="${p.key}" ${cfg.enabled ? 'checked' : ''}>
        <span class="switch-slider"></span>
      </label>
    `;

    card.querySelector('.hub-prayer-switch').onchange = (e) => {
      cfg.enabled = e.target.checked;
      savePrayerAlarmConfig(p.key, cfg);
    };

    container.appendChild(card);
  });
}

function renderGeneralAlarmsList(container) {
  const generalAlarms = JSON.parse(localStorage.getItem('hayat_general_alarms_list')) || [
    { id: 'g1', title: 'صلاة الضحى والورد', time: '09:30', enabled: true },
    { id: 'g2', title: 'أذكار المساء وقراءة القرآن', time: '17:00', enabled: true }
  ];

  if (generalAlarms.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-muted);">لا توجد منبهات عامة، اضغط (+) بالأسفل لإضافة منبه.</div>`;
    return;
  }

  generalAlarms.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = 'alarm-card-unit';
    card.innerHTML = `
      <div class="alarm-unit-info">
        <h4 class="alarm-unit-title">${item.title}</h4>
        <div class="alarm-unit-meta">
          <span class="badge-alarm-type type-general">منبه عام</span>
          <span style="font-weight:800; direction:ltr;">${item.time}</span>
        </div>
      </div>
      <label class="ios-switch">
        <input type="checkbox" class="hub-gen-switch" data-idx="${idx}" ${item.enabled ? 'checked' : ''}>
        <span class="switch-slider"></span>
      </label>
    `;

    card.querySelector('.hub-gen-switch').onchange = (e) => {
      generalAlarms[idx].enabled = e.target.checked;
      localStorage.setItem('hayat_general_alarms_list', JSON.stringify(generalAlarms));
    };

    container.appendChild(card);
  });
}

function renderCalendarAlarmsList(container) {
  const calAlarms = JSON.parse(localStorage.getItem('hayat_calendar_alarms_list')) || [];
  if (calAlarms.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-muted);">لا توجد تذكيرات للتقويم حالياً.<br><small style="margin-top:6px; display:block;">💡 اضغط مطولاً على أي يوم في شاشة التقويم لإضافة تذكير خاص به.</small></div>`;
    return;
  }

  calAlarms.forEach((ca, idx) => {
    const card = document.createElement('div');
    card.className = 'alarm-card-unit';
    card.innerHTML = `
      <div class="alarm-unit-info">
        <h4 class="alarm-unit-title">${ca.note || 'مناسبة في التقويم'}</h4>
        <div class="alarm-unit-meta">
          <span class="badge-alarm-type type-calendar">تاريخ: ${ca.dateStr}</span>
          <span>${ca.timeStr || ''}</span>
        </div>
      </div>
      <button type="button" class="modal-btn-link text-muted delete-cal-alarm-btn" data-idx="${idx}">🗑️</button>
    `;

    card.querySelector('.delete-cal-alarm-btn').onclick = () => {
      calAlarms.splice(idx, 1);
      localStorage.setItem('hayat_calendar_alarms_list', JSON.stringify(calAlarms));
      renderCalendarAlarmsList(container);
    };

    container.appendChild(card);
  });
}

// 6. تشغيل شاشة الأذان ملء الشاشة والمعاينة الحية
function triggerAdhanFullScreen(prayerName, prayerTime, customBgUrl = null) {
  const fsView = document.getElementById('screen-adhan-fullscreen');
  if (!fsView) return;

  const bg = customBgUrl || ADHAN_BG_PRESETS[0].url;
  fsView.style.backgroundImage = `url('${bg}')`;

  const pTitle = document.getElementById('adhanFsPrayerTitle');
  const pTime = document.getElementById('adhanFsPrayerTime');

  if (pTitle) pTitle.textContent = `أذان ${prayerName}`;
  if (pTime) pTime.textContent = prayerTime || '';

  fsView.style.display = 'flex';

  // تشغيل الصوت المعتمد
  const cfg = getPrayerAlarmConfig(currentActivePrayerAlarmContext);
  if (cfg.audioMode === 'muezzin') {
    const m = MUEZZIN_LIST.find(x => x.id === cfg.selectedMuezzinId);
    if (m) {
      previewAudioPlayer.src = m.url;
      previewAudioPlayer.play().catch(() => {});
    }
  } else if (cfg.audioMode === 'custom' && cfg.customAudioId) {
    getCustomAudioBlob(cfg.customAudioId).then(blob => {
      if (blob) {
        previewAudioPlayer.src = URL.createObjectURL(blob);
        previewAudioPlayer.play().catch(() => {});
      }
    });
  }
}
window.triggerAdhanFullScreen = triggerAdhanFullScreen;

function closeAdhanFullScreen() {
  const fsView = document.getElementById('screen-adhan-fullscreen');
  if (fsView) fsView.style.display = 'none';
  if (previewAudioPlayer) {
    previewAudioPlayer.pause();
    previewAudioPlayer.currentTime = 0;
  }
}
window.closeAdhanFullScreen = closeAdhanFullScreen;

// 7. تهيئة وربط أحداث الشاشات عند اكتمال الصفحة
document.addEventListener('DOMContentLoaded', () => {
  initAlarmDatabase();

  // تنقل شاشة إعدادات الأذان
  const backFromAlarmDetail = document.getElementById('backFromAlarmDetailBtn');
  if (backFromAlarmDetail) {
    backFromAlarmDetail.onclick = () => {
      if (typeof showScreen === 'function') showScreen(document.getElementById('screen-home'));
    };
  }

  // مفتاح التفعيل الرئيسي
  const masterToggle = document.getElementById('toggleMasterPrayerAlarm');
  if (masterToggle) {
    masterToggle.onchange = (e) => {
      const cfg = getPrayerAlarmConfig(currentActivePrayerAlarmContext);
      cfg.enabled = e.target.checked;
      savePrayerAlarmConfig(currentActivePrayerAlarmContext, cfg);
    };
  }

  // اختيار الخلفية
  document.querySelectorAll('.adhan-bg-card').forEach(card => {
    card.onclick = () => {
      document.querySelectorAll('.adhan-bg-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const bgId = card.getAttribute('data-bg-id');
      const cfg = getPrayerAlarmConfig(currentActivePrayerAlarmContext);
      cfg.bgId = bgId;
      savePrayerAlarmConfig(currentActivePrayerAlarmContext, cfg);
    };
  });

  // نافذة المؤذنين
  const openAudioModalBtn = document.getElementById('openAudioSelectionModalBtn');
  const audioModal = document.getElementById('adhanAudioSelectModal');
  const closeAudioModalBtn = document.getElementById('closeAdhanAudioModalBtn');
  const muezzinContainer = document.getElementById('muezzinListScroll');

  if (openAudioModalBtn && audioModal) {
    openAudioModalBtn.onclick = () => {
      renderMuezzinListUI();
      audioModal.classList.add('show');
    };
  }
  if (closeAudioModalBtn && audioModal) {
    closeAudioModalBtn.onclick = () => {
      previewAudioPlayer.pause();
      audioModal.classList.remove('show');
    };
  }

  function renderMuezzinListUI() {
    if (!muezzinContainer) return;
    muezzinContainer.innerHTML = '';
    const cfg = getPrayerAlarmConfig(currentActivePrayerAlarmContext);

    MUEZZIN_LIST.forEach(m => {
      const isSelected = (cfg.audioMode === 'muezzin' && cfg.selectedMuezzinId === m.id);
      const row = document.createElement('div');
      row.className = `muezzin-card-item ${isSelected ? 'active' : ''}`;
      row.innerHTML = `
        <div class="muezzin-info-group">
          <button type="button" class="btn-preview-audio-play" data-url="${m.url}">▶</button>
          <div>
            <h4 style="font-size:14px; font-weight:800; margin:0;">${m.name}</h4>
            <span style="font-size:11.5px; color:var(--text-secondary);">${m.country}</span>
          </div>
        </div>
        <span class="custom-radio-circle">${isSelected ? '✓' : ''}</span>
      `;

      row.onclick = (e) => {
        if (e.target.closest('.btn-preview-audio-play')) return;
        previewAudioPlayer.pause();
        cfg.audioMode = 'muezzin';
        cfg.selectedMuezzinId = m.id;
        savePrayerAlarmConfig(currentActivePrayerAlarmContext, cfg);
        updatePrayerAlarmSettingsUI();
        audioModal.classList.remove('show');
      };

      const pBtn = row.querySelector('.btn-preview-audio-play');
      pBtn.onclick = (e) => {
        e.stopPropagation();
        if (previewAudioPlayer.src === m.url && !previewAudioPlayer.paused) {
          previewAudioPlayer.pause();
          pBtn.classList.remove('playing');
          pBtn.textContent = '▶';
        } else {
          document.querySelectorAll('.btn-preview-audio-play').forEach(b => {
            b.classList.remove('playing');
            b.textContent = '▶';
          });
          previewAudioPlayer.src = m.url;
          previewAudioPlayer.play().catch(() => {});
          pBtn.classList.add('playing');
          pBtn.textContent = '⏸';
        }
      };

      muezzinContainer.appendChild(row);
    });
  }

  // رفع أذان مخصص من هاتف المستخدم
  const customFileInput = document.getElementById('inputUploadCustomAdhan');
  if (customFileInput) {
    customFileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const fileId = 'custom_audio_' + Date.now();
      await saveCustomAudioBlob(fileId, file, file.name);

      const cfg = getPrayerAlarmConfig(currentActivePrayerAlarmContext);
      cfg.audioMode = 'custom';
      cfg.customAudioId = fileId;
      savePrayerAlarmConfig(currentActivePrayerAlarmContext, cfg);
      updatePrayerAlarmSettingsUI();

      if (audioModal) audioModal.classList.remove('show');
      alert(`✨ تم رفع وتثبيت الأذان (${file.name}) بنجاح وسيعمل أوفلاين للأبد!`);
    };
  }

  // نافذة فحص وتشخيص الصلاحيات
  const openDiagBtn = document.getElementById('openPermissionsDiagBtn');
  const diagModal = document.getElementById('permissionsDiagModal');
  const closeDiagBtn = document.getElementById('closePermissionsDiagBtn');

  if (openDiagBtn && diagModal) {
    openDiagBtn.onclick = () => {
      runSystemPermissionsDiagnostic();
      diagModal.classList.add('show');
    };
  }
  if (closeDiagBtn && diagModal) {
    closeDiagBtn.onclick = () => diagModal.classList.remove('show');
  }

  function runSystemPermissionsDiagnostic() {
    const notifCard = document.getElementById('diagCardNotification');
    const notifBtn = document.getElementById('btnFixNotification');
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        notifCard.className = 'diag-item-card granted';
        notifBtn.style.display = 'none';
      } else {
        notifCard.className = 'diag-item-card missing';
        notifBtn.style.display = 'inline-block';
        notifBtn.onclick = () => Notification.requestPermission().then(() => runSystemPermissionsDiagnostic());
      }
    }
  }

  // القائمة المنسدلة لاختيار الصلاة
  const openContextBtn = document.getElementById('alarmHeaderSelectorBtn');
  const contextModal = document.getElementById('alarmContextModal');
  const closeContextBtn = document.getElementById('closeAlarmContextBtn');

  if (openContextBtn && contextModal) {
    openContextBtn.onclick = () => contextModal.classList.add('show');
  }
  if (closeContextBtn && contextModal) {
    closeContextBtn.onclick = () => contextModal.classList.remove('show');
  }

  document.querySelectorAll('.context-prayer-select-item').forEach(item => {
    item.onclick = () => {
      const key = item.getAttribute('data-context-key');
      currentActivePrayerAlarmContext = key;
      updatePrayerAlarmSettingsUI();
      if (contextModal) contextModal.classList.remove('show');
    };
  });

  // تبويبات مدير التنبيهات
  document.querySelectorAll('.alarm-tab-chip').forEach(tab => {
    tab.onclick = () => {
      const t = tab.getAttribute('data-tab');
      localStorage.setItem('hayat_alarm_hub_tab', t);
      syncAllAlarmsToHub();
    };
  });
});
