// ==================== محرك التخزين الذكي الموحد للأذان (نسخة واحدة بدون تكرار) ====================

const ALHAYAT_AUDIO_DIR = 'AlHayat/Adhan';
const ALARM_DB_NAME = 'HayatAlarmDB';
const ALARM_DB_VERSION = 1;
let alarmDBInstance = null;

// التحقق من إنشاء مجلد AlHayat/Adhan في ذاكرة الهاتف
async function ensureNativeAlHayatFolder() {
  if (!window.Capacitor?.Plugins?.Filesystem) return;
  try {
    await window.Capacitor.Plugins.Filesystem.mkdir({
      path: ALHAYAT_AUDIO_DIR,
      directory: 'DOCUMENTS',
      recursive: true
    });
  } catch (e) {}
}

// 1. تهيئة IndexedDB (للـ PWA والمتصفح فقط)
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

// 2. دالة الحفظ الموحدة (نسخة فيزيائية واحدة في مجلد AlHayat للأندرويد، أو IndexedDB للمتصفح)
async function saveCustomAudioUnified(file) {
  const isAndroidApp = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  const fileId = 'custom_audio_' + Date.now();

  if (isAndroidApp && window.Capacitor?.Plugins?.Filesystem) {
    await ensureNativeAlHayatFolder();

    // قراءة الملف وتحويله لكتابته كملف حقيقي في مجلد AlHayat/Adhan
    const base64Content = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const safeFileName = file.name.replace(/[^a-zA-Z0-9_\u0600-\u06FF\.\-]/g, '_');
    const writeResult = await window.Capacitor.Plugins.Filesystem.writeFile({
      path: `${ALHAYAT_AUDIO_DIR}/${safeFileName}`,
      data: base64Content,
      directory: 'DOCUMENTS',
      recursive: true
    });

    // حفظ سجل بسيط بالمسار في localStorage دون حفظ أي ملف مكرر
    const nativeList = JSON.parse(localStorage.getItem('hayat_native_custom_audios')) || [];
    nativeList.push({ id: fileId, name: file.name, uri: writeResult.uri, fileName: safeFileName });
    localStorage.setItem('hayat_native_custom_audios', JSON.stringify(nativeList));
    return fileId;
  } else {
    // في المتصفح والـ PWA: حفظ نسخة وحيدة في IndexedDB
    const db = await initAlarmDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('custom_audio', 'readwrite');
      tx.objectStore('custom_audio').put({ id: fileId, blob: file, name: file.name, createdAt: Date.now() });
      tx.oncomplete = () => resolve(fileId);
      tx.onerror = () => reject(null);
    });
  }
}

// 3. جلب قائمة الأصوات المخصصة
async function getAllCustomAudios() {
  const isAndroidApp = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  if (isAndroidApp) {
    return JSON.parse(localStorage.getItem('hayat_native_custom_audios')) || [];
  }
  const db = await initAlarmDatabase();
  return new Promise((resolve) => {
    const tx = db.transaction('custom_audio', 'readonly');
    const store = tx.objectStore('custom_audio');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => resolve([]);
  });
}

// 4. حذف الصوت المخصص (حذف فيزيائي حقيقي للملف من مجلد AlHayat في الأندرويد)
async function deleteCustomAudio(id) {
  const isAndroidApp = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  if (isAndroidApp && window.Capacitor?.Plugins?.Filesystem) {
    const nativeList = JSON.parse(localStorage.getItem('hayat_native_custom_audios')) || [];
    const item = nativeList.find(x => x.id === id);
    if (item && item.fileName) {
      try {
        await window.Capacitor.Plugins.Filesystem.deleteFile({
          path: `${ALHAYAT_AUDIO_DIR}/${item.fileName}`,
          directory: 'DOCUMENTS'
        });
      } catch (e) {}
    }
    const filtered = nativeList.filter(x => x.id !== id);
    localStorage.setItem('hayat_native_custom_audios', JSON.stringify(filtered));
    return true;
  } else {
    const db = await initAlarmDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction('custom_audio', 'readwrite');
      tx.objectStore('custom_audio').delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  }
}

// 5. جلب رابط تشغيل الصوت مباشرة (من مجلد الهاتف في الأندرويد أو من الـ Blob في المتصفح)
async function getCustomAudioPlayableSrc(id) {
  const isAndroidApp = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  if (isAndroidApp) {
    const nativeList = JSON.parse(localStorage.getItem('hayat_native_custom_audios')) || [];
    const item = nativeList.find(x => x.id === id);
    if (item && item.uri) {
      if (window.Capacitor && window.Capacitor.convertFileSrc) {
        return window.Capacitor.convertFileSrc(item.uri);
      }
      return item.uri;
    }
    return null;
  } else {
    const db = await initAlarmDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction('custom_audio', 'readonly');
      const req = tx.objectStore('custom_audio').get(id);
      req.onsuccess = () => {
        if (req.result && req.result.blob) {
          resolve(URL.createObjectURL(req.result.blob));
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  }
}

// 2. قائمة أصوات المؤذنين الموسعة (15 مؤذناً بروابط مباشرة)
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

// نغمة إسلامية هادئة ثلاثية النغمات كبديل طوارئ
function playSynthesizedAdhanChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99];
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

// دالة إطلاق إشعار الأذان الرسمي في الخلفية وعلى شاشة القفل
async function triggerBackgroundAdhanNotification(prayerKey, prayerName, prayerTime) {
  const cfg = getPrayerAlarmConfig(prayerKey);
  if (cfg.enabled === false) return;

  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        const vibrationPattern = cfg.vibrationEnabled ? [500, 200, 500, 200, 800, 300, 1000] : [];
        await reg.showNotification(`حان الآن أذان ${prayerName} 🕌`, {
          body: `الله أكبر، الله أكبر.. موعد صلاة ${prayerName} (${prayerTime})`,
          icon: './icon.svg',
          badge: './icon.svg',
          tag: `adhan-notification-${prayerKey}`,
          renotify: true,
          requireInteraction: true,
          silent: !cfg.vibrationEnabled && cfg.audioMode === 'silent',
          vibrate: vibrationPattern,
          data: { prayerKey: prayerKey },
          actions: [
            { action: 'pray_now', title: 'صَلِّ الآن 🕌' },
            { action: 'dismiss', title: 'كتم ✕' }
          ]
        });
      }
    } catch (err) {
      console.warn('تعذر إظهار إشعار الخلفية:', err);
    }
  }

  // تشغيل الصوت في الخلفية مع دعم استمرار الصوت
  if (cfg.audioMode === 'custom' && cfg.customAudioId) {
    getCustomAudioBlob(cfg.customAudioId).then(blob => {
      if (blob) {
        previewAudioPlayer.src = URL.createObjectURL(blob);
        previewAudioPlayer.play().catch(() => {});
      }
    });
  } else if (cfg.audioMode !== 'silent') {
    const m = MUEZZIN_LIST.find(x => x.id === cfg.selectedMuezzinId) || MUEZZIN_LIST[0];
    previewAudioPlayer.src = m.url;
    previewAudioPlayer.play().catch(() => {});
  }
}
window.triggerBackgroundAdhanNotification = triggerBackgroundAdhanNotification;

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

// دالة إظهار الإشعار العائم
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

// دالة تأكيد الحذف عبر المودال المخصص
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
      if (btnConfirm) btnConfirm.onclick = null;
      if (btnCancel) btnCancel.onclick = null;
    };

    if (btnConfirm) {
      btnConfirm.onclick = () => {
        cleanup();
        resolve(true);
      };
    }

    if (btnCancel) {
      btnCancel.onclick = () => {
        cleanup();
        resolve(false);
      };
    }
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
    dismissWithVolume: true,
    dismissWithPower: true,
    dismissWithFlip: true,
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

// 4. مزامنة كروت المنبه المركزي
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
        getAllCustomAudios().then(list => {
          const item = list.find(x => x.id === cfg.customAudioId);
          if (item && item.name) {
            audioTitle.textContent = `📁 ${item.name}`;
          }
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

  const dismissVolToggle = document.getElementById('toggleDismissWithVolumeButtons');
  if (dismissVolToggle) dismissVolToggle.checked = (cfg.dismissWithVolume !== false);

  const dismissPwrToggle = document.getElementById('toggleDismissWithPowerButton');
  if (dismissPwrToggle) dismissPwrToggle.checked = (cfg.dismissWithPower !== false);

  const dismissFlipToggle = document.getElementById('toggleDismissWithFlip');
  if (dismissFlipToggle) dismissFlipToggle.checked = (cfg.dismissWithFlip !== false);

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

window.dismissedPrayers = window.dismissedPrayers || {};
window.activeTriggeredPrayerKey = null;

function triggerAdhanFullScreen(prayerName, prayerTime, customBgUrl = null, isPreview = false, prayerKey = null) {
  const fsView = document.getElementById('screen-adhan-fullscreen');
  if (!fsView) return;

  const targetKey = prayerKey || currentActivePrayerAlarmContext || 'Maghrib';
  const todayKey = new Date().toDateString();
  const dismissalId = `${targetKey}_${todayKey}`;

  // منع فتح الأذان نهائياً إذا كان المستخدم قد أغلقه بقرار منه مسبقاً لهذا اليوم
  if (!isPreview && window.dismissedPrayers[dismissalId]) {
    return;
  }

  const cfg = getPrayerAlarmConfig(targetKey);
  if (!isPreview && cfg.enabled === false) return;

  window.activeTriggeredPrayerKey = targetKey;

  const bg = customBgUrl || (ADHAN_BG_PRESETS.find(x => x.id === cfg.bgId) || ADHAN_BG_PRESETS[0]).url;
  fsView.style.backgroundImage = `url('${bg}')`;

  const pTitle = document.getElementById('adhanFsPrayerTitle');
  const pTime = document.getElementById('adhanFsPrayerTime');
  if (pTitle) pTitle.textContent = `أذان ${prayerName}`;
  if (pTime) pTime.textContent = prayerTime || '';

  fsView.style.display = 'flex';
  window.isAdhanFullScreenActive = true;

  if (cfg.vibrationEnabled && navigator.vibrate) {
    navigator.vibrate([400, 200, 400, 200, 600]);
  }

  if (!isPreview && cfg.respectSilentMode && window.AndroidBridge && typeof window.AndroidBridge.isDeviceSilent === 'function') {
    if (window.AndroidBridge.isDeviceSilent()) return;
  }

  if (cfg.audioMode === 'custom' && cfg.customAudioId) {
    getCustomAudioPlayableSrc(cfg.customAudioId).then(src => {
      if (src) {
        previewAudioPlayer.src = src;
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
  window.isAdhanFullScreenActive = false;

  // تسجيل الإلغاء الصريح لمنع الشاشة من إعادة فتح نفسها لنفس الصلاة
  if (window.activeTriggeredPrayerKey) {
    const todayKey = new Date().toDateString();
    window.dismissedPrayers[`${window.activeTriggeredPrayerKey}_${todayKey}`] = true;
  }

  // كتم وإيقاف الصوت وتفريغه كلياً لضمان عدم استمراره في الخلفية
  if (previewAudioPlayer) {
    previewAudioPlayer.pause();
    previewAudioPlayer.currentTime = 0;
    previewAudioPlayer.src = '';
  }
}
window.closeAdhanFullScreen = closeAdhanFullScreen;

// المحرك المركزي الموحد لإطلاق الأذان لمرة واحدة فقط
function handlePrayerTimeEnter(prayerKey, prayerName, rawTime) {
  const todayKey = new Date().toDateString();
  const eventId = `${prayerKey}_${todayKey}`;

  // منع التشغيل إذا كانت الصلاة قد انطلقت أو أغلقت بالفعل اليوم
  if (window.dismissedPrayers[eventId] || window.lastFiredPrayerId === eventId) {
    return;
  }

  window.lastFiredPrayerId = eventId;
  const pTime12 = (typeof formatTo12Hour === 'function') ? formatTo12Hour(rawTime) : rawTime;

  if (document.visibilityState === 'visible') {
    triggerAdhanFullScreen(prayerName, pTime12, null, false, prayerKey);
  } else {
    const isBgMasterActive = localStorage.getItem('hayat_master_bg_alarms') !== 'false';
    if (isBgMasterActive) {
      triggerBackgroundAdhanNotification(prayerKey, prayerName, pTime12);
    }
  }
}
window.handlePrayerTimeEnter = handlePrayerTimeEnter;

// 1. الاستماع لأزرار الصوت (Volume Up / Down) والأسهم لكتم الأذان
window.addEventListener('keydown', (e) => {
  if (!window.isAdhanFullScreenActive) return;
  const cfg = getPrayerAlarmConfig(currentActivePrayerAlarmContext || 'Maghrib');
  if (cfg.dismissWithVolume === false) return;

  // شمل أزرار الصوت بالجوال وأسهم الكيبورد للفحص بالكمبيوتر
  const volumeKeys = [
    'VolumeUp', 'VolumeDown',
    'AudioVolumeUp', 'AudioVolumeDown', 'AudioVolumeMute',
    'Escape', ' ', 'ArrowUp', 'ArrowDown'
  ];

  if (volumeKeys.includes(e.key)) {
    e.preventDefault();
    closeAdhanFullScreen();
    showAudioFeedbackToast('تم إيقاف الأذان بنجاح ✓', '🔇');
  }
});

// 2. الاستماع لزر الطاقة (إطفاء الشاشة) لكتم الأذان
document.addEventListener('visibilitychange', () => {
  if (!window.isAdhanFullScreenActive) return;
  if (document.visibilityState === 'hidden') {
    const cfg = getPrayerAlarmConfig(currentActivePrayerAlarmContext || 'Maghrib');
    if (cfg.dismissWithPower !== false) {
      closeAdhanFullScreen();
    }
  }
});

// 3. الاستماع لقلب الهاتف على وجهه (Flip to Mute) لكتم وإيقاف الأذان
let isFlipMotionArmed = false;
window.addEventListener('deviceorientation', (e) => {
  if (!window.isAdhanFullScreenActive) {
    isFlipMotionArmed = false;
    return;
  }
  const cfg = getPrayerAlarmConfig(currentActivePrayerAlarmContext || 'Maghrib');
  if (cfg.dismissWithFlip === false) return;

  // تسليح الحساس عندما يكون الهاتف مرفوعاً وشاشته للأعلى أولاً
  if (e.beta !== null && Math.abs(e.beta) < 95) {
    isFlipMotionArmed = true;
  }

  // عند قلب الهاتف لتكون شاشته متجهة لأسفل السطح
  if (isFlipMotionArmed && e.beta !== null && Math.abs(e.beta) > 135) {
    isFlipMotionArmed = false;
    closeAdhanFullScreen();
    if (navigator.vibrate) navigator.vibrate([70, 40, 70]);
    showAudioFeedbackToast('تم إيقاف الأذان بقلب الهاتف ✓', '📳');
  }
});

// 4. دعم أزرار سماعات الرأس وسماعات البلوتوث (MediaSession)
if ('mediaSession' in navigator) {
  navigator.mediaSession.setActionHandler('pause', () => {
    if (window.isAdhanFullScreenActive) closeAdhanFullScreen();
  });
  navigator.mediaSession.setActionHandler('stop', () => {
    if (window.isAdhanFullScreenActive) closeAdhanFullScreen();
  });
}

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

  // فتح وإغلاق نافذة اختيار الصوت والمؤذنين
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

  // بناء القائمة (الأصوات المرفوعة أولاً + المؤذنون الـ 15)
  async function renderMuezzinListUI() {
    if (!muezzinContainer) return;
    muezzinContainer.innerHTML = '';
    const cfg = getPrayerAlarmConfig(currentActivePrayerAlarmContext);

    // 1. الأصوات المرفوعة من جهاز المستخدم
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

        row.onclick = (e) => {
          if (e.target.closest('.btn-preview-audio-play') || e.target.closest('.btn-delete-custom-audio')) return;
          stopPreviewAudio();
          cfg.audioMode = 'custom';
          cfg.customAudioId = item.id;
          savePrayerAlarmConfig(currentActivePrayerAlarmContext, cfg);
          updatePrayerAlarmSettingsUI();
          audioModal.classList.remove('show');
        };

        const pBtn = row.querySelector('.btn-preview-audio-play');
        pBtn.onclick = async (e) => {
          e.stopPropagation();
          if (currentPlayingCustomId === item.id && !previewAudioPlayer.paused) {
            stopPreviewAudio();
          } else {
            stopPreviewAudio();
            const src = await getCustomAudioPlayableSrc(item.id);
            if (src) {
              currentPlayingCustomId = item.id;
              previewAudioPlayer.src = src;
              previewAudioPlayer.play().catch(() => playSynthesizedAdhanChime());
              pBtn.classList.add('playing');
              pBtn.textContent = '⏸';
            }
          }
        };

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

      const divider = document.createElement('div');
      divider.style.cssText = 'font-size: 12px; font-weight: 800; color: var(--text-secondary); padding: 8px 6px 2px 6px; display: flex; align-items: center; gap: 6px;';
      divider.innerHTML = '<span>🕌</span><span>أصوات مشاهير المؤذنين:</span>';
      muezzinContainer.appendChild(divider);
    }

    // 2. المؤذنون الـ 15 المعتمدون
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
        stopPreviewAudio();
        cfg.audioMode = 'muezzin';
        cfg.selectedMuezzinId = m.id;
        cfg.customAudioId = null;
        savePrayerAlarmConfig(currentActivePrayerAlarmContext, cfg);
        updatePrayerAlarmSettingsUI();
        audioModal.classList.remove('show');
      };

      const pBtn = row.querySelector('.btn-preview-audio-play');
      pBtn.onclick = (e) => {
        e.stopPropagation();
        if (currentPlayingPreviewUrl === m.url && !previewAudioPlayer.paused) {
          stopPreviewAudio();
        } else {
          stopPreviewAudio();
          currentPlayingPreviewUrl = m.url;
          previewAudioPlayer.src = m.url;
          previewAudioPlayer.play().catch((err) => {
            console.warn('Playback restricted or offline:', err);
            stopPreviewAudio();
            playSynthesizedAdhanChime();
          });
          pBtn.classList.add('playing');
          pBtn.textContent = '⏸';
        }
      };

      muezzinContainer.appendChild(row);
    });
  }

  // رفع أذان مخصص وحفظه كنسخة واحدة في مجلد AlHayat بالهاتف
  const customFileInput = document.getElementById('inputUploadCustomAdhan');
  if (customFileInput) {
    customFileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const fileId = await saveCustomAudioUnified(file);

      const cfg = getPrayerAlarmConfig(currentActivePrayerAlarmContext);
      cfg.audioMode = 'custom';
      cfg.customAudioId = fileId;
      savePrayerAlarmConfig(currentActivePrayerAlarmContext, cfg);
      updatePrayerAlarmSettingsUI();

      await renderMuezzinListUI();
      customFileInput.value = '';
      showAudioFeedbackToast(`تم حفظ "${file.name}" في مجلد AlHayat بالجهاز ✨`, '📁');
    };
  }

  // المعاينة الحية للأذان التفاعلية الحية بالكامل
  const btnPreviewLive = document.getElementById('btnPreviewAdhanLiveScreen');
  if (btnPreviewLive) {
    btnPreviewLive.onclick = () => {
      const ctxKey = currentActivePrayerAlarmContext || 'Maghrib';
      const prayerNamesDict = {
        All: 'المغرب',
        Fajr: 'الفجر',
        Sunrise: 'الشروق',
        Dhuhr: 'الظهر',
        Asr: 'العصر',
        Maghrib: 'المغرب',
        Isha: 'العشاء',
        Friday: 'صلاة الجمعة',
        Eid: 'صلاة العيد'
      };

      const pName = prayerNamesDict[ctxKey] || 'المغرب';
      const timingLookup = (ctxKey === 'All' || ctxKey === 'Friday' || ctxKey === 'Eid') ? 'Maghrib' : ctxKey;
      
      let pTime = '05:38 م';
      if (typeof currentTimings !== 'undefined' && currentTimings && currentTimings[timingLookup]) {
        pTime = (typeof formatTo12Hour === 'function') ? formatTo12Hour(currentTimings[timingLookup]) : currentTimings[timingLookup];
      }

      // تشغيل المعاينة الحية لكافة عناصر الصلاة الحالية
      triggerAdhanFullScreen(pName, pTime, null, true);

      // إشعار لطيف يوضح للمستخدم كيفية اختبار الأزرار
      showAudioFeedbackToast('💡 جرّب الآن إيقاف الأذان بزر خفض الصوت أو قفل الشاشة', '🔔');
    };
  }

  // التحكم بالهزاز التلقائي
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

  const toggleDismissVol = document.getElementById('toggleDismissWithVolumeButtons');
  if (toggleDismissVol) {
    toggleDismissVol.onchange = (e) => {
      const cfg = getPrayerAlarmConfig(currentActivePrayerAlarmContext);
      cfg.dismissWithVolume = e.target.checked;
      savePrayerAlarmConfig(currentActivePrayerAlarmContext, cfg);
    };
  }

  const toggleDismissPwr = document.getElementById('toggleDismissWithPowerButton');
  if (toggleDismissPwr) {
    toggleDismissPwr.onchange = (e) => {
      const cfg = getPrayerAlarmConfig(currentActivePrayerAlarmContext);
      cfg.dismissWithPower = e.target.checked;
      savePrayerAlarmConfig(currentActivePrayerAlarmContext, cfg);
    };
  }

  const toggleDismissFlip = document.getElementById('toggleDismissWithFlip');
  if (toggleDismissFlip) {
    toggleDismissFlip.onchange = (e) => {
      const cfg = getPrayerAlarmConfig(currentActivePrayerAlarmContext);
      cfg.dismissWithFlip = e.target.checked;
      savePrayerAlarmConfig(currentActivePrayerAlarmContext, cfg);
    };
  }

  // التنبيهات المسبقة
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
        if (notifCard) {
          notifCard.className = 'diag-item-card granted';
          const badge = notifCard.querySelector('.diag-status-badge');
          if (badge) badge.textContent = 'مفعل ✓';
        }
        if (notifBtn) notifBtn.style.display = 'none';
      } else {
        if (notifCard) {
          notifCard.className = 'diag-item-card missing';
          const badge = notifCard.querySelector('.diag-status-badge');
          if (badge) badge.textContent = 'غير مفعل ⚠️';
        }
        if (notifBtn) {
          notifBtn.style.display = 'inline-block';
          notifBtn.onclick = async () => {
            const res = await Notification.requestPermission();
            runSystemPermissionsDiagnostic();
            if (res === 'granted') {
              showAudioFeedbackToast('تم تفعيل إشعارات وأذان شاشة القفل بنجاح ✨', '🔔');
            }
          };
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

  // المنبهات العامة
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

  // تبويبات المنبه
  document.querySelectorAll('.alarm-tab-chip').forEach(tab => {
    tab.onclick = () => {
      const t = tab.getAttribute('data-tab');
      localStorage.setItem('hayat_alarm_hub_tab', t);
      syncAllAlarmsToHub();
    };
  });

  // تذكيرات التقويم
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
      showAudioFeedbackToast('تم حفظ التذكير في التقويم والمنبه ✨', '📅');
    };
  }

 // الاستماع لرسالة النقر على الإشعار من شاشة القفل لفتح الأذان
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'OPEN_ADHAN_SCREEN') {
        const pk = event.data.prayerKey || currentActivePrayerAlarmContext || 'Maghrib';
        const pNames = { Fajr: 'الفجر', Sunrise: 'الشروق', Dhuhr: 'الظهر', Asr: 'العصر', Maghrib: 'المغرب', Isha: 'العشاء' };
        const curT = (typeof currentTimings !== 'undefined' && currentTimings && currentTimings[pk]) ? formatTo12Hour(currentTimings[pk]) : '';
        triggerAdhanFullScreen(pNames[pk] || 'الصلاة', curT);
      }
    });
  }

 // ==================== محرك الجدولة الأصلية المسبقة للأندرويد (Native Background Alarms) ====================
async function scheduleNativeAndroidAlarms() {
  const isAndroidApp = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  if (!isAndroidApp || !window.Capacitor.Plugins.LocalNotifications) return;

  try {
    // 1. طلب صلاحية الإشعارات الدقيقة من نظام الأندرويد
    const perm = await window.Capacitor.Plugins.LocalNotifications.requestPermissions();
    if (perm.display !== 'granted') return;

    // 2. إنشاء قناة إشعارات عالية الأولوية تجبر الأندرويد على إضاءة الشاشة وتشغيل الصوت
    await window.Capacitor.Plugins.LocalNotifications.createChannel({
      id: 'prayer_channel_high',
      name: 'تنبيهات مواقيت الصلاة والأذان',
      description: 'إشعارات عالية الأولوية لأوقات الصلوات في موعدها',
      importance: 5, // 5 = أقصى درجات الأهمية (Heads-up notification)
      visibility: 1, // تظهر فوق شاشة القفل
      sound: 'beep.wav',
      vibration: true,
      lights: true,
      lightColor: '#10B981'
    });

    // 3. مسح أي جدولة قديمة لتفادي التكرار عند تغيير المدينة أو الوقت
    const pending = await window.Capacitor.Plugins.LocalNotifications.getPending();
    if (pending && pending.notifications && pending.notifications.length > 0) {
      await window.Capacitor.Plugins.LocalNotifications.cancel(pending);
    }

    // 4. جلب بيانات الموقع والإعدادات الحالية
    const loc = JSON.parse(localStorage.getItem('hayat_saved_location')) || { lat: 21.4225, lng: 39.8262, method: 4, asrMadhab: 0, tz: 3 };
    const tz = loc.timezoneOffset || (loc.lng > 40 ? 3 : 2);
    const method = loc.method || 4;
    const asrMadhab = loc.asrMadhab || 0;
    const offsets = loc.prayerOffsets || {};

    const prayersList = [
      { key: 'Fajr', name: 'الفجر', idOffset: 1 },
      { key: 'Dhuhr', name: 'الظهر', idOffset: 2 },
      { key: 'Asr', name: 'العصر', idOffset: 3 },
      { key: 'Maghrib', name: 'المغرب', idOffset: 4 },
      { key: 'Isha', name: 'العشاء', idOffset: 5 }
    ];

    const notificationsToSchedule = [];
    const now = new Date();

    // 5. جدولة الصلوات لـ 7 أيام قادمة في قلب نظام الأندرويد
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + dayOffset);
      
      // جلب دالة الحساب الفلكي المتاحة الآن في النطاق العام
      const calcFn = window.calculateLocalSolarTimings || (typeof calculateLocalSolarTimings === 'function' ? calculateLocalSolarTimings : null);
      const dayTimings = calcFn ? calcFn(targetDate, loc.lat, loc.lng, tz, method, asrMadhab, offsets) : null;

      if (!dayTimings) continue;

      prayersList.forEach(p => {
        const cfg = getPrayerAlarmConfig(p.key);
        if (cfg.enabled === false) return;

        const timeStr = dayTimings[p.key];
        if (!timeStr) return;

        const [hStr, mStr] = timeStr.split(':');
        const alarmDate = new Date(targetDate);
        alarmDate.setHours(parseInt(hStr, 10), parseInt(mStr, 10), 0, 0);

        if (alarmDate > now) {
          const dayOfYear = Math.floor((alarmDate - new Date(alarmDate.getFullYear(), 0, 0)) / 86400000);
          const uniqueId = parseInt(`${dayOfYear}${p.idOffset}`);

          const fmtTimeFn = window.formatTo12Hour || (typeof formatTo12Hour === 'function' ? formatTo12Hour : (t) => t);
          const timeFormatted = fmtTimeFn(timeStr);

          notificationsToSchedule.push({
            id: uniqueId,
            title: `حان الآن أذان ${p.name} 🕌`,
            body: `الله أكبر، الله أكبر.. موعد صلاة ${p.name} (${timeFormatted})`,
            channelId: 'prayer_channel_high',
            schedule: { at: alarmDate, allowWhileIdle: true },
            actionTypeId: 'PRAYER_ACTIONS',
            extra: { prayerKey: p.key, prayerName: p.name, rawTime: timeStr }
          });
        }
      });
    }

    // 6. تسجيل أزرار الإشعار التفاعلية (صل الآن / كتم)
    await window.Capacitor.Plugins.LocalNotifications.registerActionTypes({
      types: [
        {
          id: 'PRAYER_ACTIONS',
          actions: [
            { id: 'pray_now', title: 'صَلِّ الآن 🕌', foreground: true },
            { id: 'dismiss', title: 'كتم ✕', destructive: true }
          ]
        }
      ]
    });

    // 7. تسليم الجدولة لنظام الأندرويد
    if (notificationsToSchedule.length > 0) {
      await window.Capacitor.Plugins.LocalNotifications.schedule({ notifications: notificationsToSchedule });
      console.log(`✓ تم بنجاح جدولة ${notificationsToSchedule.length} صلاة في نظام الأندرويد.`);
    }

  } catch (err) {
    console.warn('Native scheduling error:', err);
  }
}
window.scheduleNativeAndroidAlarms = scheduleNativeAndroidAlarms;

// ==================== التقاط الإشعارات والفحص المباشر ====================

  // 1. التقاط حدث الضغط على الإشعار من شاشة قفل الأندرويد لفتح شاشة الأذان
  const isAndroidApp = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  if (isAndroidApp && window.Capacitor.Plugins.LocalNotifications) {
    window.Capacitor.Plugins.LocalNotifications.addListener('localNotificationActionPerformed', (notificationAction) => {
      if (notificationAction.actionId === 'dismiss') return;

      const data = notificationAction.notification.extra;
      if (data && data.prayerKey) {
        const fmtFn = window.formatTo12Hour || (typeof formatTo12Hour === 'function' ? formatTo12Hour : (t) => t);
        const pTime12 = fmtFn(data.rawTime);
        if (typeof triggerAdhanFullScreen === 'function') {
          triggerAdhanFullScreen(data.prayerName, pTime12, null, false, data.prayerKey);
        }
      }
    });
  }

  // 2. محرك المراقبة الحي (يعمل فقط عندما يكون التطبيق مفتوحاً أمام المستخدم)
  setInterval(() => {
    if (typeof window.currentTimings === 'undefined' || !window.currentTimings) return;
    if (document.visibilityState !== 'visible') return;

    const now = new Date();
    const curHour = String(now.getHours()).padStart(2, '0');
    const curMin = String(now.getMinutes()).padStart(2, '0');
    const curTimeFormatted = `${curHour}:${curMin}`;

    const prayerKeysList = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    const pNamesDict = { Fajr: 'الفجر', Dhuhr: 'الظهر', Asr: 'العصر', Maghrib: 'المغرب', Isha: 'العشاء' };

    prayerKeysList.forEach(pk => {
      const pRawTime = window.currentTimings[pk] ? window.currentTimings[pk].split(' ')[0] : '';
      if (pRawTime === curTimeFormatted) {
        if (typeof window.handlePrayerTimeEnter === 'function') {
          window.handlePrayerTimeEnter(pk, pNamesDict[pk], pRawTime);
        }
      }
    });
  }, 10000);

  // المزامنة الأولية والجدولة عند الإقلاع
  syncAllAlarmsToHub();
  runSystemPermissionsDiagnostic();
  if (isAndroidApp) {
    scheduleNativeAndroidAlarms();
  }
});
