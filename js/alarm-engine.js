// ==================== محرك التنبيهات، الأذان، و IndexedDB المتقدم ====================

const ALARM_DB_NAME = 'HayatAlarmDB';
const ALARM_DB_VERSION = 1;
let alarmDBInstance = null;

// 1. فتح وتهيئة مستودع IndexedDB
function initAlarmDatabase() {
  return new Promise((resolve, reject) => {
    if (alarmDBInstance) return resolve(alarmDBInstance);
    const req = indexedDB.open(ALARM_DB_NAME, ALARM_DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('custom_audio')) db.createObjectStore('custom_audio', { keyPath: 'id' });
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

// 2. قائمة أصوات الأذان العالمية (معالجة حظر 403 مع سيرفرات عامة بديلة)
const MUEZZIN_LIST = [
  { id: 'makkah', name: 'أذان الحرم المكي (الشيخ علي ملا)', country: 'مكة المكرمة 🇸🇦', url: 'https://ia800201.us.archive.org/12/items/AdhanMakkah/Adhan%20Makkah.mp3' },
  { id: 'madinah', name: 'أذان المسجد النبوي الشريف', country: 'المدينة المنورة 🇸🇦', url: 'https://ia800302.us.archive.org/24/items/AdhanMadinah/Adhan%20Madinah.mp3' },
  { id: 'aqsa', name: 'أذان المسجد الأقصى المبارك', country: 'فلسطين 🇵🇸', url: 'https://ia801802.us.archive.org/16/items/AdhanAlAqsa/Adhan%20Al-Aqsa.mp3' },
  { id: 'egypt', name: 'أذان إذاعة القرآن بمصر (النقشبندي)', country: 'مصر 🇪🇬', url: 'https://ia800203.us.archive.org/14/items/AdhanEgypt/Adhan%20Egypt.mp3' },
  { id: 'yemen', name: 'أذان الجامع الكبير بصنعاء', country: 'اليمن 🇾🇪', url: 'https://ia600201.us.archive.org/12/items/AdhanMakkah/Adhan%20Makkah.mp3' }
];

const ADHAN_BG_PRESETS = [
  { id: 'bg1', url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80', title: 'جامع الشيخ زايد' },
  { id: 'bg2', url: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=800&q=80', title: 'الكعبة المشرفة' },
  { id: 'bg3', url: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=800&q=80', title: 'المسجد النبوي الشريف' },
  { id: 'bg4', url: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=800&q=80', title: 'محراب وقبة المسجد' }
];

let currentActivePrayerAlarmContext = 'Maghrib';
let previewAudioPlayer = new Audio();

// محرك النغمة المدمجة الاحتياطية حال غياب الاتصال أو تعثر الملف
function playSynthesizedAdhanChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 1.2);
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1.2);
  } catch(e) {}
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

function openPrayerAlarmSettings(prayerKey) {
  currentActivePrayerAlarmContext = prayerKey;
  updatePrayerAlarmSettingsUI();
  const screen = document.getElementById('screen-prayer-alarm-detail');
  if (screen && typeof showScreen === 'function') showScreen(screen);
  else if (window.showScreen) window.showScreen(screen);
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
    if (cfg.audioMode === 'custom') audioTitle.textContent = 'أذان مخصص (من جهازي 📁)';
    else if (cfg.audioMode === 'silent') audioTitle.textContent = 'صامت (بدون صوت)';
    else {
      const m = MUEZZIN_LIST.find(x => x.id === cfg.selectedMuezzinId);
      audioTitle.textContent = m ? m.name : 'أذان مكة المكرمة';
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
    container.innerHTML = `<span style="font-size:12px; color:var(--text-muted); text-align:center;">لا توجد تنبيهات مخصصة لهذه الصلاة بعد.</span>`;
    return;
  }

  cfg.preAlarms.forEach((a, idx) => {
    const card = document.createElement('div');
    card.className = 'pre-alarm-card-item';
    const posText = a.position === 'before' ? 'قبل' : 'بعد';
    card.innerHTML = `
      <span>🔔 تنبيه ${posText} الصلاة بـ ${a.minutes} دقيقة</span>
      <button type="button" class="modal-btn-link text-muted delete-pre-alarm-btn" data-idx="${idx}" style="color:#EF4444;">✕</button>
    `;
    card.querySelector('.delete-pre-alarm-btn').onclick = () => {
      cfg.preAlarms.splice(idx, 1);
      savePrayerAlarmConfig(currentActivePrayerAlarmContext, cfg);
      renderPreAlarmsListUI();
    };
    container.appendChild(card);
  });
}

// 4. تشغيل الأذان الحقيقي التلقائي وشاشة العرض الكاملة
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

  // الاهتزاز
  if (cfg.vibrationEnabled && navigator.vibrate) {
    navigator.vibrate([400, 200, 400, 200, 600]);
  }

  // فحص سياسة احترام الوضع الصامت للجهاز
  if (cfg.respectSilentMode && window.AndroidBridge && typeof window.AndroidBridge.isDeviceSilent === 'function') {
    if (window.AndroidBridge.isDeviceSilent()) return; // كتم الصوت
  }

  // تشغيل الصوت
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
      console.warn('Audio playback restricted, playing fallback chime');
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

// 5. ربط أحداث النوافذ ومودالات المنبه العام والتقويم
document.addEventListener('DOMContentLoaded', () => {
  initAlarmDatabase();

  // المعاينة الحية للأذان
  const btnPreviewLive = document.getElementById('btnPreviewAdhanLiveScreen');
  if (btnPreviewLive) {
    btnPreviewLive.onclick = () => {
      const curTime = (typeof currentTimings !== 'undefined' && currentTimings.Maghrib) ? formatTo12Hour(currentTimings.Maghrib) : '5:38 م';
      triggerAdhanFullScreen('المغرب', curTime);
    };
  }

  // التحكم بـ خانتي الهزاز التلقائي
  const btnIncBuffer = document.getElementById('btnIncBuffer');
  const btnDecBuffer = document.getElementById('btnDecBuffer');
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

  // المنبهات العامة (+) والتعديل
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

  // نافذة تذكير التقويم
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

  // تشغيل المعاينة للمؤذنين
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

      const audioModal = document.getElementById('adhanAudioSelectModal');
      if (audioModal) audioModal.classList.remove('show');
      alert(`✨ تم رفع الأذان بنجاح وتخزينه أوفلاين في جهازك!`);
    };
  }
});
