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
  const generalAlarms = JSON.parse(localStorage.getItem('hayat_general_alarms_list')) || [];

  if (generalAlarms.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:35px 20px; color:var(--text-muted); font-size:13.5px;">لا توجد منبهات مضافة حالياً.<br><small style="margin-top:8px; display:block; color:var(--primary-blue); font-weight:700;">اضغط زر (+) بالأسفل لإضافة منبه جوال حقيقي بصوتك المفضل.</small></div>`;
    return;
  }

  const dayNamesMap = { 0: 'أحد', 1: 'اثنين', 2: 'ثلاثاء', 3: 'أربعاء', 4: 'خميس', 5: 'جمعة', 6: 'سبت' };

  generalAlarms.forEach((item, idx) => {
    let repeatText = 'مرة واحدة';
    if (Array.isArray(item.days)) {
      if (item.days.length === 7) repeatText = 'يومياً';
      else if (item.days.length === 5 && [0,1,2,3,4].every(d => item.days.includes(d))) repeatText = 'أيام العمل';
      else if (item.days.length > 0) repeatText = item.days.map(d => dayNamesMap[d]).join('، ');
    }

    const fmtTime = (typeof formatTo12Hour === 'function') ? formatTo12Hour(item.time) : item.time;
    const soundTitle = (item.sound && item.sound.name) ? item.sound.name.split(' ')[0] : 'نغمة';

    const card = document.createElement('div');
    card.className = 'alarm-card-unit';
    card.innerHTML = `
      <div class="alarm-unit-info" onclick="openEditGeneralAlarmModal(${idx})" style="cursor: pointer;">
        <h4 class="alarm-unit-title">${item.title || 'منبه'}</h4>
        <div class="alarm-unit-meta">
          <span class="badge-alarm-type type-general" style="font-weight:900; font-size:12px; color:var(--primary-blue); direction:ltr;">${fmtTime}</span>
          <span>📅 ${repeatText}</span>
          <span>🎵 ${soundTitle}</span>
        </div>
      </div>
      <label class="ios-switch">
        <input type="checkbox" class="hub-gen-switch" data-idx="${idx}" ${item.enabled !== false ? 'checked' : ''}>
        <span class="switch-slider"></span>
      </label>
    `;

    card.querySelector('.hub-gen-switch').onchange = (e) => {
      const isChecked = e.target.checked;
      generalAlarms[idx].enabled = isChecked;
      localStorage.setItem('hayat_general_alarms_list', JSON.stringify(generalAlarms));

      // الجدولة أو الإلغاء الفوري في عتاد الأندرويد
      if (isChecked) {
        scheduleAlarmInNativeAndroid(generalAlarms[idx]);
        showAudioFeedbackToast('تم تفعيل وجدولة المنبه في هاتفك ✓', '⏰');
      } else {
        cancelAlarmInNativeAndroid(generalAlarms[idx].id);
        showAudioFeedbackToast('تم تعطيل المنبه بنجاح 🔕', '✓');
      }
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

      row.onclick = async (e) => {
        if (e.target.closest('.btn-preview-audio-play')) return;
        stopPreviewAudio();
        cfg.audioMode = 'muezzin';
        cfg.selectedMuezzinId = m.id;
        cfg.customAudioId = null;
        savePrayerAlarmConfig(currentActivePrayerAlarmContext, cfg);
        updatePrayerAlarmSettingsUI();
        audioModal.classList.remove('show');

        // تنزيل وحفظ مقطع المؤذن في مجلد AlHayat بالهاتف ليعمل بدون نت
        const isApp = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
        if (isApp && window.Capacitor?.Plugins?.Filesystem) {
          try {
            await ensureNativeAlHayatFolder();
            const fileName = `muezzin_${m.id}.mp3`;
            const check = await window.Capacitor.Plugins.Filesystem.stat({
              path: `${ALHAYAT_AUDIO_DIR}/${fileName}`,
              directory: 'DOCUMENTS'
            }).catch(() => null);

            if (!check) {
              // التحقق من توفر الإنترنت قبل محاولة تنزيل صوت المؤذن
              if (typeof window.ensureOnlineWithModal === 'function' && !window.ensureOnlineWithModal()) {
                return;
              }

              const res = await fetch(m.url);
              const blob = await res.blob();
              const reader = new FileReader();
              reader.onloadend = async () => {
                const base64 = reader.result.split(',')[1];
                await window.Capacitor.Plugins.Filesystem.writeFile({
                  path: `${ALHAYAT_AUDIO_DIR}/${fileName}`,
                  data: base64,
                  directory: 'DOCUMENTS',
                  recursive: true
                });
              };
              reader.readAsDataURL(blob);
            }
          } catch(err) {}
        }
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

  // فتح وإدارة نافذة أذونات وصلاحيات التطبيق الشاملة
  const openDiagBtn = document.getElementById('openPermissionsDiagBtn');
  const openPermFromSettings = document.getElementById('openPermissionsFromSettingsBtn');
  const diagModal = document.getElementById('permissionsDiagModal');
  const closeDiagBtn = document.getElementById('closePermissionsDiagBtn');
  const confirmClosePermBtn = document.getElementById('btnConfirmClosePermissionsModal');

  function openAndDiagnosePermissions() {
    if (!diagModal) return;
    runSystemPermissionsDiagnostic();
    diagModal.classList.add('show');
  }

  if (openDiagBtn) openDiagBtn.onclick = openAndDiagnosePermissions;
  if (openPermFromSettings) openPermFromSettings.onclick = openAndDiagnosePermissions;

  if (closeDiagBtn && diagModal) {
    closeDiagBtn.onclick = () => diagModal.classList.remove('show');
  }
  if (confirmClosePermBtn && diagModal) {
const refreshPermBtn = document.getElementById('btnRefreshPermissionsDiagnostic');

  if (closeDiagBtn && diagModal) {
    closeDiagBtn.onclick = () => diagModal.classList.remove('show');
  }
  if (refreshPermBtn) {
    refreshPermBtn.onclick = () => {
      refreshPermBtn.textContent = 'جاري الفحص... ⏳';
      runSystemPermissionsDiagnostic().then(() => {
        setTimeout(() => {
          refreshPermBtn.textContent = '🔄 إعادة فحص الصلاحيات';
        }, 500);
      });
    };
  }
  }

  // محرك التحقق الشامل من أذونات وصلاحيات التطبيق الست
  async function runSystemPermissionsDiagnostic() {
    const isApp = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());

    // دالة مساعدة لتحديث مظهر البطاقة
    function updateCardStatus(cardId, badgeId, btnId, isGranted, fixCallback) {
      const card = document.getElementById(cardId);
      const badge = document.getElementById(badgeId);
      const btn = document.getElementById(btnId);
      if (!card || !badge || !btn) return;

      if (isGranted) {
        card.className = 'diag-unified-card status-granted';
        badge.className = 'diag-unified-badge badge-active';
        badge.textContent = 'مفعل ✓';
        badge.style.display = 'inline-block';
        btn.style.display = 'none';
      } else {
        card.className = 'diag-unified-card status-missing';
        badge.className = 'diag-unified-badge badge-warn';
        badge.textContent = 'غير مفعل ⚠️';
        badge.style.display = 'none'; // نخفي الشارة ونبرز زر الإصلاح
        btn.style.display = 'inline-block';
        btn.onclick = fixCallback;
      }
    }

    // 1. فحص إذن الإشعارات
    let isNotifGranted = false;
    if ('Notification' in window) {
      isNotifGranted = (Notification.permission === 'granted');
    }
    if (isApp && window.Capacitor?.Plugins?.LocalNotifications) {
      try {
        const p = await window.Capacitor.Plugins.LocalNotifications.checkPermissions();
        isNotifGranted = (p.display === 'granted');
      } catch(e) {}
    }
    updateCardStatus('diagCardNotification', 'badgeNotification', 'btnFixNotification', isNotifGranted, async () => {
      if (isApp && window.Capacitor?.Plugins?.LocalNotifications) {
        const res = await window.Capacitor.Plugins.LocalNotifications.requestPermissions();
        if (res.display === 'granted') {
          showAudioFeedbackToast('تم تفعيل أذونات الإشعارات بنجاح ✓', '🔔');
        } else {
          openNativeAppSettings();
        }
      } else if ('Notification' in window) {
        const res = await Notification.requestPermission();
        if (res === 'granted') showAudioFeedbackToast('تم تفعيل الإشعارات بنجاح ✓', '🔔');
      }
      runSystemPermissionsDiagnostic();
    });

    // 2. فحص صلاحية الموقع الجغرافي (GPS) بدقة عبر أندرويد والويب
    let isLocGranted = false;
    if (isApp && window.AndroidBridge && typeof window.AndroidBridge.isLocationGranted === 'function') {
      // فحص أندرويد الأصلي الحقيقي المباشر
      isLocGranted = window.AndroidBridge.isLocationGranted();
    } else {
      // فحص بيئة الويب والـ PWA
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const q = await navigator.permissions.query({ name: 'geolocation' });
          isLocGranted = (q.state === 'granted');
        }
      } catch(e) {}
    }

    updateCardStatus('diagCardLocation', 'badgeLocation', 'btnFixLocation', isLocGranted, () => {
      if (isApp) {
        openNativeAppSettings();
      } else {
        const autoBtn = document.getElementById('autoDetectLocationBtn');
        if (autoBtn) autoBtn.click();
      }
      setTimeout(runSystemPermissionsDiagnostic, 1000);
    });

    // 3. المنبهات الدقيقة (خاصة بهواتف الأندرويد)
    if (isApp) {
      const isExactGranted = localStorage.getItem('hayat_exact_alarm_granted') !== 'false';
      updateCardStatus('diagCardExactAlarm', 'badgeExactAlarm', 'btnFixExactAlarm', isExactGranted, () => {
        openNativeAppSettings('android.settings.REQUEST_SCHEDULE_EXACT_ALARM');
      });

      // 4. تحسين البطارية (غير مقيّد)
      const isBatteryOk = localStorage.getItem('hayat_battery_unrestricted') === 'true';
      updateCardStatus('diagCardBattery', 'badgeBattery', 'btnFixBattery', isBatteryOk, () => {
        localStorage.setItem('hayat_battery_unrestricted', 'true');
        openNativeAppSettings('android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS');
        setTimeout(runSystemPermissionsDiagnostic, 1000);
      });

      // 5. الظهور فوق التطبيقات والمسبحة العائمة (فحص أندرويد الفعلي الحي)
      let isOverlayOk = false;
      if (isApp && window.AndroidBridge && typeof window.AndroidBridge.hasOverlayPermission === 'function') {
        isOverlayOk = window.AndroidBridge.hasOverlayPermission();
      } else {
        isOverlayOk = localStorage.getItem('hayat_overlay_granted') === 'true';
      }

      updateCardStatus('diagCardOverlay', 'badgeOverlay', 'btnFixOverlay', isOverlayOk, () => {
        if (isApp && window.AndroidBridge && typeof window.AndroidBridge.requestOverlayPermission === 'function') {
          window.AndroidBridge.requestOverlayPermission();
        } else {
          openNativeAppSettings('android.settings.action.MANAGE_OVERLAY_PERMISSION');
        }
        setTimeout(runSystemPermissionsDiagnostic, 1200);
      });

      // 6. التشغيل التلقائي (Autostart)
      const isAutostartOk = localStorage.getItem('hayat_autostart_granted') === 'true';
      updateCardStatus('diagCardAutostart', 'badgeAutostart', 'btnFixAutostart', isAutostartOk, () => {
        localStorage.setItem('hayat_autostart_granted', 'true');
        openNativeAppSettings();
        setTimeout(runSystemPermissionsDiagnostic, 1000);
      });
    } else {
      // إخفاء الصلاحيات الخاصة بالأندرويد لمستخدمي المتصفح والـ PWA
      ['diagCardExactAlarm', 'diagCardBattery', 'diagCardOverlay', 'diagCardAutostart'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
      });
    }
  }

  // دالة مساعدة لفتح صفحة إعدادات التطبيق في الأندرويد
  function openNativeAppSettings(customAction = null) {
    if (window.AndroidBridge && typeof window.AndroidBridge.openAppSettings === 'function') {
      window.AndroidBridge.openAppSettings();
      return;
    }
    try {
      if (customAction) {
        window.location.href = `intent:#Intent;action=${customAction};end`;
      } else {
        window.location.href = 'intent:#Intent;action=android.settings.APPLICATION_DETAILS_SETTINGS;package=com.alhayat.app;end';
      }
    } catch(e) {
      alert('يرجى الدخول إلى إعدادات الهاتف > التطبيقات > الحياة الطيبة لتفعيل الصلاحية.');
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

    // ==================== محرك منبه الجوال الحقيقي والجدولة الذكية ====================
  let editingGeneralAlarmIdx = null;
  let tempAlarmDays = []; // مصفوفة الأيام المختارة (0: الأحد ... 6: السبت)
  let selectedAlarmSound = { id: 'default', name: 'نغمة المنبه الافتراضية 🔔', path: '' };

  // قائمة نغمات وأصوات المنبه المحققة مع تصحيح رابط تكبيرات العيد
  const GENERAL_ALARM_TONES = [
    { id: 'default', name: 'نغمة منبه الجوال الافتراضية 🔔', url: '', isSystem: true },
    { id: 'takbeer', name: 'تكبيرات العيد المباركة 🕌', url: 'https://ia801503.us.archive.org/15/items/TakbeeratAlEid/Takbeerat_Al_Eid.mp3' },
    { id: 'alafasy', name: 'أذان الشيخ مشاري العفاسي 🎙️', url: 'https://www.islamcan.com/audio/adhan/azan7.mp3' },
    { id: 'fajr_makkah', name: 'أذان الحرم المكي الشريف 🕋', url: 'https://www.islamcan.com/audio/adhan/azan1.mp3' },
    { id: 'madinah', name: 'أذان المسجد النبوي الشريف 🕌', url: 'https://www.islamcan.com/audio/adhan/azan2.mp3' },
    { id: 'abdulbasit', name: 'أذان الشيخ عبد الباسط عبد الصمد 🎙️', url: 'https://www.islamcan.com/audio/adhan/azan6.mp3' },
    { id: 'mansoor', name: 'أذان الشيخ منصور الزهراني 🎙️', url: 'https://www.islamcan.com/audio/adhan/azan8.mp3' }
  ];

  // حساب موعد الرنين القادم بدقة بالمللي ثانية
  function calculateNextAlarmTriggerMillis(timeStr, daysArray) {
    const parts = (timeStr || '05:00').split(':').map(Number);
    const targetH = parts[0];
    const targetM = parts[1];
    const now = new Date();

    if (!daysArray || daysArray.length === 0) {
      const candidate = new Date(now);
      candidate.setHours(targetH, targetM, 0, 0);
      if (candidate.getTime() > now.getTime()) {
        return candidate.getTime();
      }
      candidate.setDate(candidate.getDate() + 1);
      return candidate.getTime();
    }

    for (let offset = 0; offset < 7; offset++) {
      const candidate = new Date(now);
      candidate.setDate(candidate.getDate() + offset);
      candidate.setHours(targetH, targetM, 0, 0);

      const dayOfWeek = candidate.getDay();
      if (daysArray.includes(dayOfWeek)) {
        if (candidate.getTime() > now.getTime()) {
          return candidate.getTime();
        }
      }
    }

    const fallback = new Date(now);
    fallback.setDate(fallback.getDate() + 7);
    fallback.setHours(targetH, targetM, 0, 0);
    return fallback.getTime();
  }

  // جدولة المنبه الفعلي في نظام الأندرويد
  function scheduleAlarmInNativeAndroid(alarmItem) {
    if (!alarmItem || alarmItem.enabled === false) return;
    const triggerMillis = calculateNextAlarmTriggerMillis(alarmItem.time, alarmItem.days);

    if (window.AndroidBridge && typeof window.AndroidBridge.scheduleGeneralAlarm === 'function') {
      window.AndroidBridge.scheduleGeneralAlarm(
        alarmItem.id,
        triggerMillis,
        alarmItem.title || 'منبه الحياة الطيبة',
        alarmItem.soundPath || '',
        alarmItem.vibrate !== false
      );
    }
  }

  // إلغاء المنبه من نظام الأندرويد
  function cancelAlarmInNativeAndroid(alarmId) {
    if (window.AndroidBridge && typeof window.AndroidBridge.cancelGeneralAlarm === 'function') {
      window.AndroidBridge.cancelGeneralAlarm(alarmId);
    }
  }

  // تحديث شكل أزرار الأيام
  function updateAlarmDaysUI() {
    document.querySelectorAll('.alarm-day-chip').forEach(chip => {
      const dayNum = parseInt(chip.getAttribute('data-day'), 10);
      chip.classList.toggle('active', tempAlarmDays.includes(dayNum));
    });

    const isEveryday = tempAlarmDays.length === 7;
    const isWorkdays = tempAlarmDays.length === 5 && [0,1,2,3,4].every(d => tempAlarmDays.includes(d));
    const isOnce = tempAlarmDays.length === 0;

    const pEvery = document.getElementById('presetDaysEveryday');
    const pWork = document.getElementById('presetDaysWorkdays');
    const pOnce = document.getElementById('presetDaysOnce');
    if (pEvery) pEvery.classList.toggle('active', isEveryday);
    if (pWork) pWork.classList.toggle('active', isWorkdays);
    if (pOnce) pOnce.classList.toggle('active', isOnce);
  }

  // بناء قائمة اختيار نغمات وأصوات المنبه المتكاملة
  let isSystemPreviewPlaying = false;

  async function renderAlarmSoundsList() {
    const soundListContainer = document.getElementById('generalAlarmSoundListContainer');
    const soundModal = document.getElementById('generalAlarmSoundModal');
    const displaySoundName = document.getElementById('displayGeneralAlarmSoundName');
    if (!soundListContainer) return;
    soundListContainer.innerHTML = '';

    // 1. النغمات والأصوات المرفوعة من هاتف المستخدم
    const userCustoms = await getAllCustomAudios();
    if (userCustoms && userCustoms.length > 0) {
      const header = document.createElement('div');
      header.style.cssText = 'font-size:12px; font-weight:800; color:#15803D; padding:4px 6px;';
      header.textContent = '📁 نغمات مخصصة من هاتفك:';
      soundListContainer.appendChild(header);

      userCustoms.forEach(c => {
        const isSel = (selectedAlarmSound.id === c.id);
        const row = document.createElement('div');
        row.className = `muezzin-card-item ${isSel ? 'active' : ''}`;
        row.innerHTML = `
          <div class="muezzin-info-group">
            <button type="button" class="btn-preview-audio-play" data-custom-id="${c.id}">▶</button>
            <div style="flex:1; min-width:0;">
              <h4 style="font-size:14px; font-weight:800; margin:0; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${c.name}</h4>
              <span style="font-size:11px; color:#15803D;">ملف صوتي محلي بجهازك</span>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <button type="button" class="btn-delete-custom-alarm-tone" title="حذف النغمة" style="background:none; border:none; color:#EF4444; font-size:15px; cursor:pointer; padding:4px;">🗑️</button>
            <span class="custom-radio-circle">${isSel ? '✓' : ''}</span>
          </div>
        `;

        row.onclick = (e) => {
          if (e.target.closest('.btn-preview-audio-play') || e.target.closest('.btn-delete-custom-alarm-tone')) return;
          stopPreviewAudio();
          if (window.AndroidBridge && typeof window.AndroidBridge.stopPreviewSystemAlarm === 'function') {
            window.AndroidBridge.stopPreviewSystemAlarm();
          }
          selectedAlarmSound = { id: c.id, name: c.name, path: c.uri || '' };
          if (displaySoundName) displaySoundName.textContent = c.name;
          if (soundModal) soundModal.classList.remove('show');
        };

        const pBtn = row.querySelector('.btn-preview-audio-play');
        pBtn.onclick = async (e) => {
          e.stopPropagation();
          stopPreviewAudio();
          const src = await getCustomAudioPlayableSrc(c.id);
          if (src) {
            previewAudioPlayer.src = src;
            previewAudioPlayer.play().catch(() => {});
            pBtn.textContent = '⏸';
            pBtn.classList.add('playing');
          }
        };

        const dBtn = row.querySelector('.btn-delete-custom-alarm-tone');
        dBtn.onclick = async (e) => {
          e.stopPropagation();
          const isConfirmed = await requestDeleteAudioConfirmation(c.name || 'هذه النغمة');
          if (isConfirmed) {
            stopPreviewAudio();
            await deleteCustomAudio(c.id);
            if (selectedAlarmSound.id === c.id) {
              selectedAlarmSound = { id: 'default', name: 'نغمة منبه الجوال الافتراضية 🔔', path: '' };
              if (displaySoundName) displaySoundName.textContent = selectedAlarmSound.name;
            }
            renderAlarmSoundsList();
            showAudioFeedbackToast(`تم حذف ملف "${c.name}"`, '🗑️');
          }
        };

        soundListContainer.appendChild(row);
      });
    }

    // 2. قائمة نغمات المنبه والأذان
    const toneHeader = document.createElement('div');
    toneHeader.style.cssText = 'font-size:12px; font-weight:800; color:var(--text-secondary); padding:8px 6px 4px 6px;';
    toneHeader.textContent = '🔔 نغمات وأصوات المنبه:';
    soundListContainer.appendChild(toneHeader);

    GENERAL_ALARM_TONES.forEach(tone => {
      const isSel = (selectedAlarmSound.id === tone.id);
      const row = document.createElement('div');
      row.className = `muezzin-card-item ${isSel ? 'active' : ''}`;
      row.innerHTML = `
        <div class="muezzin-info-group">
          <button type="button" class="btn-preview-audio-play">▶</button>
          <div>
            <h4 style="font-size:14px; font-weight:800; margin:0;">${tone.name}</h4>
          </div>
        </div>
        <span class="custom-radio-circle">${isSel ? '✓' : ''}</span>
      `;

      row.onclick = (e) => {
        if (e.target.closest('.btn-preview-audio-play')) return;
        stopPreviewAudio();
        if (window.AndroidBridge && typeof window.AndroidBridge.stopPreviewSystemAlarm === 'function') {
          window.AndroidBridge.stopPreviewSystemAlarm();
        }

        let localPath = '';
        // تنزيل وتخزين المقطع محلياً في الأندرويد فور اختياره ليعمل أوفلاين 100%
        if (!tone.isSystem && tone.url) {
          if (window.AndroidBridge && typeof window.AndroidBridge.downloadAdhanAudio === 'function') {
            const fileName = `general_tone_${tone.id}.mp3`;
            localPath = window.AndroidBridge.downloadAdhanAudio(tone.url, fileName);
          }
        }

        selectedAlarmSound = {
          id: tone.id,
          name: tone.name,
          path: localPath || (tone.isSystem ? '' : tone.url)
        };

        if (displaySoundName) displaySoundName.textContent = tone.name;
        if (soundModal) soundModal.classList.remove('show');
      };

      const pBtn = row.querySelector('.btn-preview-audio-play');
      pBtn.onclick = (e) => {
        e.stopPropagation();

        // أ) إذا كان الخيار هو نغمة الهاتف الافتراضية
        if (tone.isSystem) {
          stopPreviewAudio();
          if (window.AndroidBridge && typeof window.AndroidBridge.previewSystemAlarm === 'function') {
            if (isSystemPreviewPlaying) {
              window.AndroidBridge.stopPreviewSystemAlarm();
              isSystemPreviewPlaying = false;
              pBtn.textContent = '▶';
              pBtn.classList.remove('playing');
            } else {
              window.AndroidBridge.previewSystemAlarm();
              isSystemPreviewPlaying = true;
              pBtn.textContent = '⏸';
              pBtn.classList.add('playing');
              setTimeout(() => {
                isSystemPreviewPlaying = false;
                pBtn.textContent = '▶';
                pBtn.classList.remove('playing');
              }, 4000);
            }
          }
          return;
        }

        // ب) النغمات والأذان الأخرى
        if (window.AndroidBridge && typeof window.AndroidBridge.stopPreviewSystemAlarm === 'function') {
          window.AndroidBridge.stopPreviewSystemAlarm();
          isSystemPreviewPlaying = false;
        }

        if (!previewAudioPlayer.paused && currentPlayingPreviewUrl === tone.url) {
          stopPreviewAudio();
        } else {
          stopPreviewAudio();
          currentPlayingPreviewUrl = tone.url;
          previewAudioPlayer.src = tone.url;
          previewAudioPlayer.play().catch(() => playSynthesizedAdhanChime());
          pBtn.textContent = '⏸';
          pBtn.classList.add('playing');
        }
      };

      soundListContainer.appendChild(row);
    });
  }

  // ربط زر رفع نغمة مخصصة من الهاتف وحفظها في بنك نغمات المنبه
  const uploadCustomToneInput = document.getElementById('inputUploadGeneralAlarmCustomSound');
  if (uploadCustomToneInput) {
    uploadCustomToneInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const fileId = await saveCustomAudioUnified(file);
      const nativeList = (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform())
        ? (JSON.parse(localStorage.getItem('hayat_native_custom_audios')) || [])
        : [];
      const savedItem = nativeList.find(x => x.id === fileId);

      selectedAlarmSound = {
        id: fileId,
        name: file.name,
        path: savedItem ? (savedItem.uri || '') : ''
      };

      const displaySoundName = document.getElementById('displayGeneralAlarmSoundName');
      if (displaySoundName) displaySoundName.textContent = file.name;

      await renderAlarmSoundsList();
      uploadCustomToneInput.value = '';
      showAudioFeedbackToast(`تمت إضافة "${file.name}" إلى نغمات المنبه ✨`, '📁');
    };
  }

    const userCustoms = await getAllCustomAudios();
    if (userCustoms && userCustoms.length > 0) {
      const header = document.createElement('div');
      header.style.cssText = 'font-size:12px; font-weight:800; color:#15803D; padding:4px 6px;';
      header.textContent = '📁 أصوات مخصصة من هاتفك:';
      soundListContainer.appendChild(header);

      userCustoms.forEach(c => {
        const isSel = (selectedAlarmSound.id === c.id);
        const row = document.createElement('div');
        row.className = `muezzin-card-item ${isSel ? 'active' : ''}`;
        row.innerHTML = `
          <div class="muezzin-info-group">
            <button type="button" class="btn-preview-audio-play" data-custom-id="${c.id}">▶</button>
            <div>
              <h4 style="font-size:14px; font-weight:800; margin:0;">${c.name}</h4>
              <span style="font-size:11px; color:#15803D;">ملف صوتي محلي</span>
            </div>
          </div>
          <span class="custom-radio-circle">${isSel ? '✓' : ''}</span>
        `;

        row.onclick = (e) => {
          if (e.target.closest('.btn-preview-audio-play')) return;
          stopPreviewAudio();
          selectedAlarmSound = { id: c.id, name: c.name, path: c.uri || '' };
          if (displaySoundName) displaySoundName.textContent = c.name;
          if (soundModal) soundModal.classList.remove('show');
        };

        const pBtn = row.querySelector('.btn-preview-audio-play');
        pBtn.onclick = async (e) => {
          e.stopPropagation();
          stopPreviewAudio();
          const src = await getCustomAudioPlayableSrc(c.id);
          if (src) {
            previewAudioPlayer.src = src;
            previewAudioPlayer.play().catch(() => {});
            pBtn.textContent = '⏸';
            pBtn.classList.add('playing');
          }
        };

        soundListContainer.appendChild(row);
      });
    }

    const toneHeader = document.createElement('div');
    toneHeader.style.cssText = 'font-size:12px; font-weight:800; color:var(--text-secondary); padding:8px 6px 4px 6px;';
    toneHeader.textContent = '🔔 نغمات وأصوات المنبه:';
    soundListContainer.appendChild(toneHeader);

    GENERAL_ALARM_TONES.forEach(tone => {
      const isSel = (selectedAlarmSound.id === tone.id);
      const row = document.createElement('div');
      row.className = `muezzin-card-item ${isSel ? 'active' : ''}`;
      row.innerHTML = `
        <div class="muezzin-info-group">
          <button type="button" class="btn-preview-audio-play" data-url="${tone.url}">▶</button>
          <div>
            <h4 style="font-size:14px; font-weight:800; margin:0;">${tone.name}</h4>
          </div>
        </div>
        <span class="custom-radio-circle">${isSel ? '✓' : ''}</span>
      `;

      row.onclick = (e) => {
        if (e.target.closest('.btn-preview-audio-play')) return;
        stopPreviewAudio();
        selectedAlarmSound = { id: tone.id, name: tone.name, path: tone.id === 'default' ? '' : tone.url };
        if (displaySoundName) displaySoundName.textContent = tone.name;
        if (soundModal) soundModal.classList.remove('show');
      };

      const pBtn = row.querySelector('.btn-preview-audio-play');
      pBtn.onclick = (e) => {
        e.stopPropagation();
        if (!previewAudioPlayer.paused && currentPlayingPreviewUrl === tone.url) {
          stopPreviewAudio();
        } else {
          stopPreviewAudio();
          currentPlayingPreviewUrl = tone.url;
          previewAudioPlayer.src = tone.url;
          previewAudioPlayer.play().catch(() => playSynthesizedAdhanChime());
          pBtn.textContent = '⏸';
          pBtn.classList.add('playing');
        }
      };

      soundListContainer.appendChild(row);
    });
  }

  document.querySelectorAll('.alarm-day-chip').forEach(chip => {
    chip.onclick = () => {
      const dayNum = parseInt(chip.getAttribute('data-day'), 10);
      if (tempAlarmDays.includes(dayNum)) {
        tempAlarmDays = tempAlarmDays.filter(d => d !== dayNum);
      } else {
        tempAlarmDays.push(dayNum);
      }
      updateAlarmDaysUI();
    };
  });

  const pEvery = document.getElementById('presetDaysEveryday');
  if (pEvery) pEvery.onclick = () => { tempAlarmDays = [0,1,2,3,4,5,6]; updateAlarmDaysUI(); };

  const pWork = document.getElementById('presetDaysWorkdays');
  if (pWork) pWork.onclick = () => { tempAlarmDays = [0,1,2,3,4]; updateAlarmDaysUI(); };

  const pOnce = document.getElementById('presetDaysOnce');
  if (pOnce) pOnce.onclick = () => { tempAlarmDays = []; updateAlarmDaysUI(); };

  const openSoundModalBtn = document.getElementById('openGeneralAlarmSoundModalBtn');
  const soundModal = document.getElementById('generalAlarmSoundModal');
  const closeSoundModalBtn = document.getElementById('closeGeneralAlarmSoundModalBtn');

  if (openSoundModalBtn && soundModal) {
    openSoundModalBtn.onclick = () => {
      renderAlarmSoundsList();
      soundModal.classList.add('show');
    };
  }
  if (closeSoundModalBtn && soundModal) {
    closeSoundModalBtn.onclick = () => {
      stopPreviewAudio();
      soundModal.classList.remove('show');
    };
  }

  // 1. الدالة المحصنة لفتح نافذة إضافة منبه جديد
  window.openAddGeneralAlarmModal = function() {
    const genModal = document.getElementById('generalAlarmModal');
    if (!genModal) return;

    editingGeneralAlarmIdx = null;

    const titleEl = document.getElementById('generalAlarmModalTitle');
    if (titleEl) titleEl.textContent = 'إضافة منبه جديد';

    const inputTitle = document.getElementById('inputGeneralAlarmTitle');
    if (inputTitle) inputTitle.value = '';

    const inputTime = document.getElementById('inputGeneralAlarmTime');
    if (inputTime) inputTime.value = '05:00';

    tempAlarmDays = [];
    updateAlarmDaysUI();

    selectedAlarmSound = { id: 'default', name: 'نغمة المنبه الافتراضية 🔔', path: '' };
    const displaySoundName = document.getElementById('displayGeneralAlarmSoundName');
    if (displaySoundName) displaySoundName.textContent = selectedAlarmSound.name;

    const delBtn = document.getElementById('btnDeleteGeneralAlarm');
    if (delBtn) delBtn.style.display = 'none';

    genModal.classList.add('show');
  };

  // 2. الدالة المحصنة لتعديل المنبه العام القائم
  window.openEditGeneralAlarmModal = function(idx) {
    const genModal = document.getElementById('generalAlarmModal');
    if (!genModal) return;

    const list = JSON.parse(localStorage.getItem('hayat_general_alarms_list')) || [];
    const item = list[idx];
    if (!item) return;

    editingGeneralAlarmIdx = idx;

    const titleEl = document.getElementById('generalAlarmModalTitle');
    if (titleEl) titleEl.textContent = 'تعديل المنبه';

    const inputTitle = document.getElementById('inputGeneralAlarmTitle');
    if (inputTitle) inputTitle.value = item.title || '';

    const inputTime = document.getElementById('inputGeneralAlarmTime');
    if (inputTime) inputTime.value = item.time || '05:00';

    tempAlarmDays = Array.isArray(item.days) ? [...item.days] : [];
    updateAlarmDaysUI();

    selectedAlarmSound = item.sound || { id: 'default', name: 'نغمة المنبه الافتراضية 🔔', path: item.soundPath || '' };
    const displaySoundName = document.getElementById('displayGeneralAlarmSoundName');
    if (displaySoundName) displaySoundName.textContent = selectedAlarmSound.name;

    const vibToggle = document.getElementById('toggleGeneralAlarmVibrate');
    if (vibToggle) vibToggle.checked = item.vibrate !== false;

    const snoozeToggle = document.getElementById('toggleGeneralAlarmSnooze');
    if (snoozeToggle) snoozeToggle.checked = item.snooze !== false;

    const delBtn = document.getElementById('btnDeleteGeneralAlarm');
    if (delBtn) delBtn.style.display = 'inline-block';

    genModal.classList.add('show');
  };

  // ربط زر الـ FAB الدائري (+) لفتح نافذة الإضافة
  const openGenFabBtn = document.getElementById('openAddGeneralAlarmFabBtn');
  if (openGenFabBtn) {
    openGenFabBtn.onclick = () => window.openAddGeneralAlarmModal();
  }

  const closeGenModalBtn = document.getElementById('closeGeneralAlarmModalBtn');
  if (closeGenModalBtn) {
    closeGenModalBtn.onclick = () => {
      const genModal = document.getElementById('generalAlarmModal');
      if (genModal) genModal.classList.remove('show');
    };
  }

  // حفظ المنبه وجدولته
  const btnSaveGen = document.getElementById('btnSaveGeneralAlarm');
  if (btnSaveGen) {
    btnSaveGen.onclick = () => {
      const inputTitle = document.getElementById('inputGeneralAlarmTitle');
      const inputTime = document.getElementById('inputGeneralAlarmTime');
      const title = (inputTitle && inputTitle.value.trim()) ? inputTitle.value.trim() : 'منبه الحياة الطيبة';
      const time = (inputTime && inputTime.value) ? inputTime.value : '05:00';

      const vib = document.getElementById('toggleGeneralAlarmVibrate') ? document.getElementById('toggleGeneralAlarmVibrate').checked : true;
      const snooze = document.getElementById('toggleGeneralAlarmSnooze') ? document.getElementById('toggleGeneralAlarmSnooze').checked : true;

      const list = JSON.parse(localStorage.getItem('hayat_general_alarms_list')) || [];
      const alarmId = (editingGeneralAlarmIdx !== null && list[editingGeneralAlarmIdx] && list[editingGeneralAlarmIdx].id)
        ? list[editingGeneralAlarmIdx].id
        : 'alarm_' + Date.now();

      const alarmItem = {
        id: alarmId,
        title,
        time,
        days: [...tempAlarmDays],
        sound: { ...selectedAlarmSound },
        soundPath: selectedAlarmSound.path || '',
        vibrate: vib,
        snooze: snooze,
        enabled: true
      };

      if (editingGeneralAlarmIdx !== null && list[editingGeneralAlarmIdx]) {
        list[editingGeneralAlarmIdx] = alarmItem;
      } else {
        list.push(alarmItem);
      }

      localStorage.setItem('hayat_general_alarms_list', JSON.stringify(list));

      // الجدولة الحقيقية في عتاد الأندرويد
      scheduleAlarmInNativeAndroid(alarmItem);

      const genModal = document.getElementById('generalAlarmModal');
      if (genModal) genModal.classList.remove('show');

      syncAllAlarmsToHub();

      // حساب وعرض الوقت المتبقي حتى الرنين بدقة
      const nextTrigger = calculateNextAlarmTriggerMillis(alarmItem.time, alarmItem.days);
      const diffMins = Math.max(1, Math.round((nextTrigger - Date.now()) / 60000));
      const timeRemainingText = (diffMins < 60) 
        ? `سيرن بعد ${diffMins} دقيقة` 
        : `سيرن بعد ${Math.floor(diffMins / 60)} ساعة و ${diffMins % 60} دقيقة`;

      showAudioFeedbackToast(`تم ضبط المنبه ⏰ (${timeRemainingText})`, '✓');
    };
  }

  // حذف المنبه
  const btnDeleteGen = document.getElementById('btnDeleteGeneralAlarm');
  if (btnDeleteGen) {
    btnDeleteGen.onclick = () => {
      if (editingGeneralAlarmIdx === null) return;
      const list = JSON.parse(localStorage.getItem('hayat_general_alarms_list')) || [];
      const item = list[editingGeneralAlarmIdx];
      if (item && item.id) {
        cancelAlarmInNativeAndroid(item.id);
      }
      list.splice(editingGeneralAlarmIdx, 1);
      localStorage.setItem('hayat_general_alarms_list', JSON.stringify(list));

      const genModal = document.getElementById('generalAlarmModal');
      if (genModal) genModal.classList.remove('show');

      syncAllAlarmsToHub();
      showAudioFeedbackToast('تم حذف المنبه وإلغاء جدولته 🗑️', '✓');
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

 // ==================== جدولة منبهات AlarmManager الأصلية (مستقلة عن إذن الإشعارات) ====================
function scheduleNativeBridgeAlarms() {
  const status = { at: new Date().toISOString(), bridge: false, scheduled: 0, first: null, errors: [] };
  try {
    const isApp = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
    if (!isApp) return status;

    const bridge = window.AndroidBridge;
    status.bridge = !!(bridge && typeof bridge.scheduleAlarm === 'function');
    if (!status.bridge) {
      status.errors.push('AndroidBridge.scheduleAlarm غير موجود');
      return status;
    }

    const calcFn = window.calculateLocalSolarTimings;
    if (typeof calcFn !== 'function') return null; // التطبيق لم يجهز بعد، ستتكرر المحاولة لاحقاً

    const loc = JSON.parse(localStorage.getItem('hayat_saved_location')) || { lat: 21.4225, lng: 39.8262, method: 4, asrMadhab: 0 };
    const tz = loc.timezoneOffset || (loc.lng > 40 ? 3 : 2);
    const method = loc.method || 4;
    const asrMadhab = loc.asrMadhab || 0;
    const offsets = loc.prayerOffsets || {};
    const prayers = [
      { key: 'Fajr', name: 'الفجر' },
      { key: 'Dhuhr', name: 'الظهر' },
      { key: 'Asr', name: 'العصر' },
      { key: 'Maghrib', name: 'المغرب' },
      { key: 'Isha', name: 'العشاء' }
    ];
    const now = new Date();

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + dayOffset);
      const dayTimings = calcFn(targetDate, loc.lat, loc.lng, tz, method, asrMadhab, offsets);
      if (!dayTimings) continue;

      for (const p of prayers) {
        const cfg = getPrayerAlarmConfig(p.key);
        if (cfg.enabled === false) continue;
        const timeStr = dayTimings[p.key];
        if (!timeStr) continue;

        const parts = String(timeStr).split(' ')[0].split(':');
        const alarmDate = new Date(targetDate);
        alarmDate.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), 0, 0);
        if (alarmDate <= now) continue;

        try {
          const savedNativeAudio = localStorage.getItem(`hayat_native_audio_${p.key}`) || '';
          bridge.scheduleAlarm(alarmDate.getTime(), p.key, p.name, savedNativeAudio);
          status.scheduled++;
          if (!status.first) status.first = { prayer: p.name, at: alarmDate.toString() };
        } catch (e) {
          if (status.errors.length < 3) status.errors.push(String((e && e.message) || e));
        }
      }
    }
  } catch (err) {
    status.errors.push('خطأ في الجدولة: ' + String((err && err.message) || err));
  }

  try { localStorage.setItem('hayat_native_alarm_status', JSON.stringify(status)); } catch (e) {}
  window.__nativeAlarmStatus = status;
  return status;
}
window.scheduleNativeBridgeAlarms = scheduleNativeBridgeAlarms;

 // ==================== محرك الجدولة الأصلية المسبقة للأندرويد (Native Background Alarms) ====================
async function scheduleNativeAndroidAlarms() {
  const isAndroidApp = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());

  // أولاً: المنبهات الأصلية للنظام، بدون انتظار أي إذن
  scheduleNativeBridgeAlarms();

  if (!isAndroidApp || !window.Capacitor.Plugins.LocalNotifications) return;

  try {
    // 1. طلب صلاحية الإشعارات
    const perm = await window.Capacitor.Plugins.LocalNotifications.requestPermissions();
    if (perm.display !== 'granted') return;

    // 2. مصفوفة اهتزاز نبضية متواصلة لمدة 30 ثانية كاملة
    const continuous30SecVibration = [
      0, 1000, 400, 1000, 400, 1000, 400, 1000, 400, 1000, 400,
      1000, 400, 1000, 400, 1000, 400, 1000, 400, 1000, 400,
      1000, 400, 1000, 400, 1000, 400, 1000, 400, 1000, 400,
      1000, 400, 1000, 400, 1000, 400, 1000, 400, 1000, 400
    ];

   // 3. إنشاء قناة المنبه الجديدة بربط مباشر مع R.raw.adhan
    await window.Capacitor.Plugins.LocalNotifications.createChannel({
      id: 'alhayat_adhan_channel_v7',
      name: 'منبه أذان الصلوات المفروضة',
      description: 'منبه عالي الأولوية يصدح بصوت الأذان وقت دخول الصلاة',
      importance: 5,
      visibility: 1,
      sound: 'adhan', // مجرد بدون .mp3 ليتعرف عليه نظام أندرويد فوراً
      vibration: true,
      lights: true,
      lightColor: '#10B981'
    });

    // 4. مسح الجدولة السابقة ومسح أي إشعارات قديمة عالقة في ستارة الهاتف
    const pending = await window.Capacitor.Plugins.LocalNotifications.getPending();
    if (pending && pending.notifications && pending.notifications.length > 0) {
      await window.Capacitor.Plugins.LocalNotifications.cancel(pending);
    }
    try {
      await window.Capacitor.Plugins.LocalNotifications.removeAllDeliveredNotifications();
    } catch(e) {}

    // 5. جلب بيانات الموقع والإعدادات الحالية
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

    // 6. جدولة الصلوات لـ 7 أيام قادمة
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + dayOffset);
      
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
          const uniqueId = parseInt(`${dayOffset + 1}${p.idOffset}${parseInt(hStr, 10)}${parseInt(mStr, 10)}`.slice(0, 9));

          const fmtTimeFn = window.formatTo12Hour || (typeof formatTo12Hour === 'function' ? formatTo12Hour : (t) => t);
          const timeFormatted = fmtTimeFn(timeStr);

          notificationsToSchedule.push({
            id: uniqueId,
            title: `حان الآن أذان ${p.name} 🕌`,
            body: `الله أكبر، الله أكبر.. موعد صلاة ${p.name} (${timeFormatted})`,
            channelId: 'alhayat_adhan_channel_v7',
            sound: 'adhan', // اسم الصوت في res/raw
            schedule: { at: alarmDate, allowWhileIdle: true },
            actionTypeId: 'PRAYER_ACTIONS',
            extra: { prayerKey: p.key, prayerName: p.name, rawTime: timeStr }
          });

          // (جدولة المنبه الأصلي أصبحت في scheduleNativeBridgeAlarms وتعمل مستقلة عن إذن الإشعارات)

        }
      });
    }

    // 7. تسجيل أزرار التفاعل
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

    // 8. تسليم الجدولة لنظام الأندرويد
    if (notificationsToSchedule.length > 0) {
      await window.Capacitor.Plugins.LocalNotifications.schedule({ notifications: notificationsToSchedule });
      console.log(`✓ تم بنجاح جدولة ${notificationsToSchedule.length} منبهاً بصوت الأذان.`);
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

  // 2. محرك المراقبة الحي (يعمل لحظياً عندما يكون التطبيق مفتوحاً أمام المستخدم)
  window.lastFiredGeneralAlarms = window.lastFiredGeneralAlarms || {};

  setInterval(() => {
    if (document.visibilityState !== 'visible') return;

    const now = new Date();
    const curHour = String(now.getHours()).padStart(2, '0');
    const curMin = String(now.getMinutes()).padStart(2, '0');
    const curTimeFormatted = `${curHour}:${curMin}`;
    const todayDayOfWeek = now.getDay();
    const todayStr = now.toDateString();

    // أ) مراقبة مواقيت الصلوات الخمس
    if (typeof window.currentTimings !== 'undefined' && window.currentTimings) {
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
    }

    // ب) مراقبة المنبهات العامة وتشغيلها فوراً والتطبيق مفتوح
    try {
      const genAlarmsList = JSON.parse(localStorage.getItem('hayat_general_alarms_list')) || [];
      genAlarmsList.forEach(alarm => {
        if (!alarm.enabled || alarm.time !== curTimeFormatted) return;

        // التحقق من توافق اليوم (إذا كان مخصصاً)
        if (Array.isArray(alarm.days) && alarm.days.length > 0 && !alarm.days.includes(todayDayOfWeek)) {
          return;
        }

        const alarmEventKey = `${alarm.id}_${todayStr}_${curTimeFormatted}`;
        if (window.lastFiredGeneralAlarms[alarmEventKey]) return; // منع تكرار الرنين لنفس الدقيقة

        window.lastFiredGeneralAlarms[alarmEventKey] = true;

        // إطلاق شاشة المنبه في الويب فقط (في الأندرويد يتولى عتاد النظام الرنين لمنع تكرار الصوت)
        const isNativeAndroid = !!(window.AndroidBridge);
        if (!isNativeAndroid && typeof triggerAdhanFullScreen === 'function') {
          triggerAdhanFullScreen(alarm.title || 'المنبه', formatTo12Hour(alarm.time), null, false, 'general');
        }
      });
    } catch (e) {}
  }, 3000); // فحص سريع كل 3 ثوانٍ لدقة فورية

  // المزامنة الأولية والجدولة عند الإقلاع
  syncAllAlarmsToHub();
  runSystemPermissionsDiagnostic();
  if (isAndroidApp) {
    scheduleNativeAndroidAlarms();
  }

  });
