// ==================== محرك شاشات وإعدادات مواقيت الصلاة والمذاهب ====================

const CALCULATION_METHODS = [
  { id: 4, name: 'أم القرى – مكة المكرمة', desc: 'الفجر 18.5° • العشاء 90 دقيقة بعد المغرب', countries: 'المملكة العربية السعودية، اليمن، وبلدان الخليج العربي.', astro: 'تعتمد زاوية 18.5 درجة لصلاة الفجر، وتوقيتاً ثابتاً 90 دقيقة لصلاة العشاء بعد المغرب (120 دقيقة في رمضان).' },
  { id: 3, name: 'رابطة العالم الإسلامي', desc: 'الفجر 18° • العشاء 17°', countries: 'عموم العالم الإسلامي، بلاد الشام، شمال أفريقيا، وأوروبا.', astro: 'تعتمد زاوية 18 درجة للفجر و 17 درجة للعشاء، وهي الطريقة القياسية الأكثر انتشاراً عالمياً.' },
  { id: 5, name: 'الهيئة المصرية العامة للمساحة', desc: 'الفجر 19.5° • العشاء 17.5°', countries: 'جمهورية مصر العربية، السودان، وبعض أجزاء أفريقيا.', astro: 'تعتمد زاوية 19.5 درجة للفجر و 17.5 درجة للعشاء وفق المعايير الرسمية لهيئة المساحة المصرية.' },
  { id: 1, name: 'جامعة العلوم الإسلامية – كراتشي', desc: 'الفجر 18° • العشاء 18°', countries: 'باكستان، بنغلاديش، أفغانستان، الهند، وأجزاء من آسيا الوسطى.', astro: 'تعتمد زاوية 18 درجة للفجر والعشاء بالتساوي، مع اعتماد فقهي واسع في شبه القارة الهندية.' },
  { id: 16, name: 'دبي – الإمارات العربية المتحدة', desc: 'الفجر 18.2° • العشاء 18.2°', countries: 'الإمارات العربية المتحدة وضواحيها.', astro: 'التقويم الرسمي الصادر عن دائرة الشؤون الإسلامية والعمل الخيري بدبي.' },
  { id: 9, name: 'الكويت', desc: 'الفجر 18° • العشاء 17.5°', countries: 'دولة الكويت.', astro: 'التقويم الرسمي المعتمد من وزارة الأوقاف والشؤون الإسلامية بدولة الكويت.' },
  { id: 10, name: 'قطر', desc: 'الفجر 18° • العشاء 90 دقيقة بعد المغرب', countries: 'دولة قطر.', astro: 'التقويم القطري الرسمي المعتمد من وزارة الأوقاف القطرية.' },
  { id: 11, name: 'سنغافورة', desc: 'الفجر 20° • العشاء 18°', countries: 'سنغافورة، ماليزيا، وإندونيسيا.', astro: 'تعتمد زاوية 20 درجة للفجر لمراعاة الرطوبة الاستوائية وفق مجلس أوغاما إسلام سينغابورا (MUIS).' },
  { id: 13, name: 'ديانت – تركيا', desc: 'الفجر 18° • العشاء 17°', countries: 'تركيا، ودول البلقان (البوسنة والهرسك، ألبانيا، كوسوفو).', astro: 'التقويم الرسمي المعتمد من رئاسة الشؤون الدينية التركية (Diyanet).' },
  { id: 15, name: 'لجنة رؤية الهلال', desc: 'الفجر 18° • العشاء 18°', countries: 'الجمعيات والمراكز الإسلامية المستقلة في أمريكا وأوروبا.', astro: 'حسابات فلكية دقيقة مدعومة بأرصاد بصرية لتحري دخول الوقت الفعلي.' },
  { id: 2, name: 'الجمعية الإسلامية لأمريكا الشمالية (ISNA)', desc: 'الفجر 15° • العشاء 15°', countries: 'الولايات المتحدة الأمريكية وكندا.', astro: 'تعتمد زاوية 15 درجة للفجر والعشاء لتفادي اختفاء الشفق في خطوط العرض العليا صيفاً.' },
  { id: 7, name: 'معهد الجيوفيزياء – جامعة طهران', desc: 'الفجر 17.7° • العشاء 14°', countries: 'إيران وبعض المجتمعات في العراق ولبنان.', astro: 'حسابات معهد الجيوفيزياء بجامعة طهران وفق المعايير الفلكية الإيرانية.' }
];

// قاموس الأيقونات الفلكية الحقيقية الست المطابقة تماماً للشاشة الرئيسية
const PRAYER_ASTRONOMICAL_ICONS = {
  Fajr: {
    bg: '#ECFDF5',
    border: '#BBF7D0',
    svg: `<svg viewBox="0 0 24 24" width="32" height="32" fill="none"><path d="M13 2a5 5 0 0 0 5 5 5 5 0 0 0 2.5-.7A6.5 6.5 0 1 1 12.5.5c0 .5.2 1 .5 1.5z" fill="#16A34A"/><line x1="3" y1="16" x2="21" y2="16" stroke="#16A34A" stroke-width="2.2" stroke-linecap="round"/><line x1="6" y1="20" x2="18" y2="20" stroke="#16A34A" stroke-width="2.2" stroke-linecap="round"/></svg>`
  },
  Sunrise: {
    bg: '#F0FDF4',
    border: '#BBF7D0',
    svg: `<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#22C55E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 13 A5 5 0 0 0 7 13" fill="#22C55E"/><line x1="12" y1="3" x2="12" y2="5.5"/><line x1="5.6" y1="5.6" x2="7.4" y2="7.4"/><line x1="18.4" y1="5.6" x2="16.6" y2="7.4"/><line x1="3" y1="14" x2="21" y2="14"/><path d="M5 18c2-1 4 1 7 0s5 1 7 0"/></svg>`
  },
  Dhuhr: {
    bg: '#ECFDF5',
    border: '#A7F3D0',
    svg: `<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.5" fill="#10B981"/><line x1="12" y1="2" x2="12" y2="4.5"/><line x1="12" y1="19.5" x2="12" y2="22"/><line x1="2" y1="12" x2="4.5" y2="12"/><line x1="19.5" y1="12" x2="22" y2="12"/><line x1="4.9" y1="4.9" x2="6.7" y2="6.7"/><line x1="17.3" y1="17.3" x2="19.1" y2="19.1"/><line x1="4.9" y1="19.1" x2="6.7" y2="17.3"/><line x1="17.3" y1="6.7" x2="19.1" y2="4.9"/></svg>`
  },
  Asr: {
    bg: '#F0F9FF',
    border: '#BAE6FD',
    svg: `<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#0284C7" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.5" fill="#0284C7"/><line x1="12" y1="2" x2="12" y2="4.5"/><line x1="12" y1="19.5" x2="12" y2="22"/><line x1="2" y1="12" x2="4.5" y2="12"/><line x1="19.5" y1="12" x2="22" y2="12"/><line x1="4.9" y1="4.9" x2="6.7" y2="6.7"/><line x1="17.3" y1="17.3" x2="19.1" y2="19.1"/><line x1="4.9" y1="19.1" x2="6.7" y2="17.3"/><line x1="17.3" y1="6.7" x2="19.1" y2="4.9"/></svg>`
  },
  Maghrib: {
    bg: '#EFF6FF',
    border: '#BFDBFE',
    svg: `<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round"><path d="M17 12.5 A5 5 0 0 0 7 12.5" fill="#2563EB"/>
    <line x1="12" y1="3" x2="12" y2="5.5"/><line x1="5.6" y1="5.6" x2="7.4" y2="7.4"/><line x1="18.4" y1="5.6" x2="16.6" y2="7.4"/><line x1="3" y1="13.5" x2="21" y2="13.5"/><path d="M4 18c2.5-1.5 5 1.5 7.5 0s5 1.5 8.5 0"/></svg>`
  },
  Isha: {
    bg: '#EEF2FF',
    border: '#C7D2FE',
    svg: `<svg viewBox="0 0 24 24" width="32" height="32" fill="#2563EB"><path d="M12.5 2a8.5 8.5 0 1 0 9.2 13 7 7 0 0 1-9.2-13z"/>
    <path d="M18.5 3.5l.5 1.2 1.2.5-1.2.5-.5 1.2-.5-1.2-1.2-.5 1.2-.5z"/>
    <path d="M21 8.5l.4.8.8.4-.8.4-.4.8-.4-.8-.8-.4.8-.4z"/></svg>`
  }
};

const prayerNamesAr = { Fajr: 'الفجر', Sunrise: 'الشروق', Dhuhr: 'الظهر', Asr: 'العصر', Maghrib: 'المغرب', Isha: 'العشاء' };

const defaultIqamahValues = { Fajr: 20, Dhuhr: 15, Asr: 15, Maghrib: 10, Isha: 15 };

function getSafeLocationData() {
  const defaultLoc = {
    city: 'مكة المكرمة',
    country: 'المملكة العربية السعودية',
    lat: 21.4225,
    lng: 39.8262,
    method: 4,
    asrMadhab: 0,
    prayerOffsets: { Fajr: 0, Sunrise: 0, Dhuhr: 0, Asr: 0, Maghrib: 0, Isha: 0 }
  };
  try {
    const saved = JSON.parse(localStorage.getItem('hayat_saved_location'));
    if (saved && saved.lat && saved.lng) {
      return Object.assign({}, defaultLoc, saved);
    }
  } catch(e) {}
  return defaultLoc;
}

function getAutoCountryPrayerProfile(countryName) {
  const c = countryName || '';
  if (c.includes('السعودية') || c.includes('اليمن')) {
    return { method: 4, asrMadhab: 0, tz: 3 };
  } else if (c.includes('مصر') || c.includes('السودان')) {
    return { method: 5, asrMadhab: 0, tz: 2 };
  } else if (c.includes('الإمارات')) {
    return { method: 16, asrMadhab: 0, tz: 4 };
  } else if (c.includes('الكويت')) {
    return { method: 9, asrMadhab: 0, tz: 3 };
  } else if (c.includes('قطر')) {
    return { method: 10, asrMadhab: 0, tz: 3 };
  } else if (c.includes('تركيا') || c.includes('البوسنة') || c.includes('ألبانيا') || c.includes('كوسوفو')) {
    return { method: 13, asrMadhab: 1, tz: 3 };
  } else if (c.includes('باكستان') || c.includes('بنغلاديش') || c.includes('أفغانستان') || c.includes('الهند')) {
    return { method: 1, asrMadhab: 1, tz: 5 };
  } else if (c.includes('سنغافورة') || c.includes('ماليزيا') || c.includes('إندونيسيا')) {
    return { method: 11, asrMadhab: 0, tz: 8 };
  } else if (c.includes('الولايات المتحدة') || c.includes('كندا')) {
    return { method: 2, asrMadhab: 0, tz: -5 };
  } else {
    return { method: 3, asrMadhab: 0, tz: 3 };
  }
}

// تحديث عناوين وملخصات الشاشة
function syncPrayerSettingsUI() {
  const loc = getSafeLocationData();
  const curMethodId = loc.method || 4;
  const curMadhab = loc.asrMadhab || 0;
  const mObj = CALCULATION_METHODS.find(m => m.id === curMethodId) || CALCULATION_METHODS[0];

  const displayMethod = document.getElementById('displayCalcMethodName');
  const displayMadhab = document.getElementById('displayAsrMadhabName');
  const subtitle = document.getElementById('prayerSettingsSubtitle');
  const summaryIqamah = document.getElementById('displayIqamahSummary');
  const fridayText = document.getElementById('displayFridayMadhabText');
  const ramadanText = document.getElementById('displayRamadanIshaText');

  if (displayMethod) displayMethod.textContent = mObj.name;
  if (displayMadhab) displayMadhab.textContent = (curMadhab === 1) ? 'الحنفي (ظل الشيء مثليه)' : 'الجمهور (الشافعي، المالكي، الحنبلي)';
  if (subtitle) subtitle.textContent = `${mObj.name.split('–')[0].trim()} • ${(curMadhab === 1 ? 'الحنفي' : 'الجمهور')}`;

  // ملخص الإقامة
  const savedIq = JSON.parse(localStorage.getItem('hayat_iqamah_settings')) || defaultIqamahValues;
  if (summaryIqamah) {
    summaryIqamah.textContent = `الفجر ${savedIq.Fajr}د • المغرب ${savedIq.Maghrib}د • البقية ${savedIq.Dhuhr}د`;
  }

  // ملخص الجمعة
  const fMode = localStorage.getItem('hayat_friday_method') || 'zawal';
  if (fridayText) {
    fridayText.textContent = (fMode === 'zawal') 
      ? 'عند الزوال (مذهب الجمهور والمعتمد رسمياً)' 
      : 'التبكير قبل الزوال بـ 25 دقيقة (المذهب الحنبلي)';
  }

  // ملخص رمضان
  const rMode = localStorage.getItem('hayat_ramadan_isha_mode') || '120';
  if (ramadanText) {
    if (rMode === '120') ramadanText.textContent = 'ساعتان بعد المغرب (120 دقيقة)';
    else if (rMode === '90') ramadanText.textContent = 'ساعة ونصف بعد المغرب (90 دقيقة)';
    else {
      const cMin = localStorage.getItem('hayat_ramadan_isha_custom_min') || '100';
      ramadanText.textContent = `توقيت مخصص (${cMin} دقيقة بعد المغرب)`;
    }
  }

  // تحديث حالة تعديل الدقائق في شاشة الصلوات الست
  const pKeys = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  const offsets = loc.prayerOffsets || {};
  pKeys.forEach(k => {
    const el = document.getElementById(`offsetStatus_${k}`);
    if (el) {
      const val = offsets[k] || 0;
      if (val === 0) {
        el.textContent = 'لم يتم تحديدها';
        el.className = 'prayer-offset-status';
      } else {
        el.textContent = `${val > 0 ? '+' : ''}${val} دقيقة`;
        el.className = 'prayer-offset-status configured';
      }
    }
  });
}
window.syncPrayerSettingsUI = syncPrayerSettingsUI;

document.addEventListener('DOMContentLoaded', () => {

  // دالة إظهار الرسائل المنبثقة الفاخرة (نجاح / تحذير) المتوافقة مع هوية التطبيق
  function showSettingsFeedbackToast(message, type = 'success') {
    let toast = document.getElementById('settingsFeedbackToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'settingsFeedbackToast';
      toast.className = 'settings-feedback-toast';
      document.body.appendChild(toast);
    }
    
    const icon = (type === 'warning') ? '⚠️' : '✨';
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    
    if (type === 'warning') {
      toast.classList.add('warning');
    } else {
      toast.classList.remove('warning');
    }

    toast.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }

  // للتوافق مع أي استدعاءات سابقة
  function showSettingsSuccessToast(message) {
    showSettingsFeedbackToast(message, 'success');
  }
  const screenPrayerSettings = document.getElementById('screen-prayer-settings');
  const screenPrayerOffsets = document.getElementById('screen-prayer-offsets');
  const screenGeneralSettings = document.getElementById('screen-general-settings');

  const openPrayerSettingsBtn = document.getElementById('openPrayerSettingsBtn');
  const backToGeneralSettingsFromPrayerBtn = document.getElementById('backToGeneralSettingsFromPrayerBtn');
  const backToPrayerSettingsFromOffsetsBtn = document.getElementById('backToPrayerSettingsFromOffsetsBtn');

  const openCalcMethodModalBtn = document.getElementById('openCalcMethodModalBtn');
  const calcMethodModal = document.getElementById('calcMethodModal');
  const closeCalcMethodBtn = document.getElementById('closeCalcMethodBtn');
  const calcMethodsListScroll = document.getElementById('calcMethodsListScroll');

  const openAsrMadhabModalBtn = document.getElementById('openAsrMadhabModalBtn');
  const asrMadhabModal = document.getElementById('asrMadhabModal');
  const closeAsrMadhabBtn = document.getElementById('closeAsrMadhabBtn');

  const openPrayerOffsetsScreenBtn = document.getElementById('openPrayerOffsetsScreenBtn');
  const singlePrayerOffsetSheet = document.getElementById('singlePrayerOffsetSheet');
  const closeSingleOffsetBtn = document.getElementById('closeSingleOffsetBtn');

  const methodInfoModal = document.getElementById('methodInfoModal');
  const closeMethodInfoBtn = document.getElementById('closeMethodInfoBtn');
  const infoMethodTitle = document.getElementById('infoMethodTitle');
  const infoMethodCountries = document.getElementById('infoMethodCountries');
  const infoMethodAstro = document.getElementById('infoMethodAstro');

  // أزرار النوافذ الثلاث (الإقامة، الجمعة، رمضان)
  const openIqamahSettingsModalBtn = document.getElementById('openIqamahSettingsModalBtn');
  const iqamahSettingsModal = document.getElementById('iqamahSettingsModal');
  const closeIqamahModalBtn = document.getElementById('closeIqamahModalBtn');
  const iqamahItemsListContainer = document.getElementById('iqamahItemsListContainer');
  const btnResetIqamahDefaults = document.getElementById('btnResetIqamahDefaults');
  const btnSaveIqamahSettings = document.getElementById('btnSaveIqamahSettings');

  const openFridaySettingsModalBtn = document.getElementById('openFridaySettingsModalBtn');
  const fridaySettingsModal = document.getElementById('fridaySettingsModal');
  const closeFridayModalBtn = document.getElementById('closeFridayModalBtn');

  const openRamadanIshaModalBtn = document.getElementById('openRamadanIshaModalBtn');
  const ramadanIshaModal = document.getElementById('ramadanIshaModal');
  const closeRamadanIshaBtn = document.getElementById('closeRamadanIshaBtn');
  const ramadanCustomWrapper = document.getElementById('ramadanCustomInputWrapper');
  const customRamadanInput = document.getElementById('customRamadanMinutesInput');

  const togglePrayerExpirationWarning = document.getElementById('togglePrayerExpirationWarning');

  let activeEditingOffsetPrayer = 'Fajr';
  let tempEditingOffsetValue = 0;
  let tempIqamahValues = Object.assign({}, defaultIqamahValues);

  // 1. التنقل بين الشاشات
  if (openPrayerSettingsBtn) {
    openPrayerSettingsBtn.onclick = () => {
      syncPrayerSettingsUI();
      if (typeof showScreen === 'function') showScreen(screenPrayerSettings);
      else if (window.showScreen) window.showScreen(screenPrayerSettings);
    };
  }
  if (backToGeneralSettingsFromPrayerBtn) {
    backToGeneralSettingsFromPrayerBtn.onclick = () => {
      if (typeof showScreen === 'function') showScreen(screenGeneralSettings);
      else if (window.showScreen) window.showScreen(screenGeneralSettings);
    };
  }
  if (openPrayerOffsetsScreenBtn) {
    openPrayerOffsetsScreenBtn.onclick = () => {
      syncPrayerSettingsUI();
      if (typeof showScreen === 'function') showScreen(screenPrayerOffsets);
      else if (window.showScreen) window.showScreen(screenPrayerOffsets);
    };
  }
  if (backToPrayerSettingsFromOffsetsBtn) {
    backToPrayerSettingsFromOffsetsBtn.onclick = () => {
      if (typeof showScreen === 'function') showScreen(screenPrayerSettings);
      else if (window.showScreen) window.showScreen(screenPrayerSettings);
    };
  }

  // 2. نافذة طرق الحساب الـ 12
  function renderCalculationMethodsList() {
    if (!calcMethodsListScroll) return;
    calcMethodsListScroll.innerHTML = '';
    const loc = getSafeLocationData();
    const curId = loc.method || 4;

    CALCULATION_METHODS.forEach(m => {
      const isSelected = (m.id === curId);
      const row = document.createElement('div');
      row.className = `calc-method-item ${isSelected ? 'active' : ''}`;
      row.innerHTML = `
        <div class="calc-method-right">
          <span class="custom-radio-circle">${isSelected ? '✓' : ''}</span>
          <div>
            <h4 class="calc-method-title">${m.name}</h4>
            <p class="calc-method-desc">${m.desc}</p>
          </div>
        </div>
        <button type="button" class="method-info-trigger-btn" title="معلومات الطريقة">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
        </button>
      `;

      row.onclick = (e) => {
        if (e.target.closest('.method-info-trigger-btn')) return;
        const currentLoc = getSafeLocationData();
        currentLoc.method = m.id;
        localStorage.setItem('hayat_saved_location', JSON.stringify(currentLoc));
        if (calcMethodModal) calcMethodModal.classList.remove('show');
        syncPrayerSettingsUI();
        if (typeof window.applyPrayerSettingsUpdate === 'function') {
          window.applyPrayerSettingsUpdate();
        }
      };

      const infoBtn = row.querySelector('.method-info-trigger-btn');
      if (infoBtn) {
        infoBtn.onclick = (e) => {
          e.stopPropagation();
          if (infoMethodTitle) infoMethodTitle.textContent = m.name;
          if (infoMethodCountries) infoMethodCountries.innerHTML = `<strong>الدول المعتمدة:</strong><br>${m.countries}`;
          if (infoMethodAstro) infoMethodAstro.innerHTML = `<strong>التفاصيل الفلكية:</strong><br>${m.astro}`;
          if (methodInfoModal) methodInfoModal.classList.add('show');
        };
      }

      calcMethodsListScroll.appendChild(row);
    });
  }

  if (openCalcMethodModalBtn) {
    openCalcMethodModalBtn.onclick = () => {
      renderCalculationMethodsList();
      if (calcMethodModal) calcMethodModal.classList.add('show');
    };
  }
  if (closeCalcMethodBtn) {
    closeCalcMethodBtn.onclick = () => calcMethodModal.classList.remove('show');
  }

  // 3. نافذة مذهب العصر
  if (openAsrMadhabModalBtn) {
    openAsrMadhabModalBtn.onclick = () => {
      const loc = getSafeLocationData();
      const curMadhab = loc.asrMadhab || 0;
      document.querySelectorAll('.madhab-select-card').forEach(c => {
        const val = parseInt(c.getAttribute('data-madhab'), 10);
        c.classList.toggle('active', val === curMadhab);
        const circle = c.querySelector('.custom-radio-circle');
        if (circle) circle.textContent = (val === curMadhab) ? '✓' : '';
      });
      if (asrMadhabModal) asrMadhabModal.classList.add('show');
    };
  }
  if (closeAsrMadhabBtn) {
    closeAsrMadhabBtn.onclick = () => asrMadhabModal.classList.remove('show');
  }

  document.querySelectorAll('.madhab-select-card[data-madhab]').forEach(card => {
    card.onclick = () => {
      const val = parseInt(card.getAttribute('data-madhab'), 10);
      const loc = getSafeLocationData();
      loc.asrMadhab = val;
      localStorage.setItem('hayat_saved_location', JSON.stringify(loc));
      if (asrMadhabModal) asrMadhabModal.classList.remove('show');
      syncPrayerSettingsUI();
      if (typeof window.applyPrayerSettingsUpdate === 'function') {
        window.applyPrayerSettingsUpdate();
      }
    };
  });

  // 4. نافذة تعديل دقائق الصلاة
  document.querySelectorAll('.prayer-offset-item-row').forEach(row => {
    row.onclick = () => {
      activeEditingOffsetPrayer = row.getAttribute('data-prayer-key');
      const loc = getSafeLocationData();
      const curVal = (loc.prayerOffsets && loc.prayerOffsets[activeEditingOffsetPrayer]) || 0;
      tempEditingOffsetValue = curVal;

      const titleEl = document.getElementById('offsetModalPrayerTitle');
      const numEl = document.getElementById('currentOffsetMinuteNum');
      const iconBox = document.getElementById('offsetModalPrayerIconBox');

      const prayerMeta = PRAYER_ASTRONOMICAL_ICONS[activeEditingOffsetPrayer] || PRAYER_ASTRONOMICAL_ICONS.Fajr;
      if (iconBox) {
        iconBox.innerHTML = prayerMeta.svg;
        iconBox.style.backgroundColor = prayerMeta.bg;
        iconBox.style.borderColor = prayerMeta.border;
      }

      let curTimeText = '';
      if (typeof window.getCurrentPrayerTimeString === 'function') {
        curTimeText = window.getCurrentPrayerTimeString(activeEditingOffsetPrayer);
      }

      if (titleEl) titleEl.textContent = `${prayerNamesAr[activeEditingOffsetPrayer]} ${curTimeText}`;
      if (numEl) numEl.textContent = `${curVal > 0 ? '+' : ''}${curVal}`;

      if (singlePrayerOffsetSheet) singlePrayerOffsetSheet.classList.add('show');
    };
  });

  const btnIncrementOffset = document.getElementById('btnIncrementOffset');
  const btnDecrementOffset = document.getElementById('btnDecrementOffset');
  const btnResetOffsetVal = document.getElementById('btnResetOffsetVal');
  const currentOffsetMinuteNum = document.getElementById('currentOffsetMinuteNum');
  const btnConfirmSingleOffset = document.getElementById('btnConfirmSingleOffset');

  if (btnIncrementOffset) {
    btnIncrementOffset.onclick = () => {
      tempEditingOffsetValue = Math.min(30, tempEditingOffsetValue + 1);
      if (currentOffsetMinuteNum) currentOffsetMinuteNum.textContent = `${tempEditingOffsetValue > 0 ? '+' : ''}${tempEditingOffsetValue}`;
    };
  }
  if (btnDecrementOffset) {
    btnDecrementOffset.onclick = () => {
      tempEditingOffsetValue = Math.max(-30, tempEditingOffsetValue - 1);
      if (currentOffsetMinuteNum) currentOffsetMinuteNum.textContent = `${tempEditingOffsetValue > 0 ? '+' : ''}${tempEditingOffsetValue}`;
    };
  }
  if (btnResetOffsetVal) {
    btnResetOffsetVal.onclick = () => {
      tempEditingOffsetValue = 0;
      if (currentOffsetMinuteNum) currentOffsetMinuteNum.textContent = '0';
    };
  }
  if (closeSingleOffsetBtn) {
    closeSingleOffsetBtn.onclick = () => singlePrayerOffsetSheet.classList.remove('show');
  }

  if (btnConfirmSingleOffset) {
    btnConfirmSingleOffset.onclick = () => {
      const loc = getSafeLocationData();
      if (!loc.prayerOffsets) loc.prayerOffsets = {};
      loc.prayerOffsets[activeEditingOffsetPrayer] = tempEditingOffsetValue;
      localStorage.setItem('hayat_saved_location', JSON.stringify(loc));

      if (singlePrayerOffsetSheet) singlePrayerOffsetSheet.classList.remove('show');
      syncPrayerSettingsUI();
      if (typeof window.applyPrayerSettingsUpdate === 'function') {
        window.applyPrayerSettingsUpdate();
      }
    };
  }

  // 5. نافذة ضبط مدد الإقامة
  function renderIqamahRows() {
    if (!iqamahItemsListContainer) return;
    iqamahItemsListContainer.innerHTML = '';
    const prayers = [
      { key: 'Fajr', name: 'الفجر' },
      { key: 'Dhuhr', name: 'الظهر' },
      { key: 'Asr', name: 'العصر' },
      { key: 'Maghrib', name: 'المغرب' },
      { key: 'Isha', name: 'العشاء' }
    ];

    prayers.forEach(p => {
      const row = document.createElement('div');
      row.className = 'iqamah-row-card';
      row.innerHTML = `
        <span class="iqamah-row-name">${p.name}</span>
        <div class="iqamah-row-stepper">
          <button type="button" class="iqamah-step-btn btn-iqamah-minus" data-key="${p.key}">−</button>
          <span class="iqamah-val-text" id="iqVal_${p.key}">${tempIqamahValues[p.key]} دقيقة</span>
          <button type="button" class="iqamah-step-btn btn-iqamah-plus" data-key="${p.key}">+</button>
        </div>
      `;
      iqamahItemsListContainer.appendChild(row);
    });

    iqamahItemsListContainer.querySelectorAll('.btn-iqamah-plus').forEach(btn => {
      btn.onclick = () => {
        const k = btn.getAttribute('data-key');
        tempIqamahValues[k] = Math.min(45, tempIqamahValues[k] + 1);
        const txt = document.getElementById(`iqVal_${k}`);
        if (txt) txt.textContent = `${tempIqamahValues[k]} دقيقة`;
      };
    });

    iqamahItemsListContainer.querySelectorAll('.btn-iqamah-minus').forEach(btn => {
      btn.onclick = () => {
        const k = btn.getAttribute('data-key');
        tempIqamahValues[k] = Math.max(5, tempIqamahValues[k] - 1);
        const txt = document.getElementById(`iqVal_${k}`);
        if (txt) txt.textContent = `${tempIqamahValues[k]} دقيقة`;
      };
    });
  }

  if (openIqamahSettingsModalBtn && iqamahSettingsModal) {
    openIqamahSettingsModalBtn.onclick = () => {
      const saved = JSON.parse(localStorage.getItem('hayat_iqamah_settings')) || defaultIqamahValues;
      tempIqamahValues = Object.assign({}, defaultIqamahValues, saved);
      renderIqamahRows();
      iqamahSettingsModal.classList.add('show');
    };
  }
  if (closeIqamahModalBtn && iqamahSettingsModal) {
    closeIqamahModalBtn.onclick = () => iqamahSettingsModal.classList.remove('show');
  }

  if (btnResetIqamahDefaults) {
    btnResetIqamahDefaults.onclick = () => {
      tempIqamahValues = Object.assign({}, defaultIqamahValues);
      renderIqamahRows();
    };
  }

  if (btnSaveIqamahSettings && iqamahSettingsModal) {
    btnSaveIqamahSettings.onclick = () => {
      try {
        localStorage.setItem('hayat_iqamah_settings', JSON.stringify(tempIqamahValues));
        iqamahSettingsModal.classList.remove('show');
        syncPrayerSettingsUI();
        if (typeof window.applyPrayerSettingsUpdate === 'function') window.applyPrayerSettingsUpdate();
        showSettingsSuccessToast('تم حفظ واعتماد مدد الإقامة بنجاح');
      } catch (err) {
        alert('تعذر حفظ البيانات في الذاكرة، يرجى المحاولة ثانية.');
      }
    };
  }

  // 6. نافذة صلاة الجمعة المطورة (اختيار الطريقة وتحديد الدقائق وحفظ الاعتماد)
  const fridayEarlyWrapper = document.getElementById('fridayEarlyMinutesWrapper');
  const inputFridayEarlyMinutes = document.getElementById('inputFridayEarlyMinutes');
  const btnSaveFridaySettings = document.getElementById('btnSaveFridaySettings');
  let selectedFridayMode = localStorage.getItem('hayat_friday_method') || 'zawal';

  if (openFridaySettingsModalBtn && fridaySettingsModal) {
    openFridaySettingsModalBtn.onclick = () => {
      selectedFridayMode = localStorage.getItem('hayat_friday_method') || 'zawal';
      const savedMinutes = localStorage.getItem('hayat_friday_early_minutes') || '25';
      if (inputFridayEarlyMinutes) inputFridayEarlyMinutes.value = savedMinutes;

      fridaySettingsModal.querySelectorAll('.madhab-select-card').forEach(c => {
        const m = c.getAttribute('data-friday-mode');
        const isActive = (m === selectedFridayMode);
        c.classList.toggle('active', isActive);
        const circle = c.querySelector('.custom-radio-circle');
        if (circle) circle.textContent = isActive ? '✓' : '';
      });

      if (fridayEarlyWrapper) {
        fridayEarlyWrapper.style.display = (selectedFridayMode === 'hanbali_early') ? 'block' : 'none';
      }

      fridaySettingsModal.classList.add('show');
    };
  }

  if (closeFridayModalBtn && fridaySettingsModal) {
    closeFridayModalBtn.onclick = () => fridaySettingsModal.classList.remove('show');
  }

  if (fridaySettingsModal) {
    fridaySettingsModal.querySelectorAll('.madhab-select-card').forEach(card => {
      card.onclick = (e) => {
        if (e.target.tagName === 'INPUT') return;
        selectedFridayMode = card.getAttribute('data-friday-mode');

        fridaySettingsModal.querySelectorAll('.madhab-select-card').forEach(c => {
          c.classList.remove('active');
          const circle = c.querySelector('.custom-radio-circle');
          if (circle) circle.textContent = '';
        });

        card.classList.add('active');
        const activeCircle = card.querySelector('.custom-radio-circle');
        if (activeCircle) activeCircle.textContent = '✓';

        if (fridayEarlyWrapper) {
          fridayEarlyWrapper.style.display = (selectedFridayMode === 'hanbali_early') ? 'block' : 'none';
          if (selectedFridayMode === 'hanbali_early' && inputFridayEarlyMinutes) {
            inputFridayEarlyMinutes.focus();
          }
        }
      };
    });
  }

  // زر حفظ واعتماد وقت صلاة الجمعة مع رسالة النجاح
  if (btnSaveFridaySettings && fridaySettingsModal) {
    btnSaveFridaySettings.onclick = () => {
      try {
        localStorage.setItem('hayat_friday_method', selectedFridayMode);

        if (selectedFridayMode === 'hanbali_early' && inputFridayEarlyMinutes) {
          const val = parseInt(inputFridayEarlyMinutes.value, 10);
          const cleanVal = (val && val >= 5 && val <= 60) ? val : 25;
          localStorage.setItem('hayat_friday_early_minutes', cleanVal.toString());
        }

        fridaySettingsModal.classList.remove('show');
        syncPrayerSettingsUI();
        if (typeof window.applyPrayerSettingsUpdate === 'function') window.applyPrayerSettingsUpdate();
        showSettingsSuccessToast('تم اعتماد وقت صلاة الجمعة بنجاح');
      } catch (err) {
        alert('حدث خطأ أثناء الحفظ، يرجى المحاولة ثانية.');
      }
    };
  }

  // 7. نافذة عشاء رمضان المرنة المطورة (مع زري الحفظ والإلغاء ورسالة النجاح)
  const cancelRamadanIshaBtn = document.getElementById('cancelRamadanIshaBtn');
  const btnSaveRamadanIsha = document.getElementById('btnSaveRamadanIsha');
  const displayRamadanIshaText = document.getElementById('displayRamadanIshaText');
  let tempRamadanMode = localStorage.getItem('hayat_ramadan_isha_mode') || '120';

  function renderRamadanCardsSelection() {
    if (!ramadanIshaModal) return;
    ramadanIshaModal.querySelectorAll('.madhab-select-card').forEach(c => {
      const m = c.getAttribute('data-ramadan-mode');
      const isSelected = (m === tempRamadanMode);
      c.classList.toggle('active', isSelected);
      const circle = c.querySelector('.custom-radio-circle');
      if (circle) circle.textContent = isSelected ? '✓' : '';
    });

    if (ramadanCustomWrapper) {
      ramadanCustomWrapper.style.display = (tempRamadanMode === 'custom') ? 'block' : 'none';
    }
    if (customRamadanInput && tempRamadanMode === 'custom') {
      customRamadanInput.value = localStorage.getItem('hayat_ramadan_isha_custom_min') || '100';
    }
  }

  if (openRamadanIshaModalBtn && ramadanIshaModal) {
    openRamadanIshaModalBtn.onclick = () => {
      tempRamadanMode = localStorage.getItem('hayat_ramadan_isha_mode') || '120';
      renderRamadanCardsSelection();
      ramadanIshaModal.classList.add('show');
    };
  }

  // زرا الإلغاء والإغلاق دون حفظ أي تعديل
  if (closeRamadanIshaBtn && ramadanIshaModal) {
    closeRamadanIshaBtn.onclick = () => ramadanIshaModal.classList.remove('show');
  }
  if (cancelRamadanIshaBtn && ramadanIshaModal) {
    cancelRamadanIshaBtn.onclick = () => ramadanIshaModal.classList.remove('show');
  }

  // التحديد البصري فقط عند النقر على الخيارات (دون حفظ أو إغلاق فوري)
  if (ramadanIshaModal) {
    ramadanIshaModal.querySelectorAll('.madhab-select-card').forEach(card => {
      card.onclick = (e) => {
        if (e.target.tagName === 'INPUT') return;
        tempRamadanMode = card.getAttribute('data-ramadan-mode');
        renderRamadanCardsSelection();
        if (tempRamadanMode === 'custom' && customRamadanInput) {
          customRamadanInput.focus();
        }
      };
    });
  }

  // زر حفظ واعتماد توقيت رمضان مع رسائل التنبيه والنجاح المطابقة لهوية التطبيق
  if (btnSaveRamadanIsha && ramadanIshaModal) {
    btnSaveRamadanIsha.onclick = () => {
      try {
        if (tempRamadanMode === 'custom') {
          const val = parseInt(customRamadanInput.value, 10);

          // 1. التحقق من إدخال رقم صحيح
          if (!val || isNaN(val)) {
            showSettingsFeedbackToast('يرجى كتابة عدد دقائق صالح', 'warning');
            if (customRamadanInput) customRamadanInput.focus();
            return;
          }

          // 2. التحقق من سقف الساعتين (120 دقيقة)
          if (val > 120) {
            showSettingsFeedbackToast('لا يمكن أن يتجاوز فارق العشاء في رمضان ساعتين (120 دقيقة)', 'warning');
            if (customRamadanInput) customRamadanInput.focus();
            return;
          }

          // 3. التحقق من الحد الأدنى المعقول (60 دقيقة - ساعة بعد المغرب)
          if (val < 60) {
            showSettingsFeedbackToast('الحد الأدنى لفارق العشاء في رمضان هو 60 دقيقة', 'warning');
            if (customRamadanInput) customRamadanInput.focus();
            return;
          }

          localStorage.setItem('hayat_ramadan_isha_custom_min', val.toString());
        }

        localStorage.setItem('hayat_ramadan_isha_mode', tempRamadanMode);
        ramadanIshaModal.classList.remove('show');
        syncPrayerSettingsUI();
        if (typeof window.applyPrayerSettingsUpdate === 'function') window.applyPrayerSettingsUpdate();
        
        // إظهار رسالة النجاح الفاخرة
        showSettingsFeedbackToast('تم اعتماد توقيت العشاء في رمضان بنجاح', 'success');
      } catch (err) {
        showSettingsFeedbackToast('تعذر حفظ التوقيت، يرجى المحاولة ثانية', 'warning');
      }
    };
  }

  // 8. مفتاح تنبيه خروج وقت الصلاة
  if (togglePrayerExpirationWarning) {
    togglePrayerExpirationWarning.checked = localStorage.getItem('hayat_show_expiration_warning') !== 'false';
    togglePrayerExpirationWarning.onchange = (e) => {
      localStorage.setItem('hayat_show_expiration_warning', e.target.checked);
    };
  }

  if (closeMethodInfoBtn) {
    closeMethodInfoBtn.onclick = () => methodInfoModal.classList.remove('show');
  }

  syncPrayerSettingsUI();
});
