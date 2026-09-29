
// ==================== محرك شاشات وإعدادات مواقيت الصلاة والمذاهب ====================

// 1. مصفوفة الطرق الفلكية الـ 12 المعتمدة دولياً وتفاصيلها الفلكية والجغرافية
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

// 2. خريطة الاقتران التلقائي الذكي للدول مع الطريقة والمذهب المعتمدين
function getAutoCountryPrayerProfile(countryName) {
  const c = countryName || '';
  if (c.includes('السعودية') || c.includes('اليمن')) {
    return { method: 4, asrMadhab: 0, tz: 3 }; // أم القرى • الجمهور
  } else if (c.includes('مصر') || c.includes('السودان')) {
    return { method: 5, asrMadhab: 0, tz: 2 }; // الهيئة المصرية • الجمهور
  } else if (c.includes('الإمارات')) {
    return { method: 16, asrMadhab: 0, tz: 4 }; // دبي • الجمهور
  } else if (c.includes('الكويت')) {
    return { method: 9, asrMadhab: 0, tz: 3 }; // الكويت • الجمهور
  } else if (c.includes('قطر')) {
    return { method: 10, asrMadhab: 0, tz: 3 }; // قطر • الجمهور
  } else if (c.includes('تركيا') || c.includes('البوسنة') || c.includes('ألبانيا') || c.includes('كوسوفو')) {
    return { method: 13, asrMadhab: 1, tz: 3 }; // ديانت تركيا • الحنفي
  } else if (c.includes('باكستان') || c.includes('بنغلاديش') || c.includes('أفغانستان') || c.includes('الهند')) {
    return { method: 1, asrMadhab: 1, tz: 5 }; // كراتشي • الحنفي
  } else if (c.includes('سنغافورة') || c.includes('ماليزيا') || c.includes('إندونيسيا')) {
    return { method: 11, asrMadhab: 0, tz: 8 }; // سنغافورة • الجمهور
  } else if (c.includes('الولايات المتحدة') || c.includes('كندا')) {
    return { method: 2, asrMadhab: 0, tz: -5 }; // ISNA أمريكا • الجمهور
  } else {
    return { method: 3, asrMadhab: 0, tz: 3 }; // رابطة العالم الإسلامي • الجمهور
  }
}

// 3. مزامنة واجهة إعدادات المواقيت
function syncPrayerSettingsUI() {
  const savedLoc = JSON.parse(localStorage.getItem('hayat_saved_location')) || {};
  const curMethodId = savedLoc.method || 4;
  const curMadhab = savedLoc.asrMadhab || 0;
  const mObj = CALCULATION_METHODS.find(m => m.id === curMethodId) || CALCULATION_METHODS[0];

  const displayMethod = document.getElementById('displayCalcMethodName');
  const displayMadhab = document.getElementById('displayAsrMadhabName');
  const subtitle = document.getElementById('prayerSettingsSubtitle');

  if (displayMethod) displayMethod.textContent = mObj.name;
  if (displayMadhab) displayMadhab.textContent = (curMadhab === 1) ? 'الحنفي (ظل الشيء مثليه)' : 'الجمهور (الشافعي، المالكي، الحنبلي)';
  if (subtitle) subtitle.textContent = `${mObj.name.split('–')[0].trim()} • ${(curMadhab === 1 ? 'الحنفي' : 'الجمهور')}`;

  // تحديث أرقام الصلوات في شاشة التعديل بالدقائق
  const pKeys = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  const offsets = savedLoc.prayerOffsets || {};
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

// 4. ربط وتفعيل النوافذ والشاشات التفاعلية
document.addEventListener('DOMContentLoaded', () => {
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

  let activeEditingOffsetPrayer = 'Fajr';
  let tempEditingOffsetValue = 0;

  // فتح شاشة إعدادات المواقيت
  if (openPrayerSettingsBtn) {
    openPrayerSettingsBtn.onclick = () => {
      syncPrayerSettingsUI();
      if (typeof showScreen === 'function') showScreen(screenPrayerSettings);
    };
  }
  if (backToGeneralSettingsFromPrayerBtn) {
    backToGeneralSettingsFromPrayerBtn.onclick = () => {
      if (typeof showScreen === 'function') showScreen(screenGeneralSettings);
    };
  }
  if (openPrayerOffsetsScreenBtn) {
    openPrayerOffsetsScreenBtn.onclick = () => {
      syncPrayerSettingsUI();
      if (typeof showScreen === 'function') showScreen(screenPrayerOffsets);
    };
  }
  if (backToPrayerSettingsFromOffsetsBtn) {
    backToPrayerSettingsFromOffsetsBtn.onclick = () => {
      if (typeof showScreen === 'function') showScreen(screenPrayerSettings);
    };
  }

  // نافذة طرق الحساب
  function renderCalculationMethodsList() {
    if (!calcMethodsListScroll) return;
    calcMethodsListScroll.innerHTML = '';
    const savedLoc = JSON.parse(localStorage.getItem('hayat_saved_location')) || {};
    const curId = savedLoc.method || 4;

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
        <button type="button" class="method-info-trigger-btn" title="معلومات الطريقة">ℹ️</button>
      `;

      row.onclick = (e) => {
        if (e.target.closest('.method-info-trigger-btn')) return;
        savedLoc.method = m.id;
        localStorage.setItem('hayat_saved_location', JSON.stringify(savedLoc));
        if (calcMethodModal) calcMethodModal.classList.remove('show');
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

  // نافذة مذهب العصر
  if (openAsrMadhabModalBtn) {
    openAsrMadhabModalBtn.onclick = () => {
      const savedLoc = JSON.parse(localStorage.getItem('hayat_saved_location')) || {};
      const curMadhab = savedLoc.asrMadhab || 0;
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

  document.querySelectorAll('.madhab-select-card').forEach(card => {
    card.onclick = () => {
      const val = parseInt(card.getAttribute('data-madhab'), 10);
      const savedLoc = JSON.parse(localStorage.getItem('hayat_saved_location')) || {};
      savedLoc.asrMadhab = val;
      localStorage.setItem('hayat_saved_location', JSON.stringify(savedLoc));
      if (asrMadhabModal) asrMadhabModal.classList.remove('show');
      if (typeof window.applyPrayerSettingsUpdate === 'function') {
        window.applyPrayerSettingsUpdate();
      }
    };
  });

  // نافذة تعديل دقيقة الصلاة (العداد التفاعلي)
  const prayerNamesAr = { Fajr: 'الفجر', Sunrise: 'الشروق', Dhuhr: 'الظهر', Asr: 'العصر', Maghrib: 'المغرب', Isha: 'العشاء' };

  document.querySelectorAll('.prayer-offset-item-row').forEach(row => {
    row.onclick = () => {
      activeEditingOffsetPrayer = row.getAttribute('data-prayer-key');
      const savedLoc = JSON.parse(localStorage.getItem('hayat_saved_location')) || {};
      const curVal = (savedLoc.prayerOffsets && savedLoc.prayerOffsets[activeEditingOffsetPrayer]) || 0;
      tempEditingOffsetValue = curVal;

      const titleEl = document.getElementById('offsetModalPrayerTitle');
      const numEl = document.getElementById('currentOffsetMinuteNum');
      
      let curTime = '--:--';
      if (typeof currentTimings !== 'undefined' && currentTimings && currentTimings[activeEditingOffsetPrayer]) {
        curTime = formatTo12Hour(currentTimings[activeEditingOffsetPrayer]);
      }

      if (titleEl) titleEl.textContent = `${prayerNamesAr[activeEditingOffsetPrayer]} ${curTime}`;
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
      const savedLoc = JSON.parse(localStorage.getItem('hayat_saved_location')) || {};
      if (!savedLoc.prayerOffsets) savedLoc.prayerOffsets = {};
      savedLoc.prayerOffsets[activeEditingOffsetPrayer] = tempEditingOffsetValue;
      localStorage.setItem('hayat_saved_location', JSON.stringify(savedLoc));

      if (singlePrayerOffsetSheet) singlePrayerOffsetSheet.classList.remove('show');
      syncPrayerSettingsUI();
      if (typeof window.applyPrayerSettingsUpdate === 'function') {
        window.applyPrayerSettingsUpdate();
      }
    };
  }

  if (closeMethodInfoBtn) {
    closeMethodInfoBtn.onclick = () => methodInfoModal.classList.remove('show');
  }

  syncPrayerSettingsUI();
});
