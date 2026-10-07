// ==================== محرك التنبيهات، الأذان، و IndexedDB المتقدم ====================

const ALARM_DB_NAME = 'HayatAlarmDB';
const ALARM_DB_VERSION = 1;
let alarmDBInstance = null;

// 1. فتح وتهيئة مستودع IndexedDB للأوفلاين الدائم
function initAlarmDatabase() {
  return new Promise((resolve, reject) => {
    if (alarmDBInstance) return resolve(alarmDBInstance);
    const req = indexedDB.open(ALARM_DB_NAME, ALARM_DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('custom_audio')) db.createObjectStore('custom_audio', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('user_alarms')) db.createObjectStore('user_alarms', { keyPath: 'id' });
    };
    req.onsuccess = (e) => {
      alarmDBInstance = e.target.result;
      resolve(alarmDBInstance);
    };
    req.onerror = () => reject('Failed to open Alarm IndexedDB');
  });
}

async function saveCustomAudioBlob(id, fileBlob, fileName) {
  const db = await initAlarmDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('custom_audio', 'readwrite');
    tx.objectStore('custom_audio').put({ id, blob: fileBlob, name: fileName, createdAt: Date.now() });
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(false);
  });
}

async function getCustomAudioBlob(id) {
  const db = await initAlarmDatabase();
  return new Promise((resolve) => {
    const tx = db.transaction('custom_audio', 'readonly');
    const req = tx.objectStore('custom_audio').get(id);
    req.onsuccess = () => resolve(req.result ? req.result.blob : null);
    req.onerror = () => resolve(null);
  });
}

// دوال استرجاع وحذف الأصوات المرفوعة من IndexedDB
async function getAllCustomAudios() {
  const db = await initAlarmDatabase();
  return new Promise((resolve) => {
    const tx = db.transaction('custom_audio', 'readonly');
    const store = tx.objectStore('custom_audio');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => resolve([]);
  });
}

async function deleteCustomAudio(id) {
  const db = await initAlarmDatabase();
  return new Promise((resolve) => {
    const tx = db.transaction('custom_audio', 'readwrite');
    tx.objectStore('custom_audio').delete(id);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => resolve(false);
  });
}

// 2. قائمة أصوات المؤذنين الموسعة (15 مؤذناً مع روابط سريعة وموثوقة)
const MUEZZIN_LIST = [
  { id: 'makkah', name: 'أذان الحرم المكي (الشيخ علي ملا)', country: 'مكة المكرمة 🇸🇦', url: 'https://www.islamcan.com/audio/adhan/azan1.mp3' },
  { id: 'madinah', name: 'أذان المسجد النبوي الشريف', country: 'المدينة المنورة 🇸🇦', url: 'https://www.islamcan.com/audio/adhan/azan2.mp3' },
  { id: 'aqsa', name: 'أذان المسجد الأقصى المبارك', country: 'القدس الشريف 🇵🇸', url: 'https://www.islamcan.com/audio/adhan/azan3.mp3' },
  { id: 'alafasy', name: 'أذان الشيخ مشاري راشد العفاسي', country: 'الكويت 🇰🇼', url: 'https://www.islamcan.com/audio/adhan/azan7.mp3' },
  { id: 'abdulbasit', name: 'أذان الشيخ عبد الباسط عبد الصمد', country: 'مصر 🇪🇬', url: 'https://www.islamcan.com/audio/adhan/azan6.mp3' },
  { id: 'egypt', name: 'أذان مصر (إذاعة القرآن الكريم)', country: 'القاهرة 🇪🇬', url: 'https://www.islamcan.com/audio/adhan/azan4.mp3' },
  { id: 'turkey', name: 'أذان إسطنبول (النمط العثماني)', country: 'تركيا 🇹🇷', url: 'https://www.islamcan.com/audio/adhan/azan5.mp3' },
  { id: 'mansoor', name: 'أذان الشيخ منصور الزهراني', country: 'السعودية 🇸🇦', url: 'https://www.islamcan.com/audio/adhan/azan8.mp3' },
  { id: 'qatami', name: 'أذان الشيخ ناصر القطامي', country: 'الرياض 🇸🇦', url: 'https://www.islamcan.com/audio/adhan/azan9.mp3' },
  { id: 'nafees', name: 'أذان الشيخ أحمد النفيس', country: 'الكويت 🇰🇼', url: 'https://www.islamcan.com/audio/adhan/azan10.mp3' },
  { id: 'hussary', name: 'أذان الشيخ محمود خليل الحصري', country: 'مصر 🇪🇬', url: 'https://www.islamcan.com/audio/adhan/azan11.mp3' },
  { id: 'rifat', name: 'أذان الشيخ محمد رفعت التراثي', country: 'مصر 🇪🇬', url: 'https://www.islamcan.com/audio/adhan/azan12.mp3' },
  { id: 'fajr_makkah', name: 'أذان الفجر (الصلاة خير من النوم)', country: 'الحرم المكي 🇸🇦', url: 'https://www.islamcan.com/audio/adhan/azan13.mp3' },
  { id: 'yemen', name: 'أذان الجامع الكبير بصنعاء', country: 'اليمن 🇾🇪', url: 'https://www.islamcan.com/audio/adhan/azan15.mp3' },
  { id: 'dubai', name: 'أذان دبي الموحد', country: 'الإمارات 🇦🇪', url: 'https://www.islamcan.com/audio/adhan/azan16.mp3' }
];

const ADHAN_BG_PRESETS = [
  { id: 'bg1', url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80', title: 'جامع الشيخ زايد' },
  { id: 'bg2', url: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=800&q=80', title: 'الكعبة المشرفة' },
  { id: 'bg3', url: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=800&q=80', title: 'المسجد النبوي الشريف' },
  { id: 'bg4', url: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=800&q=80', title: 'محراب وقبة المسجد' }
];

let currentActivePrayerAlarmContext = 'Maghrib';
let previewAudioPlayer = new Audio();
let currentPlayingPreviewUrl = null;
let currentPlayingCustomId = null;

// نغمة إسلامية هادئة ثلاثية النغمات بدلاً من صوت صفارة الإنذار
function playSynthesizedAdhanChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99]; // نغمات C5, E5, G5 الهادئة
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + (idx * 0.25));
      gain.gain.setValueAtTime(0, ctx.currentTime + (idx * 0.25));
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + (idx * 0.25) + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (idx * 0.25) + 0.9);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + (idx * 0.25));
      osc.stop(ctx.currentTime + (idx * 0.25) + 0.9);
    });
  } catch(e) {}
}

function stopPreviewAudio() {
  if (previewAudioPlayer) {
    previewAudioPlayer.pause();
    previewAudioPlayer.currentTime = 0;
  }
  currentPlayingPreviewUrl = null;
  currentPlayingCustomId = null;
  document.querySelectorAll('.btn-preview-audio-play').forEach(b => {
    b.classList.remove('playing');
    b.textContent = '▶';
  });
}

// دالة إظهار الإشعار العائم الاحترافي
function showAudioFeedbackToast(message, icon = '✨') {
  const toast = document.getElementById('audioActionToast');
  const msgEl = document.getElementById('audioToastMessage');
  const iconEl = document.getElementById('audioToastIcon');
  if (!toast || !msgEl) return;

  msgEl.textContent = message;
  if (iconEl) iconEl.textContent = icon;
  toast.classList.add('show');

  clearTimeout(toast.dismissTimer);
  toast.dismissTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

// دالة تأكيد الحذف عبر المودال المخصص بدلاً من confirm النظام
function requestDeleteAudioConfirmation(fileName) {
  return new Promise((resolve) => {
    const modal = document.getElementById('deleteAudioConfirmModal');
    const desc = document.getElementById('deleteAudioModalDesc');
    const btnConfirm = document.getElementById('btnConfirmDeleteAudio');
    const btnCancel = document.getElementById('btnCancelDeleteAudio');

    if (!modal) return resolve(false);

    if (desc) {
      desc.innerHTML = `هل أنت متأكد من حذف ملف "<strong>${fileName}</strong>" من ذاكرة جهازك؟ لن يؤثر ذلك على أصوات المؤذنين المدمجة.`;
    }

    modal.classList.add('show');

    const cleanup = () => {
      modal.classList.remove('show');
      btnConfirm.onclick = null;
      btnCancel.onclick = null;
    };

    btnConfirm.onclick = () => {
      cleanup();
      resolve(true);
    };

    btnCancel.onclick = () => {
      cleanup();
      resolve(false);
    };
  });
}  

// 3. قراءة وحفظ إعدادات الصلاة
function getPrayerAlarmConfig(prayerKey) {
  const allConfigs = JSON.parse(localStorage.getItem('hayat_prayer_alarms_data')) || {};
  const def = {
    enabled: true,
    bgId: 'bg1',
    audioMode: 'muezzin',
    selectedMuezzinId: 'makkah',
    customAudioId: null,
    vibrationEnabled: true,
    autoSilentPrayer: true,
    autoSilentStartOffset: '0',
    autoSilentBufferMins: 15,
    respectSilentMode: true,
    preAlarms: []
  };
  return Object.assign({}, def, allConfigs[prayerKey]);
}

function savePrayerAlarmConfig(prayerKey, config) {
  const allConfigs = JSON.parse(localStorage.getItem('hayat_prayer_alarms_data')) || {};
  if (prayerKey === 'All') {
    ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].forEach(pk => {
      allConfigs[pk] = Object.assign({}, allConfigs[pk] || {}, config);
    });
  } else {
    allConfigs[prayerKey] = config;
  }
  localStorage.setItem('hayat_prayer_alarms_data', JSON.stringify(allConfigs));
  syncAllAlarmsToHub();
}

// 4. دوال مزامنة كروت المنبه المركزي (معرفة في النطاق العام لتفادي أي ReferenceError)
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
    container.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-muted); font-size:13.5px;">لا توجد منبهات عامة.<br><small style="margin-top:6px; display:block;">اضغط زر (+) بالأسفل لإنشاء منبه جديد.</small></div>`;
    return;
  }

  generalAlarms.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = 'alarm-card-unit';
    card.innerHTML = `
      <div class="alarm-unit-info" onclick="openEditGeneralAlarmModal(${idx})" style="cursor: pointer;">
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
    container.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-muted); font-size:13px;">لا توجد تذكيرات للتقويم حالياً.<br><small style="margin-top:6px; display:block;">💡 اضغط مطولاً على أي يوم في شاشة التقويم لإضافة تذكير خاص به.</small></div>`;
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
          <span style="font-weight:700;">${ca.timeStr || ''}</span>
        </div>
      </div>
      <button type="button" class="modal-btn-link text-muted delete-cal-alarm-btn" data-idx="${idx}" style="color:#EF4444; font-size:16px;">🗑️</button>
    `;

    card.querySelector('.delete-cal-alarm-btn').onclick = () => {
      calAlarms.splice(idx, 1);
      localStorage.setItem('hayat_calendar_alarms_list', JSON.stringify(calAlarms));
      renderCalendarAlarmsList(container);
    };

    container.appendChild(card);
  });
}

// 5. فتح وضبط واجهة إعدادات أذان الصلاة
function openPrayerAlarmSettings(prayerKey) {
  currentActivePrayerAlarmContext = prayerKey;
  updatePrayerAlarmSettingsUI();
  const screen = document.getElementById('screen-prayer-alarm-detail');
  if (screen) {
    if (typeof window.showScreen === 'function') window.showScreen(screen);
    else if (typeof showScreen === 'function') showScreen(screen);
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
      Friday: 'صلاة الجمعة (خاصة)',
      Eid: 'صلاة العيدين'
    };
    titleSelector.textContent = names[pk] || 'إشعار الصلاة';
  }

  const masterToggle = document.getElementById('toggleMasterPrayerAlarm');
  if (masterToggle) masterToggle.checked = !!cfg.enabled;

  document.querySelectorAll('.adhan-bg-card').forEach(c => {
    c.classList.toggle('active', c.getAttribute('data-bg-id') === cfg.bgId);
  });

  const audioTitle = document.getElementById('currentSelectedAudioName');
  if (audioTitle) {
    if (cfg.audioMode === 'custom') {
      audioTitle.textContent = 'أذان مخصص (من جهازي 📁)';
      if (cfg.customAudioId) {
        initAlarmDatabase().then(db => {
          const tx = db.transaction('custom_audio', 'readonly');
          const req = tx.objectStore('custom_audio').get(cfg.customAudioId);
          req.onsuccess = () => {
            if (req.result && req.result.name) {
              audioTitle.textContent = `📁 ${req.result.name}`;
            }
          };
        });
      }
    } else if (cfg.audioMode === 'silent') {
      audioTitle.textContent = 'صامت (بدون صوت)';
    } else {
      const m = MUEZZIN_LIST.find(x => x.id === cfg.selectedMuezzinId);
      audioTitle.textContent = m ? m.name : 'أذان الحرم المكي (الشيخ علي ملا)';
    }
  }

  const vibToggle = document.getElementById('togglePrayerVibration');
  if (vibToggle) vibToggle.checked = !!cfg.vibrationEnabled;

  const autoSilentToggle = document.getElementById('toggleAutoSilentDuringPrayer');
  if (autoSilentToggle) autoSilentToggle.checked = !!cfg.autoSilentPrayer;

  const respectSilentToggle = document.getElementById('toggleRespectDeviceSilent');
  if (respectSilentToggle) respectSilentToggle.checked = (cfg.respectSilentMode !== false);

  const silentBufferDisp = document.getElementById('displaySilentBufferMins');
  if (silentBufferDisp) silentBufferDisp.textContent = `بعد الإقامة بـ ${cfg.autoSilentBufferMins || 15} د`;

  const silentStartSelect = document.getElementById('selectAutoSilentStartOffset');
  if (silentStartSelect) silentStartSelect.value = cfg.autoSilentStartOffset || '0';

  renderPreAlarmsListUI();
}

function renderPreAlarmsListUI() {
  const container = document.getElementById('prayerPreAlarmsListContainer');
  if (!container) return;
  container.innerHTML = '';
  const cfg = getPrayerAlarmConfig(currentActivePrayerAlarmContext);

  if (!cfg.preAlarms || cfg.preAlarms.length === 0) {
    container.innerHTML = `<span style="font-size:12px; color:var(--text-muted); text-align:center; padding:6px 0;">لا توجد تنبيهات مخصصة لهذه الصلاة بعد.</span>`;
    return;
  }

  cfg.preAlarms.forEach((a, idx) => {
    const card = document.createElement('div');
    card.className = 'pre-alarm-card-item';
    const posText = a.position === 'before' ? 'قبل' : 'بعد';
    card.innerHTML = `
      <span>🔔 تنبيه ${posText} الصلاة بـ ${a.minutes} دقيقة</span>
      <button type="button" class="modal-btn-link text-muted delete-pre-alarm-btn" data-idx="${idx}" style="color:#EF4444; font-size:14px; font-weight:800;">✕</button>
    `;
    card.querySelector('.delete-pre-alarm-btn').onclick = () => {
      cfg.preAlarms.splice(idx, 1);
      savePrayerAlarmConfig(currentActivePrayerAlarmContext, cfg);
      renderPreAlarmsListUI();
    };
    container.appendChild(card);
  });
}

// 6. تشغيل شاشة الأذان الكاملة ملء الشاشة والمعاينة
function triggerAdhanFullScreen(prayerName, prayerTime, customBgUrl = null) {
  const fsView = document.getElementById('screen-adhan-fullscreen');
  if (!fsView) return;

  const cfg = getPrayerAlarmConfig(currentActivePrayerAlarmContext || 'Maghrib');
  if (cfg.enabled === false) return;

  const bg = customBgUrl || (ADHAN_BG_PRESETS.find(x => x.id === cfg.bgId) || ADHAN_BG_PRESETS[0]).url;
  fsView.style.backgroundImage = `url('${bg}')`;

  const pTitle = document.getElementById('adhanFsPrayerTitle');
  const pTime = document.getElementById('adhanFsPrayerTime');
  if (pTitle) pTitle.textContent = `أذان ${prayerName}`;
  if (pTime) pTime.textContent = prayerTime || '';

  fsView.style.display = 'flex';

  if (cfg.vibrationEnabled && navigator.vibrate) {
    navigator.vibrate([400, 200, 400, 200, 600]);
  }

  if (cfg.respectSilentMode && window.AndroidBridge && typeof window.AndroidBridge.isDeviceSilent === 'function') {
    if (window.AndroidBridge.isDeviceSilent()) return;
  }

  if (cfg.audioMode === 'custom' && cfg.customAudioId) {
    getCustomAudioBlob(cfg.customAudioId).then(blob => {
      if (blob) {
        previewAudioPlayer.src = URL.createObjectURL(blob);
        previewAudioPlayer.play().catch(() => playSynthesizedAdhanChime());
      } else {
        playSynthesizedAdhanChime();
      }
    });
  } else if (cfg.audioMode !== 'silent') {
    const m = MUEZZIN_LIST.find(x => x.id === cfg.selectedMuezzinId) || MUEZZIN_LIST[0];
    previewAudioPlayer.src = m.url;
    previewAudioPlayer.play().catch(() => {
      console.warn('Audio link restricted, playing fallback chime');
      playSynthesizedAdhanChime();
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

// 7. ربط وتفعيل الأحداث بالكامل داخل DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  initAlarmDatabase();

  const backFromAlarmDetail = document.getElementById('backFromAlarmDetailBtn');
  if (backFromAlarmDetail) {
    backFromAlarmDetail.onclick = () => {
      const homeScreen = document.getElementById('screen-home');
      if (typeof window.showScreen === 'function') window.showScreen(homeScreen);
      else if (typeof showScreen === 'function') showScreen(homeScreen);
    };
  }

  const masterToggle = document.getElementById('toggleMasterPrayerAlarm');
  if (masterToggle) {
    masterToggle.onchange = (e) => {
      const cfg = getPrayerAlarmConfig(currentActivePrayerAlarmContext);
      cfg.enabled = e.target.checked;
      savePrayerAlarmConfig(currentActivePrayerAlarmContext, cfg);
    };
  }

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

  // فتح نافذة اختيار الصوت والمؤذنين
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
      stopPreviewAudio();
      audioModal.classList.remove('show');
    };
  }

  // دالة بناء القائمة الشاملة (الأصوات المرفوعة محلياً أولاً + المؤذنون الـ 15)
  async function renderMuezzinListUI() {
    if (!muezzinContainer) return;
    muezzinContainer.innerHTML = '';
    const cfg = getPrayerAlarmConfig(currentActivePrayerAlarmContext);

    // 1. استخراج وعرض الأصوات المرفوعة من جهاز المستخدم داخل IndexedDB
    const userCustomAudios = await getAllCustomAudios();
    if (userCustomAudios && userCustomAudios.length > 0) {
      const customHeader = document.createElement('div');
      customHeader.style.cssText = 'font-size: 12px; font-weight: 800; color: #15803D; padding: 4px 6px; display: flex; align-items: center; gap: 6px;';
      customHeader.innerHTML = '<span>📁</span><span>الأصوات المرفوعة من جهازك:</span>';
      muezzinContainer.appendChild(customHeader);

      userCustomAudios.forEach(item => {
        const isSelected = (cfg.audioMode === 'custom' && cfg.customAudioId === item.id);
        const row = document.createElement('div');
        row.className = `muezzin-card-item ${isSelected ? 'active' : ''}`;
        row.style.cssText = isSelected ? 'border-color: #16A34A; background: #F0FDF4;' : 'border-color: #BBF7D0; background: #F8FAFC;';
        row.innerHTML = `
          <div class="muezzin-info-group">
            <button type="button" class="btn-preview-audio-play" data-custom-id="${item.id}">▶</button>
            <div style="flex: 1; min-width: 0;">
              <h4 style="font-size:14px; font-weight:800; margin:0; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${item.name || 'أذان مخصص'}</h4>
              <span style="font-size:11px; color:#15803D; font-weight:700;">ملف محلي في جهازك (أوفلاين 100%)</span>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <button type="button" class="btn-delete-custom-audio" title="حذف هذا الأذان" style="background:none; border:none; color:#EF4444; font-size:15px; cursor:pointer; padding:4px;">🗑️</button>
            <span class="custom-radio-circle">${isSelected ? '✓' : ''}</span>
          </div>
        `;

        // اختيار هذا الصوت للأذان
        row.onclick = (e) => {
          if (e.target.closest('.btn-preview-audio-play') || e.target.closest('.btn-delete-custom-audio')) return;
          stopPreviewAudio();
          cfg.audioMode = 'custom';
          cfg.customAudioId = item.id;
          savePrayerAlarmConfig(currentActivePrayerAlarmContext, cfg);
          updatePrayerAlarmSettingsUI();
          audioModal.classList.remove('show');
        };

        // معاينة الصوت المرفوع محلياً
        const pBtn = row.querySelector('.btn-preview-audio-play');
        pBtn.onclick = async (e) => {
          e.stopPropagation();
          if (currentPlayingCustomId === item.id && !previewAudioPlayer.paused) {
            stopPreviewAudio();
          } else {
            stopPreviewAudio();
            const blob = await getCustomAudioBlob(item.id);
            if (blob) {
              currentPlayingCustomId = item.id;
              previewAudioPlayer.src = URL.createObjectURL(blob);
              previewAudioPlayer.play().catch(() => playSynthesizedAdhanChime());
              pBtn.classList.add('playing');
              pBtn.textContent = '⏸';
            }
          }
        };

        // حذف الملف من قاعدة البيانات بالمودال الاحترافي
        const dBtn = row.querySelector('.btn-delete-custom-audio');
        dBtn.onclick = async (e) => {
          e.stopPropagation();
          const isConfirmed = await requestDeleteAudioConfirmation(item.name || 'هذا الأذان');
          if (isConfirmed) {
            stopPreviewAudio();
            await deleteCustomAudio(item.id);
            if (cfg.customAudioId === item.id) {
              cfg.audioMode = 'muezzin';
              cfg.customAudioId = null;
              savePrayerAlarmConfig(currentActivePrayerAlarmContext, cfg);
              updatePrayerAlarmSettingsUI();
            }
            renderMuezzinListUI();
            showAudioFeedbackToast(`تم حذف ملف "${item.name}" بنجاح`, '🗑️');
          }
        };

        muezzinContainer.appendChild(row);
      });

      // معالجة رفع أذان مخصص من هاتف المستخدم وتحديث القائمة فورياً مع الإشعار الاحترافي
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

      // إعادة رسم القائمة فوراً لتظهر الأيقونة والملف المرفوع أمام المستخدم
      await renderMuezzinListUI();
      customFileInput.value = '';
      showAudioFeedbackToast(`تم حفظ "${file.name}" بنجاح ويعمل بدون إنترنت ✨`, '✨');
    };
  }

  // المعاينة الحية للأذان
  const btnPreviewLive = document.getElementById('btnPreviewAdhanLiveScreen');
  if (btnPreviewLive) {
    btnPreviewLive.onclick = () => {
      const curTime = (typeof currentTimings !== 'undefined' && currentTimings.Maghrib) ? formatTo12Hour(currentTimings.Maghrib) : '5:38 م';
      triggerAdhanFullScreen('المغرب', curTime);
    };
  }

  // التحكم بـ خانتي الهزاز التلقائي
  const btnIncBuffer = document.getElementById('btnIncSilentBuffer');
  const btnDecBuffer = document.getElementById('btnDecSilentBuffer');
  const bufferDisp = document.getElementById('displaySilentBufferMins');
  const selectStartOffset = document.getElementById('selectAutoSilentStartOffset');
  const toggleRespectSilent = document.getElementById('toggleRespectDeviceSilent');

  if (btnIncBuffer) {
    btnIncBuffer.onclick = () => {
      const cfg = getPrayerAlarmConfig(currentActivePrayerAlarmContext);
      cfg.autoSilentBufferMins = Math.min(45, (cfg.autoSilentBufferMins || 15) + 5);
      savePrayerAlarmConfig(currentActivePrayerAlarmContext, cfg);
      if (bufferDisp) bufferDisp.textContent = `بعد الإقامة بـ ${cfg.autoSilentBufferMins} د`;
    };
  }
  if (btnDecBuffer) {
    btnDecBuffer.onclick = () => {
      const cfg = getPrayerAlarmConfig(currentActivePrayerAlarmContext);
      cfg.autoSilentBufferMins = Math.max(5, (cfg.autoSilentBufferMins || 15) - 5);
      savePrayerAlarmConfig(currentActivePrayerAlarmContext, cfg);
      if (bufferDisp) bufferDisp.textContent = `بعد الإقامة بـ ${cfg.autoSilentBufferMins} د`;
    };
  }
  if (selectStartOffset) {
    selectStartOffset.onchange = (e) => {
      const cfg = getPrayerAlarmConfig(currentActivePrayerAlarmContext);
      cfg.autoSilentStartOffset = e.target.value;
      savePrayerAlarmConfig(currentActivePrayerAlarmContext, cfg);
    };
  }
  if (toggleRespectSilent) {
    toggleRespectSilent.onchange = (e) => {
      const cfg = getPrayerAlarmConfig(currentActivePrayerAlarmContext);
      cfg.respectSilentMode = e.target.checked;
      savePrayerAlarmConfig(currentActivePrayerAlarmContext, cfg);
    };
  }

  // نافذة التنبيهات المسبقة للصلاة
  const openPreModalBtn = document.getElementById('openAddPreAlarmModalBtn');
  const preModal = document.getElementById('prayerPrePostAlarmModal');
  const closePreModalBtn = document.getElementById('closePrePostModalBtn');
  const btnCancelPreAlarm = document.getElementById('btnCancelPreAlarm');
  const btnSavePreAlarm = document.getElementById('btnSavePreAlarm');

  if (openPreModalBtn && preModal) openPreModalBtn.onclick = () => preModal.classList.add('show');
  if (closePreModalBtn && preModal) closePreModalBtn.onclick = () => preModal.classList.remove('show');
  if (btnCancelPreAlarm && preModal) btnCancelPreAlarm.onclick = () => preModal.classList.remove('show');

  if (btnSavePreAlarm && preModal) {
    btnSavePreAlarm.onclick = () => {
      const pos = document.getElementById('selectPreAlarmPosition').value;
      const mins = parseInt(document.getElementById('inputPreAlarmMinutes').value, 10) || 15;
      const tone = document.getElementById('selectPreAlarmTone').value;
      const vib = document.getElementById('togglePreAlarmVibrate').checked;

      const cfg = getPrayerAlarmConfig(currentActivePrayerAlarmContext);
      if (!cfg.preAlarms) cfg.preAlarms = [];
      cfg.preAlarms.push({ id: 'pa_' + Date.now(), position: pos, minutes: mins, tone, vibrate: vib });

      savePrayerAlarmConfig(currentActivePrayerAlarmContext, cfg);
      renderPreAlarmsListUI();
      preModal.classList.remove('show');
    };
  }

  // تشخيص الصلاحيات
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
        if (notifCard) notifCard.className = 'diag-item-card granted';
        if (notifBtn) notifBtn.style.display = 'none';
      } else {
        if (notifCard) notifCard.className = 'diag-item-card missing';
        if (notifBtn) {
          notifBtn.style.display = 'inline-block';
          notifBtn.onclick = () => Notification.requestPermission().then(() => runSystemPermissionsDiagnostic());
        }
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

  // إدارة المنبهات العامة (+) والتعديل
  const openGenFabBtn = document.getElementById('openAddGeneralAlarmFabBtn');
  const genModal = document.getElementById('generalAlarmModal');
  const closeGenModalBtn = document.getElementById('closeGeneralAlarmModalBtn');
  const btnSaveGen = document.getElementById('btnSaveGeneralAlarm');
  const btnDeleteGen = document.getElementById('btnDeleteGeneralAlarm');
  let editingGeneralAlarmIdx = null;

  if (openGenFabBtn && genModal) {
    openGenFabBtn.onclick = () => {
      editingGeneralAlarmIdx = null;
      document.getElementById('generalAlarmModalTitle').textContent = 'إضافة منبه عام';
      document.getElementById('inputGeneralAlarmTitle').value = '';
      document.getElementById('inputGeneralAlarmTime').value = '06:00';
      if (btnDeleteGen) btnDeleteGen.style.display = 'none';
      genModal.classList.add('show');
    };
  }
  if (closeGenModalBtn && genModal) closeGenModalBtn.onclick = () => genModal.classList.remove('show');

  window.openEditGeneralAlarmModal = (idx) => {
    const list = JSON.parse(localStorage.getItem('hayat_general_alarms_list')) || [];
    const item = list[idx];
    if (!item) return;
    editingGeneralAlarmIdx = idx;
    document.getElementById('generalAlarmModalTitle').textContent = 'تعديل المنبه العام';
    document.getElementById('inputGeneralAlarmTitle').value = item.title;
    document.getElementById('inputGeneralAlarmTime').value = item.time;
    if (btnDeleteGen) btnDeleteGen.style.display = 'inline-block';
    if (genModal) genModal.classList.add('show');
  };

  if (btnSaveGen && genModal) {
    btnSaveGen.onclick = () => {
      const title = document.getElementById('inputGeneralAlarmTitle').value.trim() || 'منبه عام';
      const time = document.getElementById('inputGeneralAlarmTime').value || '06:00';
      const list = JSON.parse(localStorage.getItem('hayat_general_alarms_list')) || [];

      if (editingGeneralAlarmIdx !== null) {
        list[editingGeneralAlarmIdx] = { ...list[editingGeneralAlarmIdx], title, time };
      } else {
        list.push({ id: 'g_' + Date.now(), title, time, enabled: true });
      }

      localStorage.setItem('hayat_general_alarms_list', JSON.stringify(list));
      genModal.classList.remove('show');
      syncAllAlarmsToHub();
    };
  }

  if (btnDeleteGen && genModal) {
    btnDeleteGen.onclick = () => {
      if (editingGeneralAlarmIdx === null) return;
      const list = JSON.parse(localStorage.getItem('hayat_general_alarms_list')) || [];
      list.splice(editingGeneralAlarmIdx, 1);
      localStorage.setItem('hayat_general_alarms_list', JSON.stringify(list));
      genModal.classList.remove('show');
      syncAllAlarmsToHub();
    };
  }

  // تبويبات مدير التنبيهات
  document.querySelectorAll('.alarm-tab-chip').forEach(tab => {
    tab.onclick = () => {
      const t = tab.getAttribute('data-tab');
      localStorage.setItem('hayat_alarm_hub_tab', t);
      syncAllAlarmsToHub();
    };
  });

  // تذكير التقويم
  const calModal = document.getElementById('calendarAlarmModal');
  const closeCalModalBtn = document.getElementById('closeCalAlarmModalBtn');
  const btnCancelCalAlarm = document.getElementById('btnCancelCalAlarm');
  const btnSaveCalAlarm = document.getElementById('btnSaveCalAlarm');

  if (closeCalModalBtn && calModal) closeCalModalBtn.onclick = () => calModal.classList.remove('show');
  if (btnCancelCalAlarm && calModal) btnCancelCalAlarm.onclick = () => calModal.classList.remove('show');

  window.openCalendarDayAlarmModal = (dateStr) => {
    document.getElementById('calAlarmDateLabel').textContent = dateStr;
    document.getElementById('inputCalAlarmNote').value = '';
    if (calModal) calModal.classList.add('show');
  };

  if (btnSaveCalAlarm && calModal) {
    btnSaveCalAlarm.onclick = () => {
      const note = document.getElementById('inputCalAlarmNote').value.trim() || 'مناسبة في التقويم';
      const timeStr = document.getElementById('inputCalAlarmTime').value || '09:00';
      const advanceDays = document.getElementById('selectCalAlarmAdvanceDays').value;
      const dateStr = document.getElementById('calAlarmDateLabel').textContent;

      const list = JSON.parse(localStorage.getItem('hayat_calendar_alarms_list')) || [];
      list.push({ id: 'cal_' + Date.now(), note, timeStr, dateStr, advanceDays });
      localStorage.setItem('hayat_calendar_alarms_list', JSON.stringify(list));

      calModal.classList.remove('show');
      syncAllAlarmsToHub();
      alert('✨ تم حفظ التذكير وسيظهر في تبويب تذكيرات التقويم بالمنبه!');
    };
  }

  // المزامنة الأولية عند الإقلاع
  syncAllAlarmsToHub();
});
